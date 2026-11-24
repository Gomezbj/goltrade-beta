import React, { useContext, useState, useRef, useEffect } from 'react';
import App from './App';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import { AuthContext, AuthContextType } from './contexts/AuthContext';
import { LanguageContext, LanguageContextType } from './contexts/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import UserGroupIcon from './components/icons/UserGroupIcon';
import PresentationChartLineIcon from './components/icons/PresentationChartLineIcon';
import UserCircleIcon from './components/icons/UserCircleIcon';
import UserProfile from './components/UserProfile';
import ChangePasswordModal from './components/ChangePasswordModal';
import ReferredUsersModal from './components/ReferredUsersModal';
import InfinityIcon from './components/icons/InfinityIcon';
import DiamondIcon from './components/icons/DiamondIcon';
import WhatsappIcon from './components/icons/WhatsappIcon';
import UKFlagIcon from './components/icons/UKFlagIcon';
import SpainFlagIcon from './components/icons/SpainFlagIcon';
import LogoutIcon from './components/icons/LogoutIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';
import LockClosedIcon from './components/icons/LockClosedIcon';

type AdminTab = 'dashboard' | 'analysis';

const AppWrapper: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext) as AuthContextType;
  const { language, setLanguage } = useContext(LanguageContext) as LanguageContextType;
  const { t } = useTranslations();
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('dashboard');
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [isReferredUsersModalOpen, setReferredUsersModalOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const UserHeader: React.FC = () => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 bg-secondary-800/50 flex justify-between items-center flex-wrap gap-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm text-secondary-300">
          {t('welcomeMessage', { name: currentUser?.firstName || '' })}
        </span>
         {currentUser && (
            <>
            {currentUser.role === 'sub-admin' && (
              <div className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>{t('userStatusSubAdmin')}</span>
              </div>
            )}
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5
              ${currentUser.accountType === 'pro'
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                : currentUser.accountType === 'enterprise'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                : 'bg-secondary-700 text-secondary-300'
              }`}
            >
              {currentUser.accountType === 'pro' && <DiamondIcon className="w-3.5 h-3.5" />}
               {currentUser.accountType === 'enterprise' && <DiamondIcon className="w-3.5 h-3.5" />}
              <span>
                {
                  currentUser.accountType === 'pro' ? t('userStatusPro') :
                  currentUser.accountType === 'enterprise' ? t('userStatusEnterprise') :
                  t('userStatusDemo')
                }
              </span>
            </div>
            </>
          )}
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-sm text-primary-300 font-medium">
          {t('creditsLabel')}: <span className={(currentUser?.role === 'admin' || currentUser?.role === 'sub-admin') ? 'text-gold-400' : (currentUser && currentUser.credits > 0 ? 'text-primary-400' : 'text-red-400')}>
            {(currentUser?.role === 'admin' || currentUser?.role === 'sub-admin') 
              ? <InfinityIcon className="w-5 h-5 inline-block align-middle" />
              : currentUser?.credits ?? 0
            }
          </span>
        </div>
        
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className={`flex items-center space-x-2 rounded-full p-1 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800
            ${language === 'en'
              ? 'bg-red-600 text-white shadow-lg focus:ring-red-500'
              : 'bg-primary-600 text-white shadow-lg focus:ring-primary-500'
            }`}
          aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex-shrink-0">
            {language === 'en' ? <UKFlagIcon className="w-full h-full object-cover" /> : <SpainFlagIcon className="w-full h-full object-cover" />}
          </div>
          <span className="font-semibold text-sm pr-2">{t(language === 'en' ? 'languageEN' : 'languageES')}</span>
        </button>

        <div className="relative" ref={userMenuRef}>
          <button 
            id="menu-button"
            onClick={() => setUserMenuOpen(!isUserMenuOpen)} 
            className="block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800 focus:ring-primary-500"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            <img 
                src={currentUser.profilePictureUrl || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=1d4ed8&color=fff`} 
                alt={t('profilePageTitle')} 
                className="w-9 h-9 rounded-full object-cover border-2 border-secondary-600 hover:border-primary-500 transition"
            />
          </button>
          
          {isUserMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 origin-top-right bg-secondary-800 border border-secondary-700 rounded-lg shadow-xl z-50"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              style={{ animation: 'fadeIn 0.1s ease-out' }}
            >
              <div className="py-1" role="none">
                <div className="px-4 py-3 border-b border-secondary-700">
                  <p className="text-sm text-secondary-300" role="none">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate" role="none">{currentUser.firstName} {currentUser.lastName}</p>
                </div>
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setProfileModalOpen(true); setUserMenuOpen(false); }} 
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-secondary-200 hover:bg-secondary-700 hover:text-white"
                    role="menuitem"
                >
                  <UserCircleIcon className="w-5 h-5 mr-3" />
                  {t('profilePageTitle')}
                </a>
                {currentUser.role !== 'admin' && currentUser.ownReferralCode && (
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setReferredUsersModalOpen(true); setUserMenuOpen(false); }} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-secondary-200 hover:bg-secondary-700 hover:text-white"
                        role="menuitem"
                    >
                        <UserGroupIcon className="w-5 h-5 mr-3" />
                        {t('myReferralsButtonText')}
                    </a>
                )}
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setChangePasswordModalOpen(true); setUserMenuOpen(false); }} 
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-secondary-200 hover:bg-secondary-700 hover:text-white"
                    role="menuitem"
                >
                    <LockClosedIcon className="w-5 h-5 mr-3" />
                    {t('changePasswordButtonText')}
                </a>
                {currentUser.accountType === 'demo' && (
                    <a 
                      href="https://wa.link/0k1eyq" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-secondary-200 hover:bg-secondary-700 hover:text-white"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <WhatsappIcon className="w-5 h-5 mr-3" />
                      {t('supportButtonText')}
                    </a>
                )}
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); logout(); setUserMenuOpen(false); }} 
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-secondary-700 hover:text-red-300"
                    role="menuitem"
                >
                    <LogoutIcon className="w-5 h-5 mr-3" />
                    {t('logoutButtonText')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  if (currentUser.role === 'admin' || currentUser.role === 'sub-admin') {
    return (
       <div className="flex flex-col min-h-screen bg-secondary-900">
        <header className="sticky top-0 z-40 bg-secondary-900 shadow-md">
            <UserHeader />
        </header>

        <div className="w-full border-b border-secondary-700">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2" role="tablist" aria-label="Admin Tabs">
             <button
              role="tab"
              aria-selected={adminActiveTab === 'dashboard'}
              aria-controls="admin-dashboard-panel"
              id="admin-dashboard-tab"
              onClick={() => setAdminActiveTab('dashboard')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 text-sm sm:text-base font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-400 -mb-px
                ${adminActiveTab === 'dashboard' 
                  ? 'bg-secondary-900 text-primary-300 border-t border-l border-r border-secondary-700' 
                  : 'text-secondary-400 hover:text-primary-300 hover:bg-secondary-800/60 border border-transparent'
                } transition-all`}
            >
              <UserGroupIcon className="w-5 h-5"/>
              <span>{t('adminTabDashboard')}</span>
            </button>
            <button
              role="tab"
              aria-selected={adminActiveTab === 'analysis'}
              aria-controls="admin-analysis-panel"
              id="admin-analysis-tab"
              onClick={() => setAdminActiveTab('analysis')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 text-sm sm:text-base font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-400 -mb-px
                ${adminActiveTab === 'analysis' 
                  ? 'bg-secondary-900 text-primary-300 border-t border-l border-r border-secondary-700'
                  : 'text-secondary-400 hover:text-primary-300 hover:bg-secondary-800/60 border border-transparent'
                } transition-all`}
            >
              <PresentationChartLineIcon className="w-5 h-5"/>
              <span>{t('adminTabAnalysis')}</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 w-full">
            {adminActiveTab === 'dashboard' && (
                <div id="admin-dashboard-panel" role="tabpanel" aria-labelledby="admin-dashboard-tab">
                    <AdminDashboard />
                </div>
            )}
            {adminActiveTab === 'analysis' && (
                <div id="admin-analysis-panel" role="tabpanel" aria-labelledby="admin-analysis-tab" className="h-full">
                    <App isEmbedded={true} />
                </div>
            )}
        </div>
        {isProfileModalOpen && <UserProfile onClose={() => setProfileModalOpen(false)} />}
        {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
        {isReferredUsersModalOpen && <ReferredUsersModal onClose={() => setReferredUsersModalOpen(false)} />}
        <style>
          {`
            body, #root {
              height: 100%;
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-in-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #1f2937; /* secondary-800 */
            }
            ::-webkit-scrollbar-thumb {
              background: #4b5563; /* secondary-600 */
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #6b7280; /* secondary-500 */
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary-900">
        <header className="sticky top-0 z-40 bg-secondary-900 shadow-md">
            <UserHeader />
        </header>
        <App />
        {isProfileModalOpen && <UserProfile onClose={() => setProfileModalOpen(false)} />}
        {isChangePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
        {isReferredUsersModalOpen && <ReferredUsersModal onClose={() => setReferredUsersModalOpen(false)} />}
        <style>
          {`
            body, #root {
              height: 100%;
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-in-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #1f2937; /* secondary-800 */
            }
            ::-webkit-scrollbar-thumb {
              background: #4b5563; /* secondary-600 */
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #6b7280; /* secondary-500 */
            }
          `}
        </style>
    </div>
  );
};

export default AppWrapper;