import React, { useState, useContext, useEffect, ChangeEvent, useMemo } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import { User } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';
import PencilIcon from './icons/PencilIcon';
import ShareIcon from './icons/ShareIcon';
import ClipboardDocumentIcon from './icons/ClipboardDocumentIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XMarkIcon from './icons/XMarkIcon';

const UserProfile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentUser, updateUser, setReferralCode } = useContext(AuthContext) as AuthContextType;
    const { t } = useTranslations();
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        contactNumber: '',
        dateOfBirth: '',
        profilePictureUrl: '',
    });
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // State for setting referral code
    const [customCode, setCustomCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [isSettingCode, setIsSettingCode] = useState(false);
    
    useEffect(() => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                nickname: currentUser.nickname || '',
                contactNumber: currentUser.contactNumber || '',
                dateOfBirth: currentUser.dateOfBirth || '',
                profilePictureUrl: currentUser.profilePictureUrl || '',
            });
        }
    }, [currentUser, isEditing]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handlePictureUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit for profile pics
            setFeedbackMessage(t('imageUploaderErrorTooLarge'));
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, profilePictureUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            const updatedUserData: User = {
                ...currentUser,
                firstName: formData.firstName,
                lastName: formData.lastName,
                nickname: formData.nickname,
                contactNumber: formData.contactNumber,
                dateOfBirth: formData.dateOfBirth,
                profilePictureUrl: formData.profilePictureUrl,
            };
            updateUser(updatedUserData);
            setFeedbackMessage(t('profileUpdatedSuccess'));
            setIsEditing(false);
            setTimeout(() => setFeedbackMessage(''), 3000);
        }
    };
    
    const handleSetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setCodeError('');
    
        if (customCode.length !== 6) {
            setCodeError(t('referralCodeErrorLength'));
            return;
        }
        if (!/^[A-Z0-9]+$/.test(customCode)) {
            setCodeError(t('referralCodeErrorAlphanumeric'));
            return;
        }
        
        setIsSettingCode(true);
        try {
            await setReferralCode(currentUser.id, customCode);
            // On success, component will re-render due to context update.
        } catch (err: any) {
            if (err.message === 'code_taken') {
                setCodeError(t('referralCodeErrorTaken'));
            } else {
                setCodeError('An unexpected error occurred.');
            }
        } finally {
            setIsSettingCode(false);
        }
    };

    const handleCopyCode = () => {
        if (currentUser?.ownReferralCode) {
            navigator.clipboard.writeText(currentUser.ownReferralCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fadeIn" 
            onClick={onClose}
        >
            <div 
                className="w-full max-w-4xl bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-700 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-5 border-b border-secondary-700 flex justify-between items-center flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-primary-400 flex items-center">
                        <UserCircleIcon className="w-7 h-7 mr-3"/>
                        {t('profilePageTitle')}
                    </h1>
                    <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-700 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="space-y-8">
                        {feedbackMessage && (
                            <div className="bg-green-800/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                                <CheckCircleIcon className="w-5 h-5"/>
                                <span>{feedbackMessage}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleSaveChanges} className="bg-secondary-800 shadow-xl rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            {/* Profile Picture Section */}
                            <div className="md:col-span-1 flex flex-col items-center space-y-4">
                                <h2 className="text-xl font-semibold text-primary-300 w-full text-center md:text-left">{t('profilePictureSection')}</h2>
                                <div className="relative">
                                    <img 
                                        src={formData.profilePictureUrl || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=1d4ed8&color=fff&size=128`} 
                                        alt="Profile" 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg"
                                    />
                                    {isEditing && (
                                        <label htmlFor="picture-upload" className="absolute bottom-0 right-0 bg-secondary-700 p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
                                            <PencilIcon className="w-5 h-5 text-white"/>
                                            <input id="picture-upload" type="file" className="sr-only" accept="image/*" onChange={handlePictureUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Edit Profile Section */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-primary-300">{t('editProfileSection')}</h2>
                                    {!isEditing && (
                                        <button type="button" onClick={() => setIsEditing(true)} className="flex items-center space-x-2 text-sm text-primary-400 hover:text-primary-300 font-semibold">
                                            <PencilIcon className="w-4 h-4"/>
                                            <span>{t('adminActionEdit')}</span>
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label={t('registerLabelFirstName')} name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={!isEditing} />
                                    <InputField label={t('registerLabelLastName')} name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={!isEditing} />
                                    <InputField label={t('nicknameLabel')} name="nickname" value={formData.nickname} onChange={handleInputChange} disabled={!isEditing} />
                                    <InputField label={t('registerLabelEmail')} name="email" value={currentUser.email} disabled={true} />
                                    <InputField label={t('registerLabelContactNumber')} name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} disabled={!isEditing} />
                                    <InputField label={t('registerLabelDateOfBirth')} name="dateOfBirth" type={isEditing ? 'date' : 'text'} value={formData.dateOfBirth} onChange={handleInputChange} disabled={!isEditing} />
                                    <InputField label={t('usedReferralCodeLabel')} name="referralCodeUsed" value={currentUser.referralCodeUsed || 'N/A'} disabled={true} />
                                </div>
                                
                                {isEditing && (
                                    <div className="flex justify-end space-x-3 pt-2">
                                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-secondary-600 rounded-lg hover:bg-secondary-500 font-semibold">{t('adminClearFilter')}</button>
                                        <button type="submit" className="px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold">{t('saveChanges')}</button>
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Referral Code Section */}
                        {currentUser.role !== 'admin' && (
                            <div className="bg-secondary-800 shadow-xl rounded-xl p-6">
                                <h2 className="text-xl font-semibold text-primary-300 mb-4 flex items-center"><ShareIcon className="w-6 h-6 mr-3"/>{t('yourReferralCodeSection')}</h2>
                                {currentUser.ownReferralCode ? (
                                    <div className="flex items-center justify-center sm:justify-start space-x-4 bg-secondary-900/50 p-4 rounded-lg">
                                        <p className="text-2xl font-mono tracking-widest text-primary-300 bg-secondary-700 px-4 py-2 rounded-md">{currentUser.ownReferralCode}</p>
                                        <button onClick={handleCopyCode} className="flex items-center space-x-2 px-4 py-2 bg-secondary-600 rounded-lg hover:bg-secondary-500 font-semibold transition-colors">
                                            <ClipboardDocumentIcon className="w-5 h-5"/>
                                            <span>{isCopied ? t('codeCopied') : t('copyCode')}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSetCode} className="space-y-3">
                                        <p className="text-sm text-secondary-300">{t('setReferralCodePrompt')}</p>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <input 
                                                type="text" 
                                                value={customCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    if (/^[A-Z0-9]*$/.test(val)) {
                                                        setCustomCode(val);
                                                    }
                                                    setCodeError('');
                                                }}
                                                maxLength={6}
                                                className="flex-grow p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 uppercase font-mono tracking-widest"
                                                placeholder={t('referralCodePlaceholder')}
                                                required
                                                disabled={isSettingCode}
                                            />
                                            <button type="submit" disabled={isSettingCode || customCode.length !== 6} className="px-6 py-2.5 bg-green-600 rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                                {isSettingCode && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg>}
                                                {t('setMyCodeButton')}
                                            </button>
                                        </div>
                                        {codeError && <p className="text-red-500 text-xs text-center pt-2">{codeError}</p>}
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange?: (e: ChangeEvent<HTMLInputElement>) => void, disabled: boolean, type?: string}> = 
({ label, name, value, onChange, disabled, type = 'text'}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-secondary-300 mb-1">{label}</label>
        <input 
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-900/50 disabled:cursor-not-allowed"
        />
    </div>
);


export default UserProfile;