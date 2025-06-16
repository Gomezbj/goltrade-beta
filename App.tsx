
import React, { useState, useCallback, ChangeEvent, useContext, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import FractalAnalysisDisplay from './components/FractalAnalysisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import HistoryPanel from './components/HistoryPanel';
import NotificationBanner from './components/NotificationBanner';
import { analyzeImageWithGemini } from './services/geminiService';
import { FractalAnalysisResult, HistoricalAnalysis, TradingDecision, ImageFileData } from './types'; // Added ImageFileData
import LightbulbIcon from './components/icons/LightbulbIcon';
import DocumentArrowUpIcon from './components/icons/DocumentArrowUpIcon';
import TrashIcon from './components/icons/TrashIcon';
import { LanguageContext, LanguageContextType } from './contexts/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import { Language, TranslationKey } from './i18n';
import { MAX_CREDITS, AVAILABLE_TIMEFRAMES, ASSET_CATEGORIES, TimeframeValue } from './constants';
import DocumentTextIcon from './components/icons/DocumentTextIcon'; 
import PresentationChartLineIcon from './components/icons/PresentationChartLineIcon'; 
import CalendarDaysIcon from './components/icons/CalendarDaysIcon';
import PresentationChartBarIcon from './components/icons/PresentationChartBarIcon';

// ImageFileData interface moved to types.ts

type ActiveTab = 'input' | 'results';

interface TabButtonProps {
  tabId: ActiveTab;
  currentTab: ActiveTab;
  onClick: () => void;
  children: React.ReactNode;
  Icon: React.FC<any>; 
}

const TabButton: React.FC<TabButtonProps> = 
  ({ tabId, currentTab, onClick, children, Icon}) => (
  <button
    role="tab"
    aria-selected={currentTab === tabId}
    aria-controls={`${tabId}-panel`}
    id={`${tabId}-tab`}
    onClick={onClick}
    className={`flex items-center justify-center space-x-2 px-4 py-3 text-sm sm:text-base font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-400
      ${currentTab === tabId 
        ? 'bg-secondary-800 text-primary-300 border-b-2 border-primary-500' 
        : 'text-secondary-400 hover:text-primary-300 hover:bg-secondary-700/50'
      } transition-all`}
  >
    <Icon className="w-5 h-5"/>
    <span>{children}</span>
  </button>
);

const App: React.FC = () => {
  const [primaryImageData, setPrimaryImageData] = useState<ImageFileData | null>(null);
  const [expectedImageData, setExpectedImageData] = useState<ImageFileData | null>(null);
  const [cvatJsonData, setCvatJsonData] = useState<{ content: string; fileName: string } | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeValue | ''>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');

  const [analysisResult, setAnalysisResult] = useState<FractalAnalysisResult | null>(null);
  const [currentPrimaryImageDataForAnnotation, setCurrentPrimaryImageDataForAnnotation] = useState<ImageFileData | null>(null);
  const [currentAnalysisFileNames, setCurrentAnalysisFileNames] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('input');
  const [analysisHistory, setAnalysisHistory] = useState<HistoricalAnalysis[]>([]);

  const { language, setLanguage } = useContext(LanguageContext) as LanguageContextType;
  const { t } = useTranslations();

  const [credits, setCredits] = useState<number>(() => {
    const savedCredits = localStorage.getItem('analysisCreditsBullTrade');
    return savedCredits ? parseInt(savedCredits, 10) : MAX_CREDITS;
  });

  const [uploaderKeys, setUploaderKeys] = useState({ primary: 0, expected: 0 });
  const [dismissedNotificationSignature, setDismissedNotificationSignature] = useState<string | null>(null);

  const isOlderThan24Hours = (timestamp: number): boolean => {
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return (Date.now() - timestamp) > twentyFourHoursInMs;
  };

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('analysisHistoryBullTrade');
      if (savedHistory) {
        const parsedHistory: HistoricalAnalysis[] = JSON.parse(savedHistory);
        const recentHistory = parsedHistory.filter(item => !isOlderThan24Hours(item.timestamp));
        setAnalysisHistory(recentHistory);
      }
    } catch (e) {
      console.error("Failed to load or prune history from localStorage:", e);
      setAnalysisHistory([]); 
    }
  }, []);

  useEffect(() => {
    try {
      const recentHistoryToSave = analysisHistory.filter(item => !isOlderThan24Hours(item.timestamp));
      localStorage.setItem('analysisHistoryBullTrade', JSON.stringify(recentHistoryToSave));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }, [analysisHistory]);
  
  useEffect(() => {
    localStorage.setItem('analysisCreditsBullTrade', credits.toString());
  }, [credits]);

  useEffect(() => {
    if (isLoading) {
      setAnalysisProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = window.setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 95) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return 95;
          }
          return prev + 5;
        });
      }, 150);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (analysisProgress !== 0 && analysisProgress !== 100) {
        setAnalysisProgress(0);
      }
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLoading]);


  const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  };
  
  const collectCurrentFileNames = (
    pData: ImageFileData | null,
    eData: ImageFileData | null,
    cData: { content: string; fileName: string } | null
  ): string[] => {
    const names = [];
    if (pData) names.push(pData.fileName);
    if (eData) names.push(eData.fileName);
    if (cData) names.push(cData.fileName);
    return names;
  };

  const resetInputs = () => {
    setPrimaryImageData(null);
    setExpectedImageData(null);
    setCvatJsonData(null);
    setSelectedTimeframe('');
    setSelectedAsset('');
    setError(null);
    // Don't clear analysisResult if user just wants to clear inputs on input tab
    // setAnalysisResult(null); 
    setCurrentPrimaryImageDataForAnnotation(null); 
    
    setUploaderKeys(prev => ({ 
        primary: prev.primary + 1, 
        expected: prev.expected + 1 
    }));
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";
  };

  const handleClearInputs = () => {
    resetInputs();
    // If clearing inputs, also clear the result tab if it's not from history
    if (analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
    }
  };
  
  const handlePrimaryImageUpload = useCallback((fileData: ImageFileData | null) => {
    setPrimaryImageData(fileData);
    if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) { 
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
    }
    setError(null);
  }, [activeTab, analysisResult, analysisHistory]);

  const handleExpectedImageUpload = useCallback((fileData: ImageFileData | null) => {
    setExpectedImageData(fileData);
     if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
    }
    setError(null);
  }, [activeTab, analysisResult, analysisHistory]);

  const handleCvatJsonUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError(t('errorInvalidJsonFile')); setCvatJsonData(null); event.target.value = ''; return;
      }
      if (file.size > 2 * 1024 * 1024) { 
        setError(t('errorJsonFileTooLarge')); setCvatJsonData(null); event.target.value = ''; return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          JSON.parse(reader.result as string); 
          setCvatJsonData({ content: reader.result as string, fileName: file.name });
          if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
              setAnalysisResult(null); setCurrentAnalysisFileNames([]); setCurrentPrimaryImageDataForAnnotation(null);
          }
        } catch (e) {
          setError(t('errorInvalidJsonFormat')); setCvatJsonData(null);
        }
      };
      reader.readAsText(file);
    } else {
        setCvatJsonData(null); // Clear if no file selected
    }
  }, [t, activeTab, analysisResult, analysisHistory]);
  
  const removeCvatJson = () => {
    setCvatJsonData(null);
    if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
        setAnalysisResult(null); setCurrentAnalysisFileNames([]); setCurrentPrimaryImageDataForAnnotation(null);
    }
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";
  };

  const performAnalysis = useCallback(async () => {
    if (!process.env.API_KEY) {
        setError(t('errorApiKeyMissingShort')); setIsLoading(false); return;
    }
    if (credits <= 0) {
      setError(t('notificationCreditsEmpty')); 
      return; 
    }
    if (!selectedTimeframe) {
      setError(t('errorTimeframeRequired')); return;
    }
    if (!selectedAsset) {
      setError(t('errorAssetRequired')); return;
    }
    if (!primaryImageData) {
      setError(t('errorPrimaryImageRequired')); return;
    }

    setIsLoading(true); setError(null); setAnalysisResult(null); setCurrentAnalysisFileNames([]);
    setCurrentPrimaryImageDataForAnnotation(null); 
    setDismissedNotificationSignature(null); 

    const filesUsedForThisAnalysis = collectCurrentFileNames(primaryImageData, expectedImageData, cvatJsonData);
    const displayContext = `${selectedAsset} (${selectedTimeframe})${filesUsedForThisAnalysis.length > 0 ? ': ' + filesUsedForThisAnalysis.join(', ') : ''}`;

    try {
      const result = await analyzeImageWithGemini(
        primaryImageData.base64Image, primaryImageData.mimeType,
        selectedTimeframe, selectedAsset, 
        expectedImageData?.base64Image, expectedImageData?.mimeType,
        cvatJsonData?.content
      );
      setAnalysisResult(result);
      setCurrentPrimaryImageDataForAnnotation(primaryImageData);
      setCurrentAnalysisFileNames([displayContext]); 
      
      if (!(result.reasoning.startsWith("Error during analysis") || result.reasoning.startsWith("Error durante el análisis"))) {
        const newCredits = Math.max(0, credits - 1);
        setCredits(newCredits); 

        const historicalEntry: HistoricalAnalysis = {
          id: generateUniqueId(),
          result: result,
          fileNames: [displayContext], 
          timestamp: Date.now(),
          primaryImageData: primaryImageData ? { ...primaryImageData } : undefined,
          expectedImageData: expectedImageData ? { ...expectedImageData } : undefined,
        };
        setAnalysisHistory(prevHistory => 
          [historicalEntry, ...prevHistory].filter(item => !isOlderThan24Hours(item.timestamp))
        );
      }
      setActiveTab('results');
    } catch (e: any) {
      console.error("Analysis failed in App:", e);
      const errorMsg = e.message || "An unexpected error occurred during analysis.";
      setError(errorMsg);
      setAnalysisResult({ 
        patterns_identified: [],
        trading_decision: TradingDecision.NONE,
        reasoning: `Analysis Error: ${errorMsg}`,
        reasoning_es: `Error de Análisis: ${errorMsg}`,
        confidence_level: undefined
      });
      setCurrentPrimaryImageDataForAnnotation(primaryImageData); // Show primary image even on error for context
      const displayContextOnError = `${selectedAsset || 'N/A'} (${selectedTimeframe || 'N/A'})${filesUsedForThisAnalysis.length > 0 ? ': ' + filesUsedForThisAnalysis.join(', ') : ''}`;
      setCurrentAnalysisFileNames([displayContextOnError]); 
      setActiveTab('results'); 
    } finally {
      if (progressIntervalRef.current) {
         clearInterval(progressIntervalRef.current);
         progressIntervalRef.current = null;
      }
      setAnalysisProgress(100); 
      setIsLoading(false);
      setTimeout(() => setAnalysisProgress(0), 100);
    }
  }, [primaryImageData, expectedImageData, cvatJsonData, t, credits, language, selectedTimeframe, selectedAsset]);

  const clearError = useCallback(() => { setError(null); }, []);

  const handleSelectHistoryItem = (item: HistoricalAnalysis) => {
    setAnalysisResult(item.result);
    setCurrentAnalysisFileNames(item.fileNames); 
    
    // Set image data for display and for input forms
    setPrimaryImageData(item.primaryImageData || null);
    setExpectedImageData(item.expectedImageData || null);
    setCurrentPrimaryImageDataForAnnotation(item.primaryImageData || null);
    
    // Reset CVAT JSON as it's not stored in history
    setCvatJsonData(null); 
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";

    // Reset timeframe and asset from history (if they were stored - currently not, but good for future)
    // For now, these remain as they are or could be cleared if desired.
    // If asset/timeframe were part of historical item, set them here.
    // e.g. setSelectedTimeframe(item.timeframe || ''); setSelectedAsset(item.asset || '');

    setActiveTab('results');
    setError(null); 
    setDismissedNotificationSignature(null); 
    // Do not change uploaderKeys here, so initialImage prop can take effect
  };

  const handleDeleteHistoryItem = (idToDelete: string) => {
    const itemToDelete = analysisHistory.find(item => item.id === idToDelete);
    setAnalysisHistory(prevHistory => prevHistory.filter(item => item.id !== idToDelete));
    
    if (itemToDelete && analysisResult && JSON.stringify(itemToDelete.result) === JSON.stringify(analysisResult) && JSON.stringify(itemToDelete.fileNames) === JSON.stringify(currentAnalysisFileNames)) {
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
        // Also clear related input fields if the deleted item was the one being shown
        setPrimaryImageData(null);
        setExpectedImageData(null);
        // Uploader keys will reset these if resetInputs() were called, 
        // but here we only clear the data, ImageUploader will update via initialImage={null}
        setUploaderKeys(prev => ({ primary: prev.primary + 1, expected: prev.expected + 1 })); // Force reset of uploaders
    }
  };


  const getAnalysisForFileNamesText = () => {
    if (currentAnalysisFileNames.length === 0) return "";
    return t('analysisBasedOn', { files: currentAnalysisFileNames[0] }); 
  }

  const changeLanguage = (lang: Language) => { setLanguage(lang); };

  const canAnalyze = primaryImageData && selectedTimeframe && selectedAsset && !isLoading && credits > 0;
  const canClearInputs = primaryImageData || expectedImageData || cvatJsonData || selectedTimeframe || selectedAsset;

  let notificationMessage: string | null = null;
  let notificationLevel: 'warning' | 'critical' | 'error' | null = null;
  let showPlansForNotification = false;
  let currentNotificationSignature: string | null = null;

  const lowCredits30Threshold = Math.floor(MAX_CREDITS * 0.3);
  const lowCredits10Threshold = Math.floor(MAX_CREDITS * 0.1);
  
  if (!isLoading) {
    if (credits === 0) {
      notificationMessage = t('notificationCreditsEmpty');
      notificationLevel = 'error';
      showPlansForNotification = true;
    } else if (credits <= lowCredits10Threshold) { 
      notificationMessage = t('notificationCreditsLow10', { credits: credits.toString(), percentage: '10%' });
      notificationLevel = 'critical';
    } else if (credits <= lowCredits30Threshold) {
      notificationMessage = t('notificationCreditsLow30', { credits: credits.toString(), percentage: '30%' });
      notificationLevel = 'warning';
    }

    if (notificationLevel) {
      currentNotificationSignature = `${notificationLevel}-${credits}`;
    }
  }
  
  const handleDismissNotification = () => {
    if (currentNotificationSignature) {
      setDismissedNotificationSignature(currentNotificationSignature);
    }
  };

  const showNotification = notificationMessage && currentNotificationSignature !== dismissedNotificationSignature;


  return (
    <div className="flex flex-col min-h-screen bg-secondary-900 text-secondary-100 selection:bg-primary-500 selection:text-white">
      {isLoading && <LoadingSpinner progress={analysisProgress} />}
      
      <header className="w-full max-w-5xl text-center mb-6 mt-4 px-4 sm:px-6 self-center flex-shrink-0">
          <div className="flex justify-between items-center mb-6 pt-1">
              <div className="text-sm text-primary-300 font-medium">
                  {t('creditsLabel')}: <span className={credits > 0 ? 'text-primary-400' : 'text-red-400'}>{credits}</span> / {MAX_CREDITS}
              </div>
              <div className="flex space-x-2">
                  <button onClick={() => changeLanguage('en')} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${language === 'en' ? 'bg-primary-500 text-white' : 'bg-secondary-700 hover:bg-secondary-600 text-secondary-200'}`} aria-pressed={language === 'en'}>{t('languageEN')}</button>
                  <button onClick={() => changeLanguage('es')} className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${language === 'es' ? 'bg-primary-500 text-white' : 'bg-secondary-700 hover:bg-secondary-600 text-secondary-200'}`} aria-pressed={language === 'es'}>{t('languageES')}</button>
              </div>
          </div>
          <div className="flex items-baseline justify-center space-x-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 self-center"><path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.15A.75.75 0 003 6.805v10.39a.75.75 0 00.366.655l8.256 4.548a.75.75 0 00.756 0l8.256-4.548a.75.75 0 00.366-.655V6.805a.75.75 0 00-.366-.655L12.378 1.602zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /><path d="M10.823 11.745a2.25 2.25 0 102.46-.032l-.01-.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 00-2.378.066zM13.177 10.255a2.25 2.25 0 10-2.46.032l.01.004.018.008.022.01.02.008.012.004a2.25 2.25 0 002.378-.066zM10.823 14.255a2.25 2.25 0 102.46.032l-.01.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 002.378-.066z" /></svg>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                {t('appTitle').replace(' - Beta', '')}
                <span className="text-xl sm:text-2xl lg:text-3xl font-semibold opacity-80 text-primary-500 align-middle"> - Beta</span>
              </h1>
          </div>
          <p className="text-secondary-300 text-xs sm:text-sm max-w-xl mx-auto">{t('appSubtitle')}</p>
      </header>

      {showNotification && notificationMessage && notificationLevel && (
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
          <NotificationBanner 
            message={notificationMessage} 
            level={notificationLevel} 
            showPlans={showPlansForNotification}
            onDismiss={handleDismissNotification}
          />
        </div>
      )}

      <nav className="w-full max-w-xl mx-auto px-2 sm:px-0 mb-5 sm:mb-8 flex justify-center space-x-1 sm:space-x-2 flex-shrink-0" role="tablist" aria-label="Analysis Tabs">
        <TabButton tabId="input" currentTab={activeTab} onClick={() => setActiveTab('input')} Icon={DocumentTextIcon}>{t('tabInputForm')}</TabButton>
        <TabButton tabId="results" currentTab={activeTab} onClick={() => setActiveTab('results')} Icon={PresentationChartLineIcon}>{t('tabAnalysisReport')}</TabButton>
      </nav>

      <main className="flex-1 overflow-y-auto px-2 py-2 sm:px-6 w-full max-w-5xl mx-auto">
        {activeTab === 'input' && (
          <div id="input-panel" role="tabpanel" aria-labelledby="input-tab" className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            {!primaryImageData && !isLoading && credits > 0 && !showNotification && ( 
              <div className="w-full p-4 bg-primary-700/20 border border-primary-600 rounded-lg text-primary-200 flex items-start space-x-3">
                  <LightbulbIcon className="w-6 h-6 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                      <span className="font-semibold">{t('howToUseTitle')}</span> 
                      <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                          <li>{t('howToUseStep1')}</li> 
                          <li>{t('howToUseStep2')}</li>
                          <li>{t('howToUseStep3')}</li>
                          <li>{t('howToUseStep4')}</li>
                          <li>{t('howToUseStep5')}</li>
                      </ol>
                      <span className="block mt-2 text-xs text-primary-300">{t('howToUseNote')}</span>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 bg-secondary-800 rounded-xl shadow-xl">
              <div>
                <label htmlFor="timeframe-select" className="block text-sm font-medium text-primary-300 mb-1 flex items-center">
                  <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary-400"/>
                  {t('timeframeSelectorLabel')} <span className="text-red-400 ml-1">*</span>
                </label>
                <select 
                  id="timeframe-select" 
                  value={selectedTimeframe} 
                  onChange={(e) => setSelectedTimeframe(e.target.value as TimeframeValue | '')}
                  className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-secondary-100 rounded-lg focus:ring-primary-500 focus:border-primary-500 block disabled:opacity-50"
                  disabled={isLoading}
                  required
                >
                  <option value="">{t('selectTimeframeDefault')}</option>
                  {AVAILABLE_TIMEFRAMES.map(tf => (
                    <option key={tf.value} value={tf.value}>{t(tf.labelKey as TranslationKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="asset-select" className="block text-sm font-medium text-primary-300 mb-1 flex items-center">
                  <PresentationChartBarIcon className="w-5 h-5 mr-2 text-primary-400"/>
                  {t('assetSelectorLabel')} <span className="text-red-400 ml-1">*</span>
                </label>
                <select 
                  id="asset-select" 
                  value={selectedAsset} 
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-secondary-100 rounded-lg focus:ring-primary-500 focus:border-primary-500 block disabled:opacity-50"
                  disabled={isLoading}
                  required
                >
                  <option value="">{t('selectAssetDefault')}</option>
                  {ASSET_CATEGORIES.map(category => (
                    <optgroup label={t(category.labelKey as TranslationKey)} key={category.labelKey}>
                      {category.assets.map(asset => (
                        <option key={asset.value} value={asset.value}>{asset.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <ImageUploader 
                key={`primary-image-uploader-${uploaderKeys.primary}`} 
                title={t('primaryChartImageTitle')} 
                inputId="primary-image-upload" 
                onImageUpload={handlePrimaryImageUpload} 
                isLoading={isLoading}
                initialImage={primaryImageData} 
              />
              <ImageUploader 
                key={`expected-image-uploader-${uploaderKeys.expected}`} 
                title={t('expectedOutcomeImageTitle')} 
                inputId="expected-image-upload" 
                onImageUpload={handleExpectedImageUpload} 
                isLoading={isLoading}
                initialImage={expectedImageData}
              />
            </div>
            <div className="w-full md:max-w-md mx-auto p-4 bg-secondary-800 rounded-xl shadow-xl space-y-3">
              <h3 className="text-lg font-semibold text-primary-300">{t('cvatJsonTitle')}</h3>
              {cvatJsonData ? (
                <div className="text-sm text-secondary-300 flex justify-between items-center bg-secondary-700 p-3 rounded-md">
                  <span className="truncate pr-2">{t('cvatJsonFileLabel')} <span className="font-medium text-primary-400">{cvatJsonData.fileName}</span></span>
                  <button onClick={removeCvatJson} className="text-red-400 hover:text-red-300 text-xs p-1 flex-shrink-0" aria-label={`${t('removeButtonLabel')} CVAT JSON file ${cvatJsonData.fileName}`} disabled={isLoading}>{t('removeButtonLabel')}</button>
                </div>
              ) : (
                <label htmlFor="cvat-json-upload" className={`mt-1 flex justify-center items-center px-6 py-3 border-2 border-secondary-600 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors group ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <DocumentArrowUpIcon className="w-6 h-6 text-secondary-500 group-hover:text-primary-400 mr-2" />
                  <span className="text-sm text-secondary-400 group-hover:text-primary-300">{isLoading ? t('analyzingButtonText') : t('cvatJsonLoadButton')}</span>
                  <input id="cvat-json-upload" name="cvat-json-upload" type="file" className="sr-only" onChange={handleCvatJsonUpload} accept="application/json" disabled={isLoading} />
                </label>
              )}
            </div>
            
            {error && <ErrorMessage message={error} onDismiss={clearError} />}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-center pt-2">
              {canClearInputs && (
                  <button onClick={handleClearInputs} disabled={isLoading} className="w-full sm:w-auto px-6 py-3 bg-secondary-600 hover:bg-secondary-500 text-secondary-100 font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center">
                      <TrashIcon className="w-5 h-5 mr-2 inline-block" />{t('clearAllButtonLabel')}
                  </button>
              )}
              <button onClick={performAnalysis} disabled={!canAnalyze} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center">
                  {isLoading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <LightbulbIcon className="w-5 h-5 mr-2 inline-block" />}
                  {isLoading ? t('analyzingButtonText') : t('analyzeButtonText')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div id="results-panel" role="tabpanel" aria-labelledby="results-tab" className="animate-fadeIn grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {analysisResult ? (
                <section aria-labelledby="analysis-report-heading" className="w-full bg-secondary-800 rounded-xl shadow-xl p-4 sm:p-6">
                  <h2 id="analysis-report-heading" className="text-2xl sm:text-3xl font-bold text-primary-400 mb-2 text-center">{t('analysisReportTitle')}</h2>
                  <p className="text-center text-secondary-300 mb-4 text-xs sm:text-sm italic">{getAnalysisForFileNamesText()}</p>
                  <FractalAnalysisDisplay 
                    analysis={analysisResult} 
                    primaryImageDataForAnnotation={currentPrimaryImageDataForAnnotation}
                  /> 
                </section>
              ) : (
                <div className="text-center py-10 text-secondary-400 bg-secondary-800 rounded-xl shadow-xl p-4 sm:p-6 min-h-[300px] flex flex-col justify-center items-center">
                  <PresentationChartLineIcon className="w-16 h-16 mx-auto mb-4 text-secondary-600" />
                  <h3 className="text-xl font-semibold text-primary-300 mb-2">{t('analysisTabPlaceholderTitle')}</h3>
                  <p className="max-w-md">{t('analysisTabPlaceholderText')}</p>
                </div>
              )}
               {error && activeTab === 'results' && <ErrorMessage message={error} onDismiss={clearError} />}
            </div>

            <div className="md:col-span-1">
              <HistoryPanel 
                history={analysisHistory} 
                onSelectItem={handleSelectHistoryItem} 
                onDeleteItem={handleDeleteHistoryItem} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        )}
      </main>
      
      <footer className="w-full max-w-5xl text-center py-6 px-4 self-center flex-shrink-0">
        <p className="text-xs text-secondary-500">{t('footerText', { year: new Date().getFullYear(), appName: t('appTitle') })}</p>
      </footer>
      
      <style>
        {`
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

export default App;