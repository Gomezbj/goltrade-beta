
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface LoadingSpinnerProps {
  progress?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress }) => {
  const { t } = useTranslations();
  
  let messageToShow = t('loadingSpinnerMessage');
  if (progress && progress > 0) {
    messageToShow += ` (${progress}%)`;
  }
  
  return (
    <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 flex flex-col justify-center items-center z-50 transition-opacity duration-300 ease-in-out" aria-live="assertive" role="alert">
      <div className="w-16 h-16 border-4 border-t-primary-500 border-r-primary-500 border-b-primary-500 border-l-secondary-700 rounded-full animate-spin-slow"></div>
      <p className="mt-4 text-lg text-primary-300 font-medium">{messageToShow}</p>
    </div>
  );
};

export default LoadingSpinner;