
import React, { useState, useMemo } from 'react';
import { HistoricalAnalysis, TradingDecision, ConfidenceLevel } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import XMarkIcon from './icons/XMarkIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';

interface HistoryPanelProps {
  history: HistoricalAnalysis[];
  onSelectItem: (item: HistoricalAnalysis) => void;
  onDeleteItem: (id: string) => void;
  isLoading: boolean;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectItem, onDeleteItem, isLoading }) => {
  const { t, currentLanguage } = useTranslations();
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(currentLanguage, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDecisionStyles = (decision: TradingDecision): { color: string; text: string } => {
    switch (decision) {
      case TradingDecision.BUY: return { color: 'text-green-400', text: t('tradingDecisionBuy') };
      case TradingDecision.SELL: return { color: 'text-red-400', text: t('tradingDecisionSell') };
      case TradingDecision.HOLD: return { color: 'text-yellow-400', text: t('tradingDecisionHold') };
      default: return { color: 'text-secondary-400', text: t('tradingDecisionNone') };
    }
  };
  
  const getConfidenceText = (confidence?: ConfidenceLevel): string => {
     switch (confidence) {
      case ConfidenceLevel.HIGH: return t('confidenceLevelHigh');
      case ConfidenceLevel.MEDIUM: return t('confidenceLevelMedium');
      case ConfidenceLevel.LOW: return t('confidenceLevelLow');
      default: return t('confidenceLevelUnknown');
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); 
    onDeleteItem(itemId);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  const filteredHistory = useMemo(() => {
    if (!selectedDate) {
      return history;
    }
    return history.filter(item => {
      // Compare 'YYYY-MM-DD' strings. Date.toLocaleDateString with 'en-CA' gives this format.
      const itemLocalDateString = new Date(item.timestamp).toLocaleDateString('en-CA');
      return itemLocalDateString === selectedDate;
    });
  }, [history, selectedDate]);

  return (
    <div className="flex flex-col h-auto max-h-[calc(100vh-10rem)] md:max-h-[calc(100vh-14rem)] bg-secondary-800 shadow-xl rounded-xl overflow-hidden">
      <header className="p-4 border-b border-secondary-700 flex-shrink-0">
        <h2 className="text-xl font-semibold text-primary-300 text-center">
          {t('historyPanelTitle')}
        </h2>
        <div className="mt-3 flex items-center space-x-2">
            <label htmlFor="history-date-filter" className="text-sm text-primary-300 flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-primary-400" />
                {t('historyPanelDateFilterLabel')}
            </label>
            <input 
                type="date"
                id="history-date-filter"
                value={selectedDate}
                onChange={handleDateChange}
                className="p-1.5 text-sm bg-secondary-700 border border-secondary-600 text-secondary-100 rounded-md focus:ring-primary-500 focus:border-primary-500 flex-grow disabled:opacity-50"
                disabled={isLoading}
            />
            {selectedDate && (
                 <button 
                    onClick={clearDateFilter}
                    disabled={isLoading}
                    className="p-1.5 text-secondary-400 hover:text-primary-300 focus:text-primary-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                    aria-label={t('historyPanelClearDateFilterButton')}
                >
                    <XMarkIcon className="w-5 h-5" strokeWidth={2}/>
                </button>
            )}
        </div>
      </header>

      {filteredHistory.length === 0 && !isLoading ? (
        <div className="flex-grow flex items-center justify-center p-4 text-center">
          <p className="text-secondary-400">{t('historyPanelEmpty')}</p>
        </div>
      ) : (
        <ul className="flex-grow overflow-y-auto p-3 space-y-3">
          {filteredHistory.map((item) => {
            const decisionStyle = getDecisionStyles(item.result.trading_decision);
            const itemDate = formatDate(item.timestamp);
            return (
              <li 
                key={item.id} 
                className={`relative bg-secondary-700/70 p-3 rounded-lg shadow hover:bg-secondary-600/80 focus-within:bg-secondary-600/80 focus-within:ring-2 focus-within:ring-primary-500 focus:outline-none transition-colors duration-150 group ${isLoading ? 'opacity-70' : 'cursor-pointer'}`}
                onClick={() => !isLoading && onSelectItem(item)}
                onKeyDown={(e) => { if (!isLoading && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectItem(item);}}}
                role="button"
                tabIndex={isLoading ? -1 : 0}
                aria-disabled={isLoading}
                aria-label={t('viewHistoryItemAriaLabel', { date: itemDate })}
              >
                <button
                  onClick={(e) => handleDeleteClick(e, item.id)}
                  disabled={isLoading}
                  className="absolute top-1.5 right-1.5 p-1 text-secondary-400 hover:text-red-400 focus:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-full transition-colors z-10"
                  aria-label={t('deleteHistoryItemAriaLabel', { date: itemDate })}
                >
                  <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                </button>
                
                <div className="flex justify-between items-start mb-1 pr-6"> {/* Added pr-6 to avoid overlap with delete button */}
                    <span className="text-xs text-secondary-400">{itemDate}</span>
                    <span className={`text-xs font-semibold ${decisionStyle.color}`}>{decisionStyle.text}</span>
                </div>
                <p className="text-sm text-primary-300 font-medium truncate group-hover:text-primary-200 group-focus-within:text-primary-200" title={item.fileNames.join(', ')}>
                  {t('historyItemFilesLabel')}: {item.fileNames[0] || 'N/A'} {item.fileNames.length > 1 ? ` (+${item.fileNames.length -1})` : ''}
                </p>
                 <p className="text-xs text-secondary-300 group-hover:text-secondary-200 group-focus-within:text-secondary-200">
                  {t('historyItemConfidenceLabel')}: {getConfidenceText(item.result.confidence_level)}
                </p>
              </li>
            );
          })}
           {isLoading && filteredHistory.length === 0 && ( 
            <div className="flex-grow flex items-center justify-center p-4">
                 <div className="w-8 h-8 border-2 border-t-primary-500 border-r-primary-500 border-b-primary-500 border-l-secondary-700 rounded-full animate-spin"></div>
            </div>
           )}
        </ul>
      )}
      {/* Footer with Clear History button removed */}
    </div>
  );
};

export default HistoryPanel;