import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, NewsItem, ReactionType } from '../types';
import { INITIAL_USER_CREDITS } from '../constants';

export interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  news: NewsItem[];
  hasUnreadNews: boolean;
  login: (email: string, password_raw: string) => Promise<User>;
  logout: () => void;
  register: (firstName: string, lastName: string, email: string, password_raw: string, contactNumber: string, dateOfBirth: string, nickname?: string, referralCodeUsed?: string) => Promise<User>;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;
  spendCredit: () => void;
  setReferralCode: (userId: string, code: string) => Promise<void>;
  generateReferralCode: (userId: string) => Promise<void>;
  changePassword: (userId: string, oldPasswordRaw: string, newPasswordRaw: string) => Promise<void>;
  postNews: (title: string, content: string, imageUrl?: string, linkUrl?: string, linkText?: string, targetAccountTypes?: ('demo' | 'pro' | 'enterprise')[]) => void;
  editNews: (newsId: string, updates: { title: string; content: string; imageUrl?: string; linkUrl?: string; linkText?: string; targetAccountTypes?: ('demo' | 'pro' | 'enterprise')[] }) => void;
  deleteNews: (newsId: string) => void;
  markNewsAsRead: () => void;
  toggleReaction: (newsId: string, reaction: ReactionType) => void;
  restoreUsersFromBackup: (backupUsers: User[]) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [hasUnreadNews, setHasUnreadNews] = useState(false);

  const hashPassword = (password: string): string => {
    return `hashed_${password}_salt`;
  };

  // Initial load from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('goldtrade_users');
      let loadedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      let usersNeedUpdate = false;
      
      // Migrate old user objects to ensure new fields exist
      loadedUsers = loadedUsers.map(user => {
          if (
            !user.registrationTimestamp || 
            !user.hasOwnProperty('contactNumber') || 
            !user.hasOwnProperty('dateOfBirth') || 
            !user.hasOwnProperty('accountType') || 
            !user.hasOwnProperty('nickname') ||
            !user.hasOwnProperty('role') || // Ensure role exists
            (user.role === 'sub-admin' && !user.hasOwnProperty('consumedCredits')) // Ensure sub-admins have consumedCredits
          ) {
              usersNeedUpdate = true;
          }
          const migratedUser: User = {
            ...user,
            role: user.role || 'user',
            contactNumber: user.contactNumber || '',
            dateOfBirth: user.dateOfBirth || '',
            nickname: user.nickname || '',
            registrationTimestamp: user.registrationTimestamp || Date.now(),
            accountType: user.accountType || (user.role === 'admin' ? 'pro' : (user.credits > INITIAL_USER_CREDITS ? 'pro' : 'demo')),
            consumedCredits: user.consumedCredits || 0,
          };

          // Ensure admins and sub-admins have infinite credits
          if (migratedUser.role === 'admin' || migratedUser.role === 'sub-admin') {
            if (migratedUser.credits !== Infinity) {
              migratedUser.credits = Infinity;
              usersNeedUpdate = true;
            }
          }

          return migratedUser;
      });

      const adminIndex = loadedUsers.findIndex(u => u.email === 'admin@goldtrade.com');

      if (adminIndex !== -1) {
        let adminNeedsUpdate = false;
        // Admin credits are handled in AppWrapper
        if (loadedUsers[adminIndex].ownReferralCode) {
           delete loadedUsers[adminIndex].ownReferralCode;
           adminNeedsUpdate = true;
        }
        if (loadedUsers[adminIndex].accountType !== 'pro') {
           loadedUsers[adminIndex].accountType = 'pro';
           adminNeedsUpdate = true;
        }
         if (loadedUsers[adminIndex].role !== 'admin') {
           loadedUsers[adminIndex].role = 'admin';
           adminNeedsUpdate = true;
        }
        if(adminNeedsUpdate) usersNeedUpdate = true;

      } else {
        const adminUser: User = {
          id: 'admin_user_001',
          firstName: 'Admin',
          lastName: 'GoldTrade',
          email: 'admin@goldtrade.com',
          passwordHash: hashPassword('123456'),
          credits: Infinity, // Admins have infinite credits
          isBlocked: false,
          role: 'admin',
          contactNumber: '000000000',
          dateOfBirth: '1970-01-01',
          nickname: 'Admin',
          registrationTimestamp: Date.now(),
          accountType: 'pro',
          // ownReferralCode is intentionally omitted for admin
        };
        loadedUsers.push(adminUser);
        usersNeedUpdate = true;
      }
      
      setUsers(loadedUsers);
      if (usersNeedUpdate) {
        localStorage.setItem('goldtrade_users', JSON.stringify(loadedUsers));
      }

      const sessionUserStr = localStorage.getItem('goldtrade_session');
      if (sessionUserStr) {
        const sessionUser = JSON.parse(sessionUserStr);
        const fullUser = loadedUsers.find(u => u.id === sessionUser.id);
        if (fullUser && !fullUser.isBlocked) {
          // Sync session user with potentially updated full user data
          if (JSON.stringify(fullUser) !== JSON.stringify(sessionUser)) {
             localStorage.setItem('goldtrade_session', JSON.stringify(fullUser));
          }
          setCurrentUser(fullUser);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      }

      const storedNews = localStorage.getItem('goldtrade_news');
      const loadedNews = storedNews ? JSON.parse(storedNews) : [];
      setNews(loadedNews);

    } catch (error) {
      console.error("Failed to initialize auth state from localStorage:", error);
      localStorage.removeItem('goldtrade_users');
      localStorage.removeItem('goldtrade_session');
      localStorage.removeItem('goldtrade_news');
    }
  }, []);

  // Reactive check for unread news
  useEffect(() => {
    if (currentUser && news.length > 0) {
      const lastReadTimestamp = parseInt(localStorage.getItem(`goldtrade_lastReadNewsTimestamp_${currentUser.id}`) || '0', 10);
      const latestNewsTimestamp = news[0]?.timestamp || 0; // news is sorted desc
      setHasUnreadNews(latestNewsTimestamp > lastReadTimestamp);
    } else {
      setHasUnreadNews(false);
    }
  }, [news, currentUser]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('goldtrade_users', JSON.stringify(updatedUsers));
  };

  const saveNews = (updatedNews: NewsItem[]) => {
    const sortedNews = updatedNews.sort((a, b) => b.timestamp - a.timestamp);
    setNews(sortedNews);
    localStorage.setItem('goldtrade_news', JSON.stringify(sortedNews));
  };
  
  const login = (email: string, password_raw: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.passwordHash === hashPassword(password_raw)) {
        if (user.isBlocked) {
          reject(new Error("blocked"));
        } else {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('goldtrade_session', JSON.stringify(user));
          resolve(user);
        }
      } else {
        reject(new Error("invalid"));
      }
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setHasUnreadNews(false);
    localStorage.removeItem('goldtrade_session');
  };

  const register = (firstName: string, lastName: string, email: string, password_raw: string, contactNumber: string, dateOfBirth: string, nickname?: string, referralCodeUsed?: string): Promise<User> => {
      return new Promise((resolve, reject) => {
        const lowerCaseEmail = email.toLowerCase();
        const lowerCaseNickname = nickname?.trim().toLowerCase();

        if (!lowerCaseEmail.endsWith('@gmail.com') && !lowerCaseEmail.endsWith('@hotmail.com')) {
          return reject(new Error("invalid_domain"));
        }
        if (users.some(u => u.email.toLowerCase() === lowerCaseEmail || (u.contactNumber && u.contactNumber === contactNumber))) {
            return reject(new Error("exists"));
        }
        if (lowerCaseNickname && users.some(u => u.nickname?.toLowerCase() === lowerCaseNickname)) {
            return reject(new Error("nickname_taken"));
        }

        const newUser: User = {
            id: `user_${Date.now()}`,
            firstName,
            lastName,
            email,
            nickname: nickname?.trim() || undefined,
            passwordHash: hashPassword(password_raw),
            credits: INITIAL_USER_CREDITS,
            isBlocked: false,
            role: 'user',
            contactNumber,
            dateOfBirth,
            registrationTimestamp: Date.now(),
            accountType: 'demo',
            referralCodeUsed: referralCodeUsed?.trim().toUpperCase() || undefined,
        };

        const updatedUsers = [...users, newUser];
        saveUsers(updatedUsers);
        
        // Do NOT log the user in automatically after registration
        // Let them log in manually from the login page.
        resolve(newUser);
      });
  };
  
  const updateUser = (updatedUser: User) => {
    const originalUser = users.find(u => u.id === updatedUser.id);

    // Handle role change side-effects
    if (originalUser && originalUser.role !== updatedUser.role) {
      if (updatedUser.role === 'sub-admin') {
        updatedUser.credits = Infinity;
        updatedUser.consumedCredits = updatedUser.consumedCredits || 0;
      } else if (updatedUser.role === 'user') {
        // When demoting, reset credits to default.
        updatedUser.credits = INITIAL_USER_CREDITS;
      }
    }
    
    // Automatically upgrade account type from demo to paid if credits exceed 30
    if (updatedUser.accountType === 'demo' && updatedUser.credits > 30) {
      updatedUser.accountType = 'pro';
    }

    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    saveUsers(updatedUsers);

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('goldtrade_session', JSON.stringify(updatedUser));
      if (updatedUser.isBlocked) {
        logout();
      }
    }
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    if (currentUser && currentUser.id === userId) {
      logout();
    }
  };

  const spendCredit = () => {
    if (!currentUser) return;
    
    if (currentUser.role === 'admin') {
      return;
    }
    
    if (currentUser.role === 'sub-admin') {
      const updatedUser: User = { 
        ...currentUser, 
        consumedCredits: (currentUser.consumedCredits || 0) + 1 
      };
      updateUser(updatedUser);
      return;
    }
    
    if (currentUser.role === 'user' && currentUser.credits > 0) {
      const updatedUser = { ...currentUser, credits: currentUser.credits - 1 };
      updateUser(updatedUser);
    }
  };
  
  const setReferralCode = (userId: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const upperCaseCode = code.trim().toUpperCase();

      if (upperCaseCode.length !== 6) { return reject(new Error("length_invalid")); }
      if (!/^[A-Z0-9]+$/.test(upperCaseCode)) { return reject(new Error("format_invalid")); }

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) { return reject(new Error("User not found")); }
      
      const userToUpdate = users[userIndex];
      if (userToUpdate.ownReferralCode) { return reject(new Error("already_set")); }

      if (users.some(u => u.ownReferralCode === upperCaseCode)) {
          return reject(new Error("code_taken"));
      }

      const updatedUser = { ...userToUpdate, ownReferralCode: upperCaseCode };
      
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      saveUsers(updatedUsers);

      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
        localStorage.setItem('goldtrade_session', JSON.stringify(updatedUser));
      }
      
      resolve();
    });
  };
  
  const generateReferralCode = (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) { return reject(new Error("User not found")); }
        
        const userToUpdate = users[userIndex];
        if (userToUpdate.ownReferralCode) { return reject(new Error("already_set")); }

        let newCode = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let isUnique = false;

        while (!isUnique) {
            newCode = '';
            for (let i = 0; i < 6; i++) {
                newCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            if (!users.some(u => u.ownReferralCode === newCode)) {
                isUnique = true;
            }
        }
        
        const updatedUser = { ...userToUpdate, ownReferralCode: newCode };
        const updatedUsers = [...users];
        updatedUsers[userIndex] = updatedUser;
        saveUsers(updatedUsers);

        if (currentUser && currentUser.id === userId) {
            setCurrentUser(updatedUser);
            localStorage.setItem('goldtrade_session', JSON.stringify(updatedUser));
        }
        
        resolve();
    });
};


  const changePassword = (userId: string, oldPasswordRaw: string, newPasswordRaw: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return reject(new Error("User not found."));
      }
      
      const user = users[userIndex];
      if (user.passwordHash !== hashPassword(oldPasswordRaw)) {
        return reject(new Error("invalid_current_password"));
      }

      const updatedUser = {
        ...user,
        passwordHash: hashPassword(newPasswordRaw),
      };

      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      saveUsers(updatedUsers);

      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
        localStorage.setItem('goldtrade_session', JSON.stringify(updatedUser));
      }

      resolve();
    });
  };

  const postNews = (title: string, content: string, imageUrl?: string, linkUrl?: string, linkText?: string, targetAccountTypes?: ('demo' | 'pro' | 'enterprise')[]) => {
    if (currentUser?.role !== 'admin') return;

    const newNewsItem: NewsItem = {
      id: `news_${Date.now()}`,
      title,
      content,
      timestamp: Date.now(),
      imageUrl: imageUrl?.trim() ? imageUrl.trim() : undefined,
      linkUrl: linkUrl?.trim() ? linkUrl.trim() : undefined,
      linkText: linkUrl?.trim() && linkText?.trim() ? linkText.trim() : undefined,
      reactions: { like: 0, wow: 0, sad: 0, funny: 0 },
      reactedBy: {},
      targetAccountTypes: targetAccountTypes,
    };
    saveNews([newNewsItem, ...news]);
  };

  const editNews = (newsId: string, updates: { title: string; content: string; imageUrl?: string; linkUrl?: string; linkText?: string; targetAccountTypes?: ('demo' | 'pro' | 'enterprise')[] }) => {
    if (currentUser?.role !== 'admin') return;

    const newsIndex = news.findIndex(n => n.id === newsId);
    if (newsIndex === -1) return;

    const updatedNews = [...news];
    const oldNewsItem = updatedNews[newsIndex];
    
    const newNewsItem: NewsItem = {
      ...oldNewsItem,
      title: updates.title,
      content: updates.content,
      imageUrl: updates.imageUrl?.trim() ? updates.imageUrl.trim() : undefined,
      linkUrl: updates.linkUrl?.trim() ? updates.linkUrl.trim() : undefined,
      linkText: updates.linkUrl?.trim() && updates.linkText?.trim() ? updates.linkText.trim() : undefined,
      targetAccountTypes: updates.targetAccountTypes,
    };
    
    updatedNews[newsIndex] = newNewsItem;
    saveNews(updatedNews);
  };

  const deleteNews = (newsId: string) => {
    if (currentUser?.role !== 'admin') return;
    const updatedNews = news.filter(n => n.id !== newsId);
    saveNews(updatedNews);
  };
  
  const markNewsAsRead = () => {
    if (currentUser) {
      localStorage.setItem(`goldtrade_lastReadNewsTimestamp_${currentUser.id}`, Date.now().toString());
      setHasUnreadNews(false);
    }
  };

  const toggleReaction = (newsId: string, reaction: ReactionType) => {
    if (!currentUser) return;
    const newsIndex = news.findIndex(n => n.id === newsId);
    if (newsIndex === -1) return;

    const updatedNews = [...news];
    const newsItem = { ...updatedNews[newsIndex] };
    newsItem.reactedBy = { ...newsItem.reactedBy };
    newsItem.reactions = { ...newsItem.reactions };
    
    const existingReaction = newsItem.reactedBy[currentUser.id];

    if (existingReaction === reaction) {
      delete newsItem.reactedBy[currentUser.id];
      if (newsItem.reactions[reaction] > 0) {
        newsItem.reactions[reaction]--;
      }
    } else {
      if (existingReaction) {
        if (newsItem.reactions[existingReaction] > 0) {
          newsItem.reactions[existingReaction]--;
        }
      }
      newsItem.reactedBy[currentUser.id] = reaction;
      newsItem.reactions[reaction]++;
    }

    updatedNews[newsIndex] = newsItem;
    saveNews(updatedNews);
  };

  const restoreUsersFromBackup = (backupUsers: User[]) => {
    // Preserve the currently logged-in admin user to prevent lockout.
    const currentAdmin = users.find(u => u.id === currentUser?.id && u.role === 'admin');
    
    if (!currentAdmin) {
      console.error("Cannot perform backup restoration without a logged-in admin. This should not happen.");
      // This is a safeguard; the UI should prevent this.
      return;
    }

    const finalUsers = [...backupUsers, currentAdmin];
    saveUsers(finalUsers);
  };


  return (
    <AuthContext.Provider value={{ currentUser, users, isAuthenticated, news, hasUnreadNews, login, logout, register, updateUser, deleteUser, spendCredit, setReferralCode, generateReferralCode, changePassword, postNews, editNews, deleteNews, markNewsAsRead, toggleReaction, restoreUsersFromBackup }}>
      {children}
    </AuthContext.Provider>
  );
};