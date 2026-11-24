import React, { useContext, useMemo } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import UserGroupIcon from './icons/UserGroupIcon';
import XMarkIcon from './icons/XMarkIcon';

const ReferredUsersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentUser, users } = useContext(AuthContext) as AuthContextType;
    const { t, currentLanguage } = useTranslations();
    
    const referredUsers = useMemo(() => {
        if (!currentUser || !currentUser.ownReferralCode) return [];
        return users.filter(u => u.referralCodeUsed === currentUser.ownReferralCode);
    }, [users, currentUser]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" 
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-700 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-5 border-b border-secondary-700 flex justify-between items-center flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary-400 flex items-center">
                        <UserGroupIcon className="w-7 h-7 mr-3"/>
                        {t('referredUsersModalTitle')}
                    </h1>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-700 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto">
                    {referredUsers.length > 0 ? (
                        <ul className="space-y-3 pr-2">
                            {referredUsers.map(user => (
                                <li key={user.id} className="flex justify-between items-center bg-secondary-800 p-3 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=374151&color=fff&size=40`} alt="" className="w-10 h-10 rounded-full"/>
                                        <div>
                                            <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                                            <p className="text-xs text-secondary-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary-300">
                                        {new Date(user.registrationTimestamp).toLocaleDateString(currentLanguage)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-secondary-400 text-center py-4">{t('noReferredUsers')}</p>
                    )}
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

export default ReferredUsersModal;
