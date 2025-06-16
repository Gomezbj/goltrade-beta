
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import XCircleIcon from './icons/XCircleIcon'; // Import the new icon

interface NotificationBannerProps {
  message: string;
  level: 'warning' | 'critical' | 'error';
  showPlans?: boolean;
  onDismiss?: () => void; // New prop for dismissing
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, level, showPlans, onDismiss }) => {
  const { t } = useTranslations();

  let bgColor = 'bg-yellow-700/30 border-yellow-600';
  let textColor = 'text-yellow-200';
  let iconColor = 'text-yellow-400';
  let dismissButtonHoverColor = 'hover:text-yellow-100';

  if (level === 'critical') {
    bgColor = 'bg-red-700/40 border-red-600';
    textColor = 'text-red-200';
    iconColor = 'text-red-400';
    dismissButtonHoverColor = 'hover:text-red-100';
  } else if (level === 'error') {
    bgColor = 'bg-red-800/50 border-red-700';
    textColor = 'text-red-100';
    iconColor = 'text-red-300';
    dismissButtonHoverColor = 'hover:text-red-50';
  }

  return (
    <div className={`relative w-full p-3 sm:p-4 rounded-lg border ${bgColor} ${textColor} my-4 shadow-lg animate-fadeIn`}>
      <div className="flex flex-col items-center"> {/* Changed to flex-col and items-center */}
        <ExclamationTriangleIcon className={`w-6 h-6 sm:w-7 sm:h-7 mb-2 flex-shrink-0 ${iconColor}`} /> {/* Added mb-2 */}
        <div className="flex-grow text-center w-full pr-8 sm:pr-0"> {/* Added text-center, w-full, removed sm:pr-8 for centered dismiss */}
          <p className="font-semibold text-sm sm:text-base">{message}</p>
          {showPlans && (
            <div className="mt-2">
              {/* Removed specific plan labels and the 'notificationPlanPrompt' */}
              <p className="text-xs sm:text-sm mt-1">{t('notificationPurchasePrompt')}</p>
            </div>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`absolute top-2 right-2 p-1 text-current opacity-70 ${dismissButtonHoverColor} hover:opacity-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current transition-opacity`}
          aria-label={t('dismissErrorButtonLabel')} // Re-using existing translation for dismiss
        >
          <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
};

export default NotificationBanner;