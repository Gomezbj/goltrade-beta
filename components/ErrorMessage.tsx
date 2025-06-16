
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  const { t } = useTranslations();
  if (!message) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-4 bg-red-800 border border-red-600 text-red-100 rounded-lg shadow-md flex justify-between items-center">
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="ml-4 text-red-200 hover:text-red-50 focus:outline-none"
          aria-label={t('dismissErrorButtonLabel')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;