
import React, { useState, useCallback, ChangeEvent, useContext, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import FractalAnalysisDisplay from './components/FractalAnalysisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import HistoryPanel from './components/HistoryPanel';
import NewsPanel from './components/NewsPanel';
import FollowUpChat from './components/FollowUpChat';
import { analyzeImageWithGemini, createChatForAnalysis } from './services/geminiService';
import { FractalAnalysisResult, HistoricalAnalysis, TradingDecision, ImageFileData, ChatMessage } from './types';
import LightbulbIcon from './components/icons/LightbulbIcon';
import DocumentArrowUpIcon from './components/icons/DocumentArrowUpIcon';
import TrashIcon from './components/icons/TrashIcon';
import { LanguageContext, LanguageContextType } from './contexts/LanguageContext';
import { AuthContext, AuthContextType } from './contexts/AuthContext';
import { useTranslations } from './hooks/useTranslations';
import { Language, TranslationKey } from './i18n';
import { AVAILABLE_TIMEFRAMES, ASSET_CATEGORIES, TimeframeValue, INITIAL_USER_CREDITS } from './constants';
import DocumentTextIcon from './components/icons/DocumentTextIcon'; 
import PresentationChartLineIcon from './components/icons/PresentationChartLineIcon'; 
import CalendarDaysIcon from './components/icons/CalendarDaysIcon';
import PresentationChartBarIcon from './components/icons/PresentationChartBarIcon';
import BellIcon from './components/icons/BellIcon';
import ExclamationTriangleIcon from './components/icons/ExclamationTriangleIcon';
import PricingPlans from './components/PricingPlans';
import { Chat } from '@google/genai';


type ActiveTab = 'input' | 'results' | 'notifications';

interface TabButtonProps {
  tabId: ActiveTab;
  currentTab: ActiveTab;
  onClick: () => void;
  children: React.ReactNode;
  Icon: React.FC<any>; 
  hasNotification?: boolean;
}

const TabButton: React.FC<TabButtonProps> = 
  ({ tabId, currentTab, onClick, children, Icon, hasNotification = false}) => (
  <button
    role="tab"
    aria-selected={currentTab === tabId}
    aria-controls={`${tabId}-panel`}
    id={`${tabId}-tab`}
    onClick={onClick}
    className={`relative flex items-center justify-center space-x-2 px-4 py-3 text-sm sm:text-base font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary-400
      ${currentTab === tabId 
        ? 'bg-secondary-800 text-primary-300 border-b-2 border-primary-500' 
        : 'text-secondary-400 hover:text-primary-300 hover:bg-secondary-700/50'
      } transition-all`}
  >
    <Icon className="w-5 h-5"/>
    <span>{children}</span>
    {hasNotification && (
      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
      </span>
    )}
  </button>
);

const App: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const [primaryImageData, setPrimaryImageData] = useState<ImageFileData | null>(null);
  const [expectedImageData, setExpectedImageData] = useState<ImageFileData | null>(null);
  const [cvatJsonData, setCvatJsonData] = useState<{ content: string; fileName: string } | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeValue | ''>('');
  const [selectedSecondTimeframe, setSelectedSecondTimeframe] = useState<TimeframeValue | ''>('');
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
  
  // State for the new chat feature
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);

  const { language, setLanguage } = useContext(LanguageContext) as LanguageContextType;
  const { currentUser, spendCredit, hasUnreadNews, markNewsAsRead } = useContext(AuthContext) as AuthContextType;
  const { t } = useTranslations();

  const [uploaderKeys, setUploaderKeys] = useState({ primary: 0, expected: 0 });
  
  const credits = currentUser?.credits ?? 0;
  
  useEffect(() => {
    if (!currentUser) return;
    try {
      const savedHistory = localStorage.getItem(`analysisHistory_${currentUser.id}`);
      if (savedHistory) {
        const parsedHistory: HistoricalAnalysis[] = JSON.parse(savedHistory);
        setAnalysisHistory(parsedHistory);
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
      setAnalysisHistory([]); 
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    try {
      const historyToSave = analysisHistory.slice(0, 20);
      localStorage.setItem(`analysisHistory_${currentUser.id}`, JSON.stringify(historyToSave));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }, [analysisHistory, currentUser]);

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
  
  const constructDisplayContextString = (): string => {
    const pFileName = primaryImageData?.fileName || 'N/A';
    const sFileName = expectedImageData?.fileName;
    const cFileName = cvatJsonData?.fileName;

    let context = `${selectedAsset || 'Asset N/A'} (TF: ${selectedTimeframe || 'N/A'}) - ${pFileName}`;
    if (sFileName && selectedSecondTimeframe) {
      context += `; Second Img (TF: ${selectedSecondTimeframe}): ${sFileName}`;
    } else if (sFileName) {
      context += `; Second Img: ${sFileName}`;
    }
    if (cFileName) {
      context += `; CVAT: ${cFileName}`;
    }
    return context;
  };
  
  const resetChatState = () => {
    setChatSession(null);
    setChatMessages([]);
    setIsChatLoading(false);
    setIsChatExpanded(true);
  };

  const resetInputs = (clearAnalysisAlso: boolean = false) => {
    setPrimaryImageData(null);
    setExpectedImageData(null);
    setCvatJsonData(null);
    setSelectedTimeframe('');
    setSelectedSecondTimeframe('');
    setSelectedAsset('');
    setError(null);
    
    if (clearAnalysisAlso) {
      setAnalysisResult(null); 
      setCurrentPrimaryImageDataForAnnotation(null); 
      setCurrentAnalysisFileNames([]);
      resetChatState();
    }
    
    setUploaderKeys(prev => ({ 
        primary: prev.primary + 1, 
        expected: prev.expected + 1 
    }));
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";
  };

  const handleClearInputs = () => {
    const isCurrentAnalysisFromHistory = analysisResult && analysisHistory.some(h => 
        JSON.stringify(h.result) === JSON.stringify(analysisResult) &&
        JSON.stringify(h.fileNames) === JSON.stringify(currentAnalysisFileNames)
    );
    resetInputs(!isCurrentAnalysisFromHistory);
  };
  
  const handlePrimaryImageUpload = useCallback((fileData: ImageFileData | null) => {
    setPrimaryImageData(fileData);
    if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) { 
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
        resetChatState();
    }
    setError(null);
  }, [activeTab, analysisResult, analysisHistory]);

  const handleExpectedImageUpload = useCallback((fileData: ImageFileData | null) => {
    setExpectedImageData(fileData);
    if (!fileData) {
      setSelectedSecondTimeframe('');
    }
     if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
        resetChatState();
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
              setAnalysisResult(null); setCurrentAnalysisFileNames([]); setCurrentPrimaryImageDataForAnnotation(null); resetChatState();
          }
        } catch (e) {
          setError(t('errorInvalidJsonFormat')); setCvatJsonData(null);
        }
      };
      reader.readAsText(file);
    } else {
        setCvatJsonData(null); 
    }
  }, [t, activeTab, analysisResult, analysisHistory]);
  
  const removeCvatJson = () => {
    setCvatJsonData(null);
    if (activeTab === 'results' && analysisResult && !analysisHistory.find(h => h.result === analysisResult)) {
        setAnalysisResult(null); setCurrentAnalysisFileNames([]); setCurrentPrimaryImageDataForAnnotation(null); resetChatState();
    }
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";
  };

  const performAnalysis = useCallback(async () => {
    if (!process.env.API_KEY) {
        setError(t('errorApiKeyMissingShort')); setIsLoading(false); return;
    }
    if (credits <= 0 && currentUser?.role === 'user') {
      setError(t('notificationCreditsEmptyFull')); 
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
    if (expectedImageData && !selectedSecondTimeframe) {
      setError(t('errorSecondTimeframeRequired')); return;
    }


    setIsLoading(true); setError(null); setAnalysisResult(null); setCurrentAnalysisFileNames([]);
    setCurrentPrimaryImageDataForAnnotation(null); 
    resetChatState();
    
    const displayContext = constructDisplayContextString();

    try {
      const result = await analyzeImageWithGemini(
        primaryImageData.base64Image, primaryImageData.mimeType,
        selectedTimeframe, selectedAsset, 
        expectedImageData?.base64Image, expectedImageData?.mimeType,
        cvatJsonData?.content,
        selectedSecondTimeframe || undefined
      );
      setAnalysisResult(result);
      setCurrentPrimaryImageDataForAnnotation(primaryImageData); 
      setCurrentAnalysisFileNames([displayContext]); 
      
      if (!(result.reasoning.startsWith("Error during analysis") || result.reasoning.startsWith("Error durante el análisis"))) {
        spendCredit();

        if (currentUser?.role === 'admin' || currentUser?.role === 'sub-admin' || currentUser?.accountType === 'pro' || currentUser?.accountType === 'enterprise') {
          const historicalEntry: HistoricalAnalysis = {
            id: generateUniqueId(),
            result: result,
            fileNames: [displayContext], 
            timestamp: Date.now(),
            primaryImageData: primaryImageData ? { ...primaryImageData } : undefined,
            expectedImageData: expectedImageData ? { ...expectedImageData } : undefined,
          };
          setAnalysisHistory(prevHistory => 
            [historicalEntry, ...prevHistory].slice(0, 20)
          );
        }
        
        setPrimaryImageData(null);
        setExpectedImageData(null);
        setCvatJsonData(null);
        setSelectedTimeframe('');
        setSelectedSecondTimeframe('');
        setSelectedAsset('');
        setUploaderKeys(prev => ({ 
            primary: prev.primary + 1, 
            expected: prev.expected + 1 
        }));
        const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
        if (cvatInput) {
          cvatInput.value = "";
        }

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
      setCurrentPrimaryImageDataForAnnotation(primaryImageData); 
      setCurrentAnalysisFileNames([displayContext]); 
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
  }, [primaryImageData, expectedImageData, cvatJsonData, t, credits, currentUser, spendCredit]);

  const clearError = useCallback(() => { setError(null); }, []);

  const handleSelectHistoryItem = (item: HistoricalAnalysis) => {
    setAnalysisResult(item.result);
    setCurrentAnalysisFileNames(item.fileNames); 
    
    setPrimaryImageData(item.primaryImageData || null);
    setExpectedImageData(item.expectedImageData || null);
    setCurrentPrimaryImageDataForAnnotation(item.primaryImageData || null);
    
    const historyContext = item.fileNames[0] || "";
    const assetMatch = historyContext.match(/^([^ ]*)/);
    const primaryTFMatch = historyContext.match(/\(TF: ([^),]*)/);
    const secondTFMatch = historyContext.match(/Second Img \(TF: ([^)]*)\)/);

    setSelectedAsset(assetMatch ? assetMatch[1] : '');
    setSelectedTimeframe(primaryTFMatch ? primaryTFMatch[1] as TimeframeValue : '');
    setSelectedSecondTimeframe(secondTFMatch ? secondTFMatch[1] as TimeframeValue : '');


    setCvatJsonData(null); 
    const cvatInput = document.getElementById('cvat-json-upload') as HTMLInputElement;
    if (cvatInput) cvatInput.value = "";

    setActiveTab('results');
    setError(null);
    resetChatState();
  };

  const handleDeleteHistoryItem = (idToDelete: string) => {
    const itemToDelete = analysisHistory.find(item => item.id === idToDelete);
    setAnalysisHistory(prevHistory => prevHistory.filter(item => item.id !== idToDelete));
    
    if (itemToDelete && analysisResult && JSON.stringify(itemToDelete.result) === JSON.stringify(analysisResult) && JSON.stringify(itemToDelete.fileNames) === JSON.stringify(currentAnalysisFileNames)) {
        setAnalysisResult(null);
        setCurrentAnalysisFileNames([]);
        setCurrentPrimaryImageDataForAnnotation(null);
        setPrimaryImageData(null);
        setExpectedImageData(null);
        setSelectedTimeframe('');
        setSelectedSecondTimeframe('');
        setSelectedAsset('');
        resetChatState();
        setUploaderKeys(prev => ({ primary: prev.primary + 1, expected: prev.expected + 1 }));
    }
  };


  const getAnalysisForFileNamesText = () => {
    if (currentAnalysisFileNames.length === 0) return "";
    return t('analysisBasedOn', { files: currentAnalysisFileNames[0] }); 
  }

  const changeLanguage = (lang: Language) => { setLanguage(lang); };

  const canAnalyze = primaryImageData && 
                     selectedTimeframe && 
                     selectedAsset && 
                     !isLoading && 
                     (currentUser?.role !== 'user' || credits > 0) &&
                     (!expectedImageData || (expectedImageData && selectedSecondTimeframe)); 

  const canClearInputs = primaryImageData || expectedImageData || cvatJsonData || selectedTimeframe || selectedSecondTimeframe || selectedAsset;

  let notificationMessage: string | null = null;
  let notificationLevel: 'warning' | 'critical' | 'error' | null = null;
  
  const warningThreshold = Math.floor(INITIAL_USER_CREDITS * 0.3);
  const criticalThreshold = Math.floor(INITIAL_USER_CREDITS * 0.1);
  
  if (!isLoading && currentUser?.role === 'user') {
    if (credits === 0) {
      notificationMessage = t('notificationCreditsEmptyFull');
      notificationLevel = 'error';
    } else if (credits <= criticalThreshold) { 
      notificationMessage = t('notificationCreditsCritical10', { credits: credits.toString() });
      notificationLevel = 'critical';
    } else if (credits <= warningThreshold) {
      notificationMessage = t('notificationCreditsWarning30', { credits: credits.toString() });
      notificationLevel = 'warning';
    }
  }

  const rootContainerClasses = isEmbedded
    ? "flex flex-col h-full bg-secondary-900 text-secondary-100"
    : "flex flex-col min-h-screen bg-secondary-900 text-secondary-100 selection:bg-primary-500 selection:text-white";

  const showHistoryPanel = activeTab === 'results' || activeTab === 'notifications';

  return (
    <div className={rootContainerClasses}>
      {isLoading && <LoadingSpinner progress={analysisProgress} />}
      
      {!isEmbedded && (
          <header className="w-full max-w-5xl text-center mb-6 mt-4 px-4 sm:px-6 self-center flex-shrink-0">
              <div className="flex items-baseline justify-center space-x-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 self-center"><path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.15A.75.75 0 003 6.805v10.39a.75.75 0 00.366.655l8.256 4.548a.75.75 0 00.756 0l8.256-4.548a.75.75 0 00.366-.655V6.805a.75.75 0 00-.366-.655L12.378 1.602zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /><path d="M10.823 11.745a2.25 2.25 0 102.46-.032l-.01-.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 00-2.378.066zM13.177 10.255a2.25 2.25 0 10-2.46.032l.01.004.018.008.022.01.02.008.012.004a2.25 2.25 0 002.378-.066zM10.823 14.255a2.25 2.25 0 102.46.032l-.01.004-.018-.008-.022-.01-.02-.008-.012-.004a2.25 2.25 0 002.378-.066z" /></svg>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                    {t('appTitle').replace(' - Beta', '')}
                    <span className="text-xl sm:text-2xl lg:text-3xl font-semibold opacity-80 text-primary-500 align-middle"> - Beta</span>
                  </h1>
              </div>
              <p className="text-secondary-300 text-xs sm:text-sm max-w-xl mx-auto">{t('appSubtitle')}</p>
          </header>
      )}

      <main className="flex-1 overflow-y-auto px-2 py-2 sm:px-6 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6">
            {/* Main Content Column */}
            <div className={`${showHistoryPanel ? 'md:col-span-7' : 'md:col-span-11'} flex flex-col`}>
                <nav className="w-full mb-5 sm:mb-8 flex justify-center space-x-1 sm:space-x-2 flex-shrink-0" role="tablist" aria-label="Analysis Tabs">
                <TabButton tabId="input" currentTab={activeTab} onClick={() => setActiveTab('input')} Icon={DocumentTextIcon}>{t('tabInputForm')}</TabButton>
                <TabButton tabId="results" currentTab={activeTab} onClick={() => setActiveTab('results')} Icon={PresentationChartLineIcon}>{t('tabAnalysisReport')}</TabButton>
                <TabButton 
                    tabId="notifications" 
                    currentTab={activeTab} 
                    onClick={() => {
                    setActiveTab('notifications');
                    markNewsAsRead();
                    }} 
                    Icon={BellIcon}
                    hasNotification={hasUnreadNews}
                >
                    {t('tabNotifications')}
                </TabButton>
                </nav>
                
                <div className="flex-1">
                {activeTab === 'input' && (
                    <div id="input-panel" role="tabpanel" aria-labelledby="input-tab" className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
                    {!primaryImageData && !isLoading && credits > 0 && !notificationMessage && ( 
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
                        title={t('secondImageOptionalTitle')} 
                        inputId="expected-image-upload" 
                        onImageUpload={handleExpectedImageUpload} 
                        isLoading={isLoading}
                        initialImage={expectedImageData}
                        topContent={expectedImageData ? (
                            <div>
                            <label htmlFor="second-timeframe-select" className="block text-sm font-medium text-primary-300 mb-1 flex items-center">
                                <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary-400"/>
                                {t('secondTimeframeSelectorLabel')} <span className="text-red-400 ml-1">*</span>
                            </label>
                            <select 
                                id="second-timeframe-select" 
                                value={selectedSecondTimeframe} 
                                onChange={(e) => setSelectedSecondTimeframe(e.target.value as TimeframeValue | '')}
                                className="w-full p-2.5 bg-secondary-700 border border-secondary-600 text-secondary-100 rounded-lg focus:ring-primary-500 focus:border-primary-500 block disabled:opacity-50"
                                disabled={isLoading || !expectedImageData}
                                required={!!expectedImageData}
                            >
                                <option value="">{t('selectSecondTimeframeDefault')}</option>
                                {AVAILABLE_TIMEFRAMES.map(tf => (
                                <option key={`second-${tf.value}`} value={tf.value}>{t(tf.labelKey as TranslationKey)}</option>
                                ))}
                            </select>
                            </div>
                        ) : null}
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
                    <div id="results-panel" role="tabpanel" aria-labelledby="results-tab" className="animate-fadeIn space-y-6">
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
                )}

                {activeTab === 'notifications' && (
                    <div id="notifications-panel" role="tabpanel" aria-labelledby="notifications-tab" className="animate-fadeIn space-y-6">
                    {notificationMessage && (
                        <div className={`relative w-full p-3 sm:p-4 rounded-lg border ${notificationLevel === 'error' || notificationLevel === 'critical' ? 'bg-red-800/50 border-red-700 text-red-100' : 'bg-yellow-700/30 border-yellow-600 text-yellow-200'} shadow-lg`}>
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className={`w-6 h-6 mr-3 flex-shrink-0 ${notificationLevel === 'error' || notificationLevel === 'critical' ? 'text-red-300' : 'text-yellow-400'}`} />
                                <p className="font-semibold text-sm sm:text-base">{notificationMessage}</p>
                            </div>
                        </div>
                    )}
                    <NewsPanel />
                    </div>
                )}
                </div>
            </div>

            {/* Sidebar Column */}
            {showHistoryPanel && (
              <div className="md:col-span-4 flex flex-col">
                <div className="md:mt-[5.25rem] flex flex-col space-y-6">
                  <HistoryPanel 
                    history={analysisHistory} 
                    onSelectItem={handleSelectHistoryItem} 
                    onDeleteItem={handleDeleteHistoryItem} 
                    isLoading={isLoading} 
                  />
                  {analysisResult && activeTab === 'results' && (
                    <FollowUpChat
                      analysisResult={analysisResult}
                      chatSession={chatSession}
                      setChatSession={setChatSession}
                      chatMessages={chatMessages}
                      setChatMessages={setChatMessages}
                      isChatLoading={isChatLoading}
                      setIsChatLoading={setIsChatLoading}
                      isExpanded={isChatExpanded}
                      onToggle={() => setIsChatExpanded(prev => !prev)}
                    />
                  )}
                </div>
              </div>
            )}
        </div>
        
        {/* Conditionally render PricingPlans below the grid, only on the notifications tab */}
        {activeTab === 'notifications' && (
            <div className="mt-12">
                <PricingPlans />
            </div>
        )}
      </main>
      
      {!isEmbedded && (
          <footer className="w-full max-w-5xl text-center py-6 px-4 self-center flex-shrink-0">
            <p className="text-xs text-secondary-500">{t('footerText', { year: new Date().getFullYear(), appName: t('appTitle') })}</p>
          </footer>
      )}
    </div>
  );
};

export default App;
