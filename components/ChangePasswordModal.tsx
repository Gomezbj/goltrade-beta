import React, { useState, useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import XMarkIcon from './icons/XMarkIcon';
import LockClosedIcon from './icons/LockClosedIcon';

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentUser, changePassword } = useContext(AuthContext) as AuthContextType;
    const { t } = useTranslations();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage(null);
      if (newPassword.length < 6) {
        setPasswordMessage({ type: 'error', text: t('adminErrorNewPasswordShort') }); return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: 'error', text: t('adminErrorPasswordNoMatch') }); return;
      }
      if (!currentUser) return;
      setIsChangingPassword(true);
      try {
        await changePassword(currentUser.id, currentPassword, newPassword);
        setPasswordMessage({ type: 'success', text: t('adminPasswordChangeSuccess') });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => {
          setPasswordMessage(null);
          onClose(); // Close modal on success after a delay
        }, 2000);
      } catch (err: any) {
        if (err.message === 'invalid_current_password') {
          setPasswordMessage({ type: 'error', text: t('adminErrorInvalidCurrentPassword') });
        } else {
          setPasswordMessage({ type: 'error', text: err.message });
        }
      } finally {
        setIsChangingPassword(false);
      }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" 
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-700 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-5 border-b border-secondary-700 flex justify-between items-center flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary-400 flex items-center">
                        <LockClosedIcon className="w-6 h-6 mr-3"/>
                        {t('changePasswordModalTitle')}
                    </h1>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-700 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminLabelCurrentPassword')}</label>
                            <input 
                                type="password" 
                                id="current-password" 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-900/50 disabled:cursor-not-allowed" 
                                required 
                                disabled={isChangingPassword}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminLabelNewPassword')}</label>
                                <input 
                                    type="password" 
                                    id="new-password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-900/50 disabled:cursor-not-allowed" 
                                    required 
                                    disabled={isChangingPassword}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-300 mb-1">{t('adminLabelConfirmPassword')}</label>
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-900/50 disabled:cursor-not-allowed" 
                                    required 
                                    disabled={isChangingPassword}
                                />
                            </div>
                        </div>
                        {passwordMessage && (
                            <div className={`text-sm text-center py-2 px-3 rounded-md ${passwordMessage.type === 'success' ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isChangingPassword} className="flex items-center justify-center px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isChangingPassword && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg>}
                                {t('adminButtonChangePassword')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
