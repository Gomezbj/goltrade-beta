import React, { useContext, useState, ChangeEvent, useEffect, useMemo } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import UserGroupIcon from './icons/UserGroupIcon';
import TrashIcon from './icons/TrashIcon';
import NoSymbolIcon from './icons/NoSymbolIcon';
import KeyIcon from './icons/KeyIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import LockClosedIcon from './icons/LockClosedIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { NewsItem, User } from '../types';
import ArrowTopRightOnSquareIcon from './icons/ArrowTopRightOnSquareIcon';
import XMarkIcon from './icons/XMarkIcon';
import PencilIcon from './icons/PencilIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import AdminStats from './AdminStats';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import DiamondIcon from './icons/DiamondIcon';
import BuildingOffice2Icon from './icons/BuildingOffice2Icon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import InfinityIcon from './icons/InfinityIcon';


type AdminDashboardTab = 'users' | 'news';
type Audience = 'all' | 'demo' | 'pro_enterprise';

const AdminDashboard: React.FC = () => {
  const { users, currentUser, updateUser, deleteUser, changePassword, news, postNews, editNews, deleteNews, restoreUsersFromBackup } = useContext(AuthContext) as AuthContextType;
  const { t, currentLanguage } = useTranslations();
  
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('users');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [editingNewsItem, setEditingNewsItem] = useState<NewsItem | null>(null);


  const openEditModal = (newsItem: NewsItem) => {
    setEditingNewsItem(newsItem);
    setIsEditModalOpen(true);
  };
  
  const openUserDetailsModal = (user: User) => {
    setSelectedUserForDetails(user);
    setIsUserDetailsModalOpen(true);
  };

  const handleDownloadBackup = () => {
      const headers = [
        'id', 'firstName', 'lastName', 'email', 'nickname', 'credits', 'isBlocked', 
        'role', 'contactNumber', 'dateOfBirth', 'registrationTimestamp', 
        'profilePictureUrl', 'referralCodeUsed', 'ownReferralCode', 'accountType', 'consumedCredits'
      ];
      // IMPORTANT: Exclude the admin user from the public backup
      const usersToExport = users.filter(u => u.role !== 'admin');
      
      const sanitizeField = (field: any): string => {
        if (field === null || typeof field === 'undefined') return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = usersToExport.map(user => 
        headers.map(header => sanitizeField((user as any)[header])).join(',')
      );

      const csvString = [headers.join(','), ...csvRows].join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `goldtrade_users_backup_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleUploadBackup = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert(t('adminBackupInvalidFile'));
            return;
        }

        if (!window.confirm(t('adminUploadBackupWarning'))) {
            event.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 1) throw new Error("CSV is empty or invalid");

                const headers = rows[0].trim().split(',').map(h => h.replace(/"/g, ''));
                const backupUsers: User[] = [];
                
                // Essential headers check
                const requiredHeaders = ['id', 'email', 'firstName', 'lastName'];
                if (!requiredHeaders.every(h => headers.includes(h))) {
                    throw new Error("CSV headers are missing required columns.");
                }

                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].trim().split(',');
                    if (values.length !== headers.length) continue; 

                    const userObject: any = {};
                    headers.forEach((header, index) => {
                        userObject[header] = values[index].replace(/"/g, '');
                    });
                    
                    let accountType: 'demo' | 'pro' | 'enterprise' = 'demo';
                    if (userObject.accountType === 'pro') accountType = 'pro';
                    else if (userObject.accountType === 'enterprise') accountType = 'enterprise';
                    
                    let role: 'user' | 'sub-admin' = 'user';
                    if (userObject.role === 'sub-admin') role = 'sub-admin';


                    const restoredUser: User = {
                        id: userObject.id,
                        firstName: userObject.firstName,
                        lastName: userObject.lastName,
                        email: userObject.email,
                        nickname: userObject.nickname || undefined,
                        passwordHash: 'restored_account_password_reset_required',
                        credits: role === 'sub-admin' ? Infinity : (parseInt(userObject.credits, 10) || 0),
                        isBlocked: userObject.isBlocked === 'true',
                        role: role,
                        contactNumber: userObject.contactNumber,
                        dateOfBirth: userObject.dateOfBirth,
                        registrationTimestamp: parseInt(userObject.registrationTimestamp, 10) || Date.now(),
                        profilePictureUrl: userObject.profilePictureUrl || undefined,
                        referralCodeUsed: userObject.referralCodeUsed || undefined,
                        ownReferralCode: userObject.ownReferralCode || undefined,
                        accountType: accountType,
                        consumedCredits: parseInt(userObject.consumedCredits, 10) || 0
                    };
                    
                    backupUsers.push(restoredUser);
                }
                
                restoreUsersFromBackup(backupUsers);
                alert(t('adminBackupUploadSuccess'));

            } catch (error) {
                console.error("Error processing backup file:", error);
                alert(`${t('adminBackupUploadError')} ${error instanceof Error ? error.message : ''}`);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

  const TabButton: React.FC<{tabId: AdminDashboardTab; titleKey: string; Icon: React.FC<any>}> = ({ tabId, titleKey, Icon}) => (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800 focus:ring-primary-500 transition-colors
          ${activeTab === tabId 
            ? 'bg-primary-600 text-white shadow-md' 
            : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
          }`}
      >
        <Icon className="w-5 h-5"/>
        <span>{t(titleKey as any)}</span>
      </button>
  );
  
  const usersToDisplay = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return users.filter(u => u.role !== 'admin');
    }
    if (currentUser.role === 'sub-admin') {
      return users.filter(u => 
        u.referralCodeUsed === currentUser.ownReferralCode && // Only their referred users
        u.role !== 'admin' &&                                 // Exclude main admin
        u.id !== currentUser.id                               // Exclude themselves
      );
    }
    return [];
  }, [users, currentUser]);

  const UserManagementPanel = () => {
    const [addCreditValues, setAddCreditValues] = useState<Record<string, number>>({});
    const [referralFilter, setReferralFilter] = useState('');
    const [nicknameFilter, setNicknameFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredUsers = useMemo(() => {
        const filtered = usersToDisplay.filter(user => {
            const referralMatch = !referralFilter || user.referralCodeUsed?.toLowerCase() === referralFilter.toLowerCase();
            const nicknameMatch = !nicknameFilter || (user.nickname && user.nickname.toLowerCase().includes(nicknameFilter.toLowerCase()));
            return referralMatch && nicknameMatch;
        });

        return filtered.sort((a, b) => {
            if (sortOrder === 'newest') {
                return (b.registrationTimestamp || 0) - (a.registrationTimestamp || 0);
            } else {
                return (a.registrationTimestamp || 0) - (b.registrationTimestamp || 0);
            }
        });
    }, [usersToDisplay, referralFilter, nicknameFilter, sortOrder]);

    const handleAddCredits = (userId: string) => {
      const amount = addCreditValues[userId] || 0;
      if (amount <= 0) return;
      const userToUpdate = users.find(u => u.id === userId);
      if (userToUpdate) {
        updateUser({ ...userToUpdate, credits: userToUpdate.credits + amount });
        setAddCreditValues({ ...addCreditValues, [userId]: 0 });
      }
    };

    const handleSubtractCredits = (userId: string) => {
        const amount = addCreditValues[userId] || 0;
        if (amount <= 0) return;
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, credits: Math.max(0, userToUpdate.credits - amount) });
            setAddCreditValues({ ...addCreditValues, [userId]: 0 });
        }
    };

    const handleSetAccountType = (userId: string, newType: 'demo' | 'pro' | 'enterprise') => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, accountType: newType });
        }
    };
    
    const handleSetRole = (userId: string, newRole: 'user' | 'sub-admin') => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, role: newRole });
        }
    };

    const handleToggleBlock = (userId: string) => {
      const userToUpdate = users.find(u => u.id === userId);
      if (userToUpdate) {
        updateUser({ ...userToUpdate, isBlocked: !userToUpdate.isBlocked });
      }
    };

    const handleDeleteUser = (userId: string) => {
      if (window.confirm(t('adminDeleteUserConfirm'))) {
        deleteUser(userId);
      }
    };

    const formatDate = (timestamp: number) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    return (
      <div className="mt-6 space-y-6">
        <AdminStats users={usersToDisplay} currentUser={currentUser} />
        <div className="bg-secondary-800 shadow-xl rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-secondary-700">
            <h2 className="text-xl font-semibold text-primary-300">{t('adminUsersTableTitle')}</h2>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
               <div className="relative max-w-xs">
                  <input
                      type="text"
                      value={referralFilter}
                      onChange={(e) => setReferralFilter(e.target.value)}
                      placeholder={t('adminFilterByReferralPlaceholder')}
                      className="w-full p-2 pl-4 pr-10 bg-secondary-700 border border-secondary-600 rounded-lg text-white focus:ring-primary-500 focus:border-primary-500"
                  />
                  {referralFilter && (
                      <button onClick={() => setReferralFilter('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-white" title={t('adminClearFilter')}>
                          <XMarkIcon className="h-5 w-5"/>
                      </button>
                  )}
               </div>
               <div className="relative max-w-xs">
                  <input
                      type="text"
                      value={nicknameFilter}
                      onChange={(e) => setNicknameFilter(e.target.value)}
                      placeholder={t('adminFilterByNicknamePlaceholder')}
                      className="w-full p-2 pl-4 pr-10 bg-secondary-700 border border-secondary-600 rounded-lg text-white focus:ring-primary-500 focus:border-primary-500"
                  />
                  {nicknameFilter && (
                      <button onClick={() => setNicknameFilter('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-white" title={t('adminClearFilter')}>
                          <XMarkIcon className="h-5 w-5"/>
                      </button>
                  )}
               </div>
               <div className="relative max-w-xs">
                    <label htmlFor="sort-order" className="sr-only">{t('adminSortByDate')}</label>
                    <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="w-full p-2.5 pl-3 pr-8 bg-secondary-700 border border-secondary-600 rounded-lg text-white focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="newest">{t('adminSortNewestFirst')}</option>
                        <option value="oldest">{t('adminSortOldestFirst')}</option>
                    </select>
                </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-700">
              <thead className="bg-secondary-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadUser')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadNickname')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadCredits')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadReferredBy')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadStatus')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminRegistrationDate')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">{t('adminTableHeadActions')}</th>
                </tr>
              </thead>
              <tbody className="bg-secondary-800 divide-y divide-secondary-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-700/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-secondary-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                        {user.nickname || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-primary-400">
                        {user.credits === Infinity ? <InfinityIcon className="w-6 h-6 text-gold-400" /> : user.credits}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300 font-mono">
                      {user.referralCodeUsed || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div>
                        {user.isBlocked ? (
                          <span className="px-2 inline-flex leading-5 font-semibold rounded-full bg-red-900 text-red-200">{t('adminStatusBlocked')}</span>
                        ) : (
                          <span className="px-2 inline-flex leading-5 font-semibold rounded-full bg-green-900 text-green-200">{t('adminStatusActive')}</span>
                        )}
                      </div>
                       <div className="mt-1">
                        {user.role === 'sub-admin' ? (
                            <span className="px-2 inline-flex items-center space-x-1 leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                <span>{t('userStatusSubAdmin')}</span>
                            </span>
                        ) : user.accountType === 'enterprise' ? (
                          <span className="px-2 inline-flex items-center space-x-1 leading-5 font-semibold rounded-full bg-indigo-500/20 text-indigo-300">
                            <BuildingOffice2Icon className="w-3.5 h-3.5"/>
                            <span>{t('userStatusEnterprise')}</span>
                          </span>
                         ) : user.accountType === 'pro' ? (
                          <span className="px-2 inline-flex items-center space-x-1 leading-5 font-semibold rounded-full bg-gold-500/20 text-gold-300">
                            <DiamondIcon className="w-3 h-3"/>
                            <span>{t('userStatusPro')}</span>
                          </span>
                        ) : (
                          <span className="px-2 inline-flex leading-5 font-semibold rounded-full bg-gray-600 text-gray-200">{t('userStatusDemo')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-300">
                      {formatDate(user.registrationTimestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <button onClick={() => openUserDetailsModal(user)} className="p-2 rounded-full hover:bg-secondary-600" title={t('adminActionDetails')}>
                          <IdentificationIcon className="w-5 h-5 text-blue-400" />
                        </button>
                        
                        {currentUser?.role === 'admin' && (
                           <>
                           <select
                              value={user.role}
                              onChange={(e) => handleSetRole(user.id, e.target.value as any)}
                              className="w-28 p-1.5 text-xs border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-secondary-700 text-white"
                              aria-label={`Role for ${user.firstName}`}
                              title={t('adminRoleLabel')}
                            >
                                <option value="user">User</option>
                                <option value="sub-admin">Sub-Admin</option>
                            </select>
                           
                            <select
                              value={user.accountType}
                              onChange={(e) => handleSetAccountType(user.id, e.target.value as any)}
                              className="w-28 p-1.5 text-xs border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-secondary-700 text-white"
                              aria-label={`Account type for ${user.firstName}`}
                              title={t('adminAccountTypeLabel')}
                            >
                                <option value="demo">{t('userStatusDemo')}</option>
                                <option value="pro">{t('userStatusPro')}</option>
                                <option value="enterprise">{t('userStatusEnterprise')}</option>
                            </select>

                            <div className="flex items-center space-x-1">
                                <CreditCardIcon className="w-5 h-5 text-secondary-400" />
                                <input type="number" min="0" value={addCreditValues[user.id] || ''} onChange={(e) => setAddCreditValues({ ...addCreditValues, [user.id]: parseInt(e.target.value) || 0 })} className="w-16 p-1 bg-secondary-700 border border-secondary-600 rounded-md text-white text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="0" aria-label={`Add credits to ${user.firstName}`} disabled={user.role === 'admin' || user.role === 'sub-admin'}/>
                                <button onClick={() => handleAddCredits(user.id)} className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-bold disabled:opacity-50" title={t('adminActionAddCredits')} disabled={user.role === 'admin' || user.role === 'sub-admin'}>+</button>
                                <button onClick={() => handleSubtractCredits(user.id)} className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-bold disabled:opacity-50" title={t('adminActionSubtractCredits')} disabled={user.role === 'admin' || user.role === 'sub-admin'}>-</button>
                            </div>
                            <button onClick={() => handleToggleBlock(user.id)} className="p-2 rounded-full hover:bg-secondary-600" title={user.isBlocked ? t('adminActionUnblock') : t('adminActionBlock')}>
                                {user.isBlocked ? <KeyIcon className="w-5 h-5 text-yellow-400" /> : <NoSymbolIcon className="w-5 h-5 text-yellow-500" />}
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-full hover:bg-secondary-600" title={t('adminActionDelete')}>
                                <TrashIcon className="w-5 h-5 text-red-500" />
                            </button>
                           </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-secondary-400">No registered users found{referralFilter || nicknameFilter ? ' for this filter' : ''}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const NewsPublisherPanel = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [targetAudience, setTargetAudience] = useState<Audience>('all');

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            alert(t('imageUploaderErrorInvalidType')); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert(t('imageUploaderErrorTooLarge')); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageDataUrl(reader.result as string);
            setImageUrlInput('');
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageDataUrl(null);
        setImageUrlInput('');
        const fileInput = document.getElementById('news-image-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
    };

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        
        const finalImageUrl = imageDataUrl || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);

        let targetAccountTypes: ('demo' | 'pro' | 'enterprise')[] | undefined = undefined;
        if (targetAudience === 'demo') {
            targetAccountTypes = ['demo'];
        } else if (targetAudience === 'pro_enterprise') {
            targetAccountTypes = ['pro', 'enterprise'];
        }

        postNews(title, content, finalImageUrl, linkUrl, linkText, targetAccountTypes);
        
        setTitle('');
        setContent('');
        setLinkUrl('');
        setLinkText('');
        setTargetAudience('all');
        clearImage();
    };

    const handleDeleteNews = (id: string) => {
        if (window.confirm(t('adminNewsDeleteConfirm'))) {
            deleteNews(id);
        }
    };

    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(currentLanguage, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-secondary-800 shadow-xl rounded-xl p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-primary-300 mb-4">{t('adminNewsPublisherTitle')}</h2>
                <form onSubmit={handlePublish} className="space-y-4">
                    <div>
                        <label htmlFor="news-title" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsTitleLabel')}</label>
                        <input type="text" id="news-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500" required />
                    </div>
                    <div>
                        <label htmlFor="news-content" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsContentLabel')}</label>
                        <textarea id="news-content" value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500" required />
                    </div>

                    <fieldset>
                        <legend className="block text-sm font-medium text-secondary-300 mb-2">{t('adminNewsTargetAudience')}</legend>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <RadioOption id="audience-all" name="audience" value="all" checked={targetAudience === 'all'} onChange={setTargetAudience} label={t('adminNewsAudienceAll')} />
                            <RadioOption id="audience-demo" name="audience" value="demo" checked={targetAudience === 'demo'} onChange={setTargetAudience} label={t('adminNewsAudienceDemo')} />
                            <RadioOption id="audience-pro" name="audience" value="pro_enterprise" checked={targetAudience === 'pro_enterprise'} onChange={setTargetAudience} label={t('adminNewsAudiencePro')} />
                        </div>
                    </fieldset>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-secondary-300">{t('adminNewsImageSectionTitle')}</label>
                        <input type="url" id="news-image-url" value={imageUrlInput} onChange={e => { setImageUrlInput(e.target.value); if (e.target.value) setImageDataUrl(null); }} placeholder={t('adminNewsImageUrlLabel')} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50" disabled={!!imageDataUrl} />
                        
                        <div className="flex items-center justify-center w-full">
                            <hr className="w-full border-secondary-600" />
                            <span className="px-2 text-xs text-secondary-400 bg-secondary-800">{t('adminNewsOrSeparator')}</span>
                            <hr className="w-full border-secondary-600" />
                        </div>
                        
                        <label htmlFor="news-image-upload" className={`mt-1 flex justify-center items-center px-6 py-3 border-2 border-secondary-600 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors group ${!!imageUrlInput ? 'opacity-50 cursor-not-allowed' : ''}`}>
                             <span className="text-sm text-secondary-400 group-hover:text-primary-300">{t('adminNewsImageUploadPrompt')}</span>
                            <input id="news-image-upload" name="news-image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp, image/gif" disabled={!!imageUrlInput}/>
                        </label>
                        
                        {(imageDataUrl || imageUrlInput) && (
                            <div className="flex items-center space-x-3 bg-secondary-700 p-2 rounded-lg">
                                <img src={imageDataUrl || imageUrlInput} alt="Preview" className="w-12 h-12 object-cover rounded-md border border-secondary-600"/>
                                <button type="button" onClick={clearImage} className="text-red-400 hover:text-red-300 text-xs p-1 flex-shrink-0" aria-label={t('removeButtonLabel')}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        )}
                    </div>
                     
                    <div>
                        <label htmlFor="news-link-url" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsLinkUrlLabel')}</label>
                        <input type="url" id="news-link-url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com/more-info" className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    {linkUrl && (
                        <div>
                            <label htmlFor="news-link-text" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsLinkTextLabel')}</label>
                            <input type="text" id="news-link-text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder={t('newsPanelDefaultLinkText')} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                    )}
                    <div className="pt-2">
                        <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50 flex items-center">
                            <NewspaperIcon className="w-5 h-5 mr-2" />
                            {t('adminNewsPublishButton')}
                        </button>
                    </div>
                </form>
            </div>
             <div className="bg-secondary-800 shadow-xl rounded-xl">
                <h2 className="text-xl font-semibold text-primary-300 p-4 sm:p-6 border-b border-secondary-700">{t('adminNewsCurrentNews')}</h2>
                <div className="max-h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">
                    {news.length > 0 ? news.map(item => (
                        <div key={item.id} className="bg-secondary-700/50 p-3 rounded-lg relative">
                             <div className="absolute top-2 right-2 flex space-x-1">
                                <button onClick={() => openEditModal(item)} className="p-1 text-secondary-400 hover:text-primary-400" title={t('adminActionEdit')}>
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteNews(item.id)} className="p-1 text-secondary-400 hover:text-red-400" title={t('adminActionDelete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="font-semibold text-primary-400 pr-12">{item.title}</h3>
                            {item.targetAccountTypes && (
                                <div className="text-xs font-semibold px-2 py-0.5 mt-1 rounded-full inline-block bg-primary-700/50 text-primary-300 border border-primary-600/50">
                                    {item.targetAccountTypes.includes('demo') ? t('adminNewsAudienceDemo') : t('adminNewsAudiencePro')}
                                </div>
                            )}
                            {item.imageUrl && (
                               <div className="my-2 flex justify-center bg-secondary-800/20 p-1 rounded-md">
                                    <img src={item.imageUrl} alt={item.title} className="max-w-full h-auto object-contain rounded-md border border-secondary-600" style={{maxHeight: '12rem'}}/>
                               </div>
                            )}
                            <p className="text-sm text-secondary-300 mt-1 whitespace-pre-wrap">{item.content}</p>
                            {item.linkUrl && (
                                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-3 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-md hover:bg-primary-700 transition-colors">
                                    {item.linkText || t('newsPanelDefaultLinkText')}
                                    <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1.5" />
                                </a>
                            )}
                            <p className="text-xs text-secondary-500 mt-2">{formatDate(item.timestamp)}</p>
                        </div>
                    )) : (
                        <p className="text-secondary-400 text-center py-4">{t('newsPanelEmpty')}</p>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const UserDetailsModal: React.FC<{user: User, onClose: () => void}> = ({ user, onClose }) => {
    const DetailItem: React.FC<{labelKey: string, value?: string | number}> = ({labelKey, value}) => (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-secondary-400">{t(labelKey as any)}</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{value ?? 'N/A'}</dd>
        </div>
    );
    const accountTypeText = user.accountType === 'pro' 
        ? t('userStatusPro') 
        : user.accountType === 'enterprise' 
            ? t('userStatusEnterprise') 
            : t('userStatusDemo');
    const statusText = user.isBlocked ? t('adminStatusBlocked') : t('adminStatusActive');
    const roleText = user.role === 'sub-admin' ? t('userStatusSubAdmin') : 'User';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" onClick={onClose}>
            <div className="w-full max-w-lg bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-700 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b border-secondary-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                        <IdentificationIcon className="w-6 h-6 mr-3 text-primary-400"/>
                        {t('userDetailsModalTitle')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-700 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="flex items-center space-x-4 mb-6">
                        <img src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=1d4ed8&color=fff`} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-primary-500 shadow-md"/>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</h3>
                            <p className="text-secondary-300">{user.email}</p>
                        </div>
                    </div>
                    <dl className="divide-y divide-secondary-700">
                        <DetailItem labelKey="nicknameLabel" value={user.nickname} />
                        <DetailItem labelKey="adminRoleLabel" value={roleText} />
                        <DetailItem labelKey="registerLabelContactNumber" value={user.contactNumber} />
                        <DetailItem labelKey="registerLabelDateOfBirth" value={user.dateOfBirth} />
                        <DetailItem labelKey="adminRegistrationDate" value={new Date(user.registrationTimestamp).toLocaleString(currentLanguage)} />
                        <DetailItem labelKey="usedReferralCodeLabel" value={user.referralCodeUsed} />
                        <DetailItem labelKey="yourReferralCodeLabel" value={user.ownReferralCode} />
                        <DetailItem labelKey="creditsLabel" value={user.credits === Infinity ? 'Unlimited' : user.credits.toString()} />
                        {user.role === 'sub-admin' && <DetailItem labelKey="userDetailsConsumedCredits" value={user.consumedCredits || 0} />}
                        <DetailItem labelKey="adminTableHeadStatus" value={statusText} />
                        <DetailItem labelKey="adminAccountTypeLabel" value={accountTypeText} />
                    </dl>
                </div>
                 <div className="p-4 bg-secondary-800/50 border-t border-secondary-700 flex-shrink-0 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-secondary-600 text-secondary-100 font-semibold rounded-lg hover:bg-secondary-500 transition-colors">
                       Close
                    </button>
                </div>
            </div>
        </div>
    );
  };
  
   const EditNewsModal: React.FC<{newsItem: NewsItem, onClose: () => void}> = ({ newsItem, onClose }) => {
    const [title, setTitle] = useState(newsItem.title);
    const [content, setContent] = useState(newsItem.content);
    const [imageUrlInput, setImageUrlInput] = useState(newsItem.imageUrl && !newsItem.imageUrl.startsWith('data:') ? newsItem.imageUrl : '');
    const [imageDataUrl, setImageDataUrl] = useState(newsItem.imageUrl && newsItem.imageUrl.startsWith('data:') ? newsItem.imageUrl : null);
    const [linkUrl, setLinkUrl] = useState(newsItem.linkUrl || '');
    const [linkText, setLinkText] = useState(newsItem.linkText || '');
    const [targetAudience, setTargetAudience] = useState<Audience>(() => {
        const targets = newsItem.targetAccountTypes;
        if (targets?.length === 1 && targets[0] === 'demo') {
            return 'demo';
        }
        if (targets?.includes('pro') || targets?.includes('enterprise')) {
            return 'pro_enterprise';
        }
        return 'all';
    });
    
    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        const finalImageUrl = imageDataUrl || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);
        
        let targetAccountTypes: ('demo' | 'pro' | 'enterprise')[] | undefined = undefined;
        if (targetAudience === 'demo') {
            targetAccountTypes = ['demo'];
        } else if (targetAudience === 'pro_enterprise') {
            targetAccountTypes = ['pro', 'enterprise'];
        }

        editNews(newsItem.id, { title, content, imageUrl: finalImageUrl, linkUrl, linkText, targetAccountTypes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-700 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b border-secondary-700 flex justify-between items-center">
                     <h2 className="text-xl font-semibold text-white">{t('adminEditNewsModalTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-700 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveChanges} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                     <div>
                        <label htmlFor="edit-news-title" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsTitleLabel')}</label>
                        <input type="text" id="edit-news-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg" required />
                    </div>
                    <div>
                        <label htmlFor="edit-news-content" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminNewsContentLabel')}</label>
                        <textarea id="edit-news-content" value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full p-2 bg-secondary-700 border border-secondary-600 text-white rounded-lg" required />
                    </div>
                     <fieldset>
                        <legend className="block text-sm font-medium text-secondary-300 mb-2">{t('adminNewsTargetAudience')}</legend>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <RadioOption id="edit-audience-all" name="edit-audience" value="all" checked={targetAudience === 'all'} onChange={setTargetAudience} label={t('adminNewsAudienceAll')} />
                            <RadioOption id="edit-audience-demo" name="edit-audience" value="demo" checked={targetAudience === 'demo'} onChange={setTargetAudience} label={t('adminNewsAudienceDemo')} />
                            <RadioOption id="edit-audience-pro" name="edit-audience" value="pro_enterprise" checked={targetAudience === 'pro_enterprise'} onChange={setTargetAudience} label={t('adminNewsAudiencePro')} />
                        </div>
                    </fieldset>
                    {/* Simplified Image/Link editing for brevity, full implementation would mirror publisher */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary-600 rounded-lg hover:bg-secondary-500 font-semibold">{t('adminClearFilter')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold">{t('adminButtonSaveChanges')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
  }

const RadioOption: React.FC<{id:string, name:string, value:Audience, checked:boolean, onChange:(v:Audience)=>void, label:string}> = 
({id, name, value, checked, onChange, label}) => (
    <div className="flex items-center">
        <input 
            id={id} 
            name={name} 
            type="radio" 
            value={value}
            checked={checked} 
            onChange={(e) => onChange(e.target.value as Audience)}
            className="h-4 w-4 text-primary-600 bg-secondary-700 border-secondary-500 focus:ring-primary-500"
        />
        <label htmlFor={id} className="ml-2 block text-sm text-secondary-200">
            {label}
        </label>
    </div>
);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-2">
        <div>
            <h1 className="text-3xl font-bold text-primary-400">{t('adminDashboardTitle')}</h1>
            <p className="text-secondary-300 mt-1">{t('welcomeMessage', { name: currentUser?.firstName || 'Admin' })}</p>
        </div>
        {currentUser?.role === 'admin' && (
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleDownloadBackup} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    {t('adminDownloadBackup')}
                </button>
                <label htmlFor="backup-upload" className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    {t('adminUploadBackup')}
                </label>
                <input type="file" id="backup-upload" accept=".csv" onChange={handleUploadBackup} className="hidden" />
            </div>
        )}
      </div>
      
      <div className="flex space-x-2 border-b border-secondary-700 mt-6 mb-4">
          <TabButton tabId="users" titleKey="adminUserManagement" Icon={UserGroupIcon} />
          {currentUser?.role === 'admin' && (
            <TabButton tabId="news" titleKey="adminNewsPublisher" Icon={NewspaperIcon} />
          )}
      </div>

      {activeTab === 'users' && <UserManagementPanel />}
      {activeTab === 'news' && currentUser?.role === 'admin' && <NewsPublisherPanel />}
      
      {isUserDetailsModalOpen && selectedUserForDetails && (
        <UserDetailsModal user={selectedUserForDetails} onClose={() => setIsUserDetailsModalOpen(false)} />
      )}

      {isEditModalOpen && editingNewsItem && (
        <EditNewsModal newsItem={editingNewsItem} onClose={() => setIsEditModalOpen(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;