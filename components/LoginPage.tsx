import React, { useState, useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import EnvelopeIcon from './icons/EnvelopeIcon';
import LockClosedIcon from './icons/LockClosedIcon';
import XMarkIcon from './icons/XMarkIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';

const LoginPage: React.FC = () => {
    const { login } = useContext(AuthContext) as AuthContextType;
    const { t } = useTranslations();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
            // On success, AppWrapper will handle the redirect
        } catch (err: any) {
            if (err.message === 'blocked') {
                setError(t('loginErrorBlocked'));
            } else {
                setError(t('loginErrorInvalid'));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegisterSuccess = () => {
        setRegisterModalOpen(false);
        setShowRegistrationSuccess(true);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-primary-500 selection:text-white">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16">
                {/* Left Side */}
                <div className="text-center lg:text-left lg:w-1/2 px-4">
                     <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-primary-500 self-center"><path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.15A.75.75 0 003 6.805v10.39a.75.75 0 00.366.655l8.256 4.548a.75.75 0 00.756 0l8.256-4.548a.75.75 0 00.366-.655V6.805a.75.75 0 00-.366-.655L12.378 1.602zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /><path d="M10.823 11.745a2.25 2.25 0 102.46-.032l-.01-.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 00-2.378.066zM13.177 10.255a2.25 2.25 0 10-2.46.032l.01.004.018.008.022.01.02.008.012.004a2.25 2.25 0 002.378-.066zM10.823 14.255a2.25 2.25 0 102.46.032l-.01.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 002.378-.066z" /></svg>
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                             {t('appTitle').replace(' - Beta', '')}
                        </h1>
                    </div>
                    <p className="text-xl lg:text-2xl mt-2 text-secondary-300 max-w-md mx-auto lg:mx-0">
                        {t('loginPageSubtitle')}
                    </p>
                </div>

                {/* Right Side */}
                <div className="w-full max-w-md lg:w-1/2">
                    {showRegistrationSuccess && (
                        <div className="bg-green-100 dark:bg-green-800/50 border border-green-500 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg mb-4 text-center animate-fadeIn">
                           <div className="flex items-center justify-center">
                                <CheckCircleIcon className="w-6 h-6 mr-2 text-green-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-left">{t('registrationSuccessTitle')}</h3>
                                    <p className="text-sm text-left">{t('registrationSuccessMessage')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white dark:bg-secondary-800 shadow-2xl rounded-xl p-6 space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('loginLabelEmail')}
                                required
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                aria-label={t('loginLabelEmail')}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('loginLabelPassword')}
                                required
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                aria-label={t('loginLabelPassword')}
                            />
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {t('loginButtonText')}
                            </button>
                        </form>
                        <div className="text-center">
                            <button onClick={() => setForgotModalOpen(true)} className="text-primary-500 hover:underline text-sm">
                                {t('loginForgotPassword')}
                            </button>
                        </div>
                        <hr className="border-gray-300 dark:border-secondary-600"/>
                        <div className="text-center">
                            <button
                                onClick={() => setRegisterModalOpen(true)}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                            >
                                {t('loginCreateAccount')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isRegisterModalOpen && <RegistrationModal onClose={() => setRegisterModalOpen(false)} onSuccess={handleRegisterSuccess} />}
            {isForgotModalOpen && <ForgotPasswordModal onClose={() => setForgotModalOpen(false)} />}
            
            <footer className="absolute bottom-4 text-center w-full">
                <p className="text-xs text-secondary-500">{t('footerText', { year: new Date().getFullYear(), appName: t('appTitle') })}</p>
            </footer>
        </div>
    );
};

const RegistrationModal: React.FC<{ onClose: () => void; onSuccess: () => void; }> = ({ onClose, onSuccess }) => {
    const { register } = useContext(AuthContext) as AuthContextType;
    const { t } = useTranslations();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [referralCode, setReferralCode] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError(t('registerErrorPasswordShort'));
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            await register(firstName, lastName, email, password, contactNumber, dateOfBirth, nickname, referralCode);
            onSuccess();
        } catch (err: any) {
             if (err.message === 'exists') {
                setError(t('registerErrorExists'));
             } else if (err.message === 'invalid_domain') {
                setError(t('registerErrorInvalidDomain'));
             } else if (err.message === 'nickname_taken') {
                setError(t('registerErrorNicknameTaken'));
             } else {
                setError("An unexpected error occurred.");
             }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn p-4" onClick={onClose}>
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-300 dark:border-secondary-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('registerModalTitle')}</h2>
                        <p className="text-sm text-gray-500 dark:text-secondary-400">{t('registerModalSubtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-secondary-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleRegister} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('registerLabelFirstName')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('registerLabelLastName')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    </div>
                    <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder={t('registerLabelNickname')} className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('registerLabelEmail')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('registerLabelPassword')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder={t('registerLabelContactNumber')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                        <div className="relative w-full">
                           <label htmlFor="dateOfBirth" className="sr-only">
                                {t('registerLabelDateOfBirth')}
                            </label>
                            <input 
                                id="dateOfBirth"
                                type="date" 
                                value={dateOfBirth} 
                                onChange={e => setDateOfBirth(e.target.value)} 
                                required 
                                max={new Date().toISOString().split("T")[0]}
                                className={`w-full pl-3 pr-10 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 ${dateOfBirth ? 'text-black dark:text-white' : 'text-gray-500 dark:text-secondary-400'}`}
                                aria-label={t('registerLabelDateOfBirth')}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <CalendarDaysIcon className="h-5 w-5 text-gray-400 dark:text-secondary-400" />
                            </div>
                        </div>
                    </div>
                    <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder={t('registerLabelReferralCode')} maxLength={6} className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase"/>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    
                    <div className="text-center pt-2">
                         <button type="submit" disabled={isLoading} className="px-12 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-auto mx-auto">
                           {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                           {t('registerButtonText')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslations();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-300 dark:border-secondary-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('forgotPasswordModalTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-secondary-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4">
                    {submitted ? (
                        <p className="text-gray-600 dark:text-secondary-300 text-center">{t('forgotPasswordSuccess')}</p>
                    ) : (
                        <form onSubmit={handleSearch} className="space-y-4">
                            <p className="text-gray-600 dark:text-secondary-300">{t('forgotPasswordModalSubtitle')}</p>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('registerLabelEmail')} required className="w-full px-3 py-2 bg-gray-100 dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                            <div className="text-right space-x-2 border-t border-gray-300 dark:border-secondary-700 pt-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-secondary-600 text-gray-800 dark:text-secondary-200 rounded-md hover:bg-gray-300 dark:hover:bg-secondary-500 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md transition-colors">{t('forgotPasswordButtonText')}</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};


export default LoginPage;