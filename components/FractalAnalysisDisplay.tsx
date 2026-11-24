
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { FractalAnalysisResult, TradingDecision, ConfidenceLevel, IdentifiedPattern, BoundingBox } from '../types';
import LightbulbIcon from './icons/LightbulbIcon';
import ChartIcon from './icons/ChartIcon';
import { useTranslations } from '../hooks/useTranslations';
import { ASSET_CATEGORIES } from '../constants';

import ArrowUpCircleIcon from './icons/ArrowUpCircleIcon';
import ArrowDownCircleIcon from './icons/ArrowDownCircleIcon';
import PauseCircleIcon from './icons/PauseCircleIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import PuzzlePieceIcon from './icons/PuzzlePieceIcon';
import MapPinIcon from './icons/MapPinIcon';
import HandRaisedIcon from './icons/HandRaisedIcon';
import TrophyIcon from './icons/TrophyIcon';
import EyeIcon from './icons/EyeIcon';
import PresentationChartBarIcon from './icons/PresentationChartBarIcon';
import ClipboardDocumentIcon from './icons/ClipboardDocumentIcon';
import ClipboardDocumentCheckIcon from './icons/ClipboardDocumentCheckIcon';
import CameraIcon from './icons/CameraIcon';


interface ImageFileData {
  base64Image: string;
  mimeType: string;
}

interface FractalAnalysisDisplayProps {
  analysis: FractalAnalysisResult | null;
  primaryImageDataForAnnotation?: ImageFileData | null;
}

const HighlightedText: React.FC<{ text: string | undefined; assetName?: string; }> = ({ text, assetName }) => {
    if (!text) return null;

    const keywordConfig = [
        { words: ['BUY', 'COMPRA', 'Take Profit', 'Take Profit Levels', 'Niveles de Take Profit'], className: 'text-green-400 font-bold' },
        { words: ['SELL', 'VENTA', 'Stop Loss', 'Stop Loss Levels', 'Niveles de Stop Loss'], className: 'text-red-400 font-bold' },
        { words: ['HOLD', 'ESPERAR'], className: 'text-yellow-400 font-bold' },
        { words: ['puntos recalcados'], className: 'text-yellow-400 font-bold' },
    ];
    
    if (assetName) {
        keywordConfig.push({ words: [assetName], className: 'text-blue-400 font-bold' });
    }

    const allKeywords = keywordConfig.flatMap(config => config.words);
    
    const regex = new RegExp(`(${allKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => {
                if (!part) return null;
                const matchingConfig = keywordConfig.find(config => 
                    config.words.some(word => word.toLowerCase() === part.toLowerCase())
                );
                
                if (matchingConfig) {
                    return <strong key={index} className={matchingConfig.className}>{part}</strong>;
                } else {
                    return <span key={index}>{part}</span>;
                }
            })}
        </>
    );
};

const FractalAnalysisDisplay: React.FC<FractalAnalysisDisplayProps> = ({ analysis, primaryImageDataForAnnotation }) => {
  const { t, currentLanguage } = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);


  useEffect(() => {
    if (!analysis || !primaryImageDataForAnnotation || !canvasRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.display = 'none';
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.display = 'block';
    const img = new Image();
    img.onload = () => {
      const maxWidth = canvas.parentElement?.clientWidth || 800;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const drawAnnotationOnCanvas = (
        box: BoundingBox,
        fillColor: string, // e.g., "rgba(0, 255, 0, 0.3)"
        borderColor: string, // e.g., "rgb(0, 200, 0)"
        label?: string,
        isThinLineStyle: boolean = false // Hint for styling thin lines
      ) => {
        const x = box.x_min * canvas.width;
        const y = box.y_min * canvas.height;
        const width = (box.x_max - box.x_min) * canvas.width;
        const height = (box.y_max - box.y_min) * canvas.height;

        const actualWidth = Math.max(1, width);
        const actualHeight = Math.max(1, height);
        
        // Fill
        if (fillColor && fillColor !== 'transparent') {
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, actualWidth, actualHeight);
        }
        
        // Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isThinLineStyle ? 2 : 2; // Can differentiate line thickness if needed
        ctx.strokeRect(x, y, actualWidth, actualHeight);

        if (label) {
          ctx.fillStyle = 'white';
          // Adjust font size more flexibly, especially for thin lines
          let fontSize;
          if (isThinLineStyle) {
            fontSize = Math.max(10, Math.min(12, actualWidth / 10)); // Font size based more on width for lines
          } else {
            fontSize = Math.max(10, Math.min(14, actualWidth / 8, actualHeight * 0.6));
          }
          ctx.font = `${fontSize}px Oswald, sans-serif`;
          
          const textMetrics = ctx.measureText(label);
          const textBgHeight = fontSize * 1.3;
          const textBgWidth = textMetrics.width + 8;

          let textX, textY;

          if (isThinLineStyle && actualHeight < 20 && actualWidth > textBgWidth * 1.5) { 
            // For horizontal lines, position label to the right, slightly offset from the line
            ctx.textAlign = 'left';
            textX = x + actualWidth + 5; // Start text 5px to the right of the line's end
            textY = y + actualHeight / 2 + fontSize / 3; // Vertically centered with the line
            // Ensure label doesn't go off canvas
            if (textX + textBgWidth > canvas.width) {
              textX = x - textBgWidth - 5; // Place on left if not enough space on right
              ctx.textAlign = 'right';
            }
          } else {
            // Default: Centered label for zones or thicker lines
            ctx.textAlign = 'center';
            textX = x + actualWidth / 2;
            textY = y + actualHeight / 2 + fontSize / 3;
          }
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          // For left/right aligned text, adjust background rect position
           if (ctx.textAlign === 'left') {
            ctx.fillRect(textX - 4, textY - fontSize * 0.8, textBgWidth, textBgHeight);
          } else if (ctx.textAlign === 'right') {
            ctx.fillRect(textX + 4 - textBgWidth, textY - fontSize * 0.8, textBgWidth, textBgHeight);
          } else { // center
            ctx.fillRect(textX - textBgWidth / 2, textY - fontSize * 0.8, textBgWidth, textBgHeight);
          }
          
          ctx.fillStyle = 'white';
          ctx.fillText(label, textX, textY);
        }
      };

      // Draw potential buy zones (Green rectangles)
      analysis.potential_buy_zones?.forEach(box => {
        const label = currentLanguage === 'es' && box.label_es ? box.label_es : box.label;
        drawAnnotationOnCanvas(box, 'rgba(0, 255, 0, 0.3)', 'rgb(0, 180, 0)', label || t('analysisDisplayBuyZoneLabel'));
      });

      // Draw potential sell zones (Red rectangles)
      analysis.potential_sell_zones?.forEach(box => {
        const label = currentLanguage === 'es' && box.label_es ? box.label_es : box.label;
        drawAnnotationOnCanvas(box, 'rgba(255, 0, 0, 0.3)', 'rgb(180, 0, 0)', label || t('analysisDisplaySellZoneLabel'));
      });

      // Draw visual entry points (Blue lines/thin bars)
      analysis.visual_entry_points?.forEach(box => {
        const label = (currentLanguage === 'es' && box.label_es ? box.label_es : box.label) || t('analysisDisplayEntryLevelLabelDefault');
        drawAnnotationOnCanvas(box, 'rgba(0, 100, 255, 0.7)', 'rgb(0, 80, 200)', label, true);
      });
      
      // Draw visual stop loss levels (Red lines/thin bars)
      analysis.visual_stop_loss_levels?.forEach(box => {
        const label = (currentLanguage === 'es' && box.label_es ? box.label_es : box.label) || t('analysisDisplayStopLossLevelLabelDefault');
        drawAnnotationOnCanvas(box, 'rgba(255, 60, 60, 0.7)', 'rgb(200, 40, 40)', label, true);
      });

      // Draw visual take profit levels (Green lines/thin bars)
      analysis.visual_take_profit_levels?.forEach(box => {
        const label = (currentLanguage === 'es' && box.label_es ? box.label_es : box.label) || t('analysisDisplayTakeProfitLevelLabelDefault');
        drawAnnotationOnCanvas(box, 'rgba(60, 200, 60, 0.7)', 'rgb(40, 150, 40)', label, true);
      });

    };
    img.onerror = () => {
        console.error("Failed to load image for annotation.");
        canvas.style.display = 'none';
    }
    img.src = `data:${primaryImageDataForAnnotation.mimeType};base64,${primaryImageDataForAnnotation.base64Image}`;

  }, [analysis, primaryImageDataForAnnotation, t, currentLanguage]);


  if (!analysis) {
    return null;
  }

  const getDecisionStyles = (decision: TradingDecision): { color: string; bgColor: string; Icon: React.FC<any> } => {
    switch (decision) {
      case TradingDecision.BUY: return { color: 'text-green-400', bgColor: 'bg-green-900/30 border-green-500', Icon: ArrowUpCircleIcon };
      case TradingDecision.SELL: return { color: 'text-red-400', bgColor: 'bg-red-900/30 border-red-500', Icon: ArrowDownCircleIcon };
      case TradingDecision.HOLD: return { color: 'text-yellow-400', bgColor: 'bg-yellow-900/30 border-yellow-500', Icon: PauseCircleIcon };
      default: return { color: 'text-secondary-400', bgColor: 'bg-secondary-700/30 border-secondary-500', Icon: QuestionMarkCircleIcon };
    }
  };

  const getConfidenceStyles = (confidence?: ConfidenceLevel): { text: string; color: string; Icon: React.FC<any> } => {
    switch (confidence) {
      case ConfidenceLevel.HIGH: return { text: t('confidenceLevelHighDisplay'), color: 'text-green-400', Icon: CheckBadgeIcon };
      case ConfidenceLevel.MEDIUM: return { text: t('confidenceLevelMediumDisplay'), color: 'text-yellow-400', Icon: ShieldExclamationIcon };
      case ConfidenceLevel.LOW: return { text: t('confidenceLevelLowDisplay'), color: 'text-red-400', Icon: ExclamationTriangleIcon };
      default: return { text: t('confidenceLevelUnknownDisplay'), color: 'text-secondary-400', Icon: QuestionMarkCircleIcon };
    }
  };

  const translateTradingDecision = (decision: TradingDecision): string => {
    switch (decision) {
      case TradingDecision.BUY: return t('tradingDecisionBuy');
      case TradingDecision.SELL: return t('tradingDecisionSell');
      case TradingDecision.HOLD: return t('tradingDecisionHold');
      default: return t('tradingDecisionNone');
    }
  };
  
  const reasoningToDisplay = currentLanguage === 'es' && analysis.reasoning_es ? analysis.reasoning_es : analysis.reasoning;
  const entryPointsToDisplay = currentLanguage === 'es' && analysis.entry_points_es ? analysis.entry_points_es : analysis.entry_points;
  const stopLossToDisplay = currentLanguage === 'es' && analysis.stop_loss_levels_es ? analysis.stop_loss_levels_es : analysis.stop_loss_levels;
  const takeProfitToDisplay = currentLanguage === 'es' && analysis.take_profit_levels_es ? analysis.take_profit_levels_es : analysis.take_profit_levels;


  const getPatternName = (pattern: IdentifiedPattern): string => {
    return currentLanguage === 'es' && pattern.name_es ? pattern.name_es : pattern.name;
  };

  const getPatternDescription = (pattern: IdentifiedPattern): string => {
    return currentLanguage === 'es' && pattern.description_es ? pattern.description_es : pattern.description;
  };

  const { color: decisionColor, bgColor: decisionBgColor, Icon: DecisionIcon } = getDecisionStyles(analysis.trading_decision);
  const { text: confidenceText, color: confidenceColor, Icon: ConfidenceIcon } = getConfidenceStyles(analysis.confidence_level);

  const translatedDecision = translateTradingDecision(analysis.trading_decision);
  const signalText = (analysis.trading_decision === TradingDecision.BUY || analysis.trading_decision === TradingDecision.SELL) && analysis.assetName
    ? `${translatedDecision} - ${analysis.assetName}`
    : translatedDecision;
    
    
  const generateSignalCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!analysis || !canvasRef.current) return null;
    
    const sourceCanvas = canvasRef.current;

    const PADDING = 40;
    const HEADER_HEIGHT = 100;
    const FOOTER_HEIGHT = 180;
    const LINE_SPACING = 35;
    const FONT_FAMILY = 'Oswald, sans-serif';

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = sourceCanvas.width + PADDING * 2;
    captureCanvas.height = sourceCanvas.height + HEADER_HEIGHT + FOOTER_HEIGHT + PADDING;

    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.fillStyle = '#111827'; // secondary-900
    ctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);

    let currentY = PADDING;

    // Header
    ctx.textAlign = 'center';
    ctx.font = `bold 26px ${FONT_FAMILY}`;
    ctx.fillStyle = '#f59e0b'; // gold-500
    ctx.fillText('GoldTrade AI Signal', captureCanvas.width / 2, currentY + 25);
    currentY += 50;

    // Signal
    ctx.font = `bold 36px ${FONT_FAMILY}`;
    const signalColor = decisionColor === 'text-green-400' ? '#4ade80' : decisionColor === 'text-red-400' ? '#f87171' : decisionColor === 'text-yellow-400' ? '#facc15' : '#9ca3af';
    ctx.fillStyle = signalColor;
    ctx.fillText(signalText, captureCanvas.width / 2, currentY + 30);
    currentY += 50;

    // Chart
    ctx.drawImage(sourceCanvas, PADDING, currentY);
    currentY += sourceCanvas.height;
    currentY += PADDING + 10;

    // Footer info
    ctx.textAlign = 'left';
    const drawInfoLine = (label: string, value: string, valueColor: string) => {
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.fillStyle = '#d1d5db'; // secondary-300
        const labelMetrics = ctx.measureText(label);
        ctx.fillText(label, PADDING, currentY);
        
        ctx.font = `bold 22px ${FONT_FAMILY}`;
        ctx.fillStyle = valueColor;
        ctx.fillText(value, PADDING + labelMetrics.width + 15, currentY);
        currentY += LINE_SPACING;
    };
    
    const confidenceHexColor = confidenceColor === 'text-green-400' ? '#4ade80' : confidenceColor === 'text-yellow-400' ? '#facc15' : confidenceColor === 'text-red-400' ? '#f87171' : '#9ca3af';
    drawInfoLine(`${t('analysisDisplayConfidenceLevel')}:`, confidenceText, confidenceHexColor);
    
    currentY += 10;
    
    if (entryPointsToDisplay) drawInfoLine(`${t('analysisDisplayEntryPoints')}:`, entryPointsToDisplay, '#60a5fa');
    if (stopLossToDisplay) drawInfoLine(`${t('analysisDisplayStopLoss')}:`, stopLossToDisplay, '#f87171');
    if (takeProfitToDisplay) drawInfoLine(`${t('analysisDisplayTakeProfit')}:`, takeProfitToDisplay, '#4ade80');

    return captureCanvas;
  };

  const handleCapture = async () => {
    if (!analysis || !canvasRef.current || isCapturing || isCopying) return;

    setIsCapturing(true);
    try {
        const captureCanvas = await generateSignalCanvas();
        if (!captureCanvas) return;

        const dataUrl = captureCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        link.download = `${t('captureFilenamePrefix')}_${analysis.assetName || 'Asset'}_${date}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to capture signal image:", error);
    } finally {
        setIsCapturing(false);
    }
  };
  
  const handleCopyImage = async () => {
    if (!analysis || !canvasRef.current || isCapturing || isCopying) return;
    setIsCopying(true);
    setCopySuccess(false);

    try {
        const captureCanvas = await generateSignalCanvas();
        if (!captureCanvas) return;

        captureCanvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } catch (clipError) {
                    console.error('Failed to copy image to clipboard:', clipError);
                }
            }
        }, 'image/png');
    } catch (err) {
        console.error("Error generating image for copy:", err);
    } finally {
        setIsCopying(false);
    }
  };


  const InfoSection: React.FC<{titleKey: any, content?: React.ReactNode, Icon: React.FC<any>, iconClass?: string, contentClass?: string}> = ({titleKey, content, Icon, iconClass="text-primary-400", contentClass=""}) => {
    if (!content || (typeof content === 'string' && (content.toLowerCase() === "not applicable" || content.toLowerCase() === "n/a"))) return null;
    return (
        <div>
            <h3 className="text-lg font-semibold text-primary-300 mb-2 flex items-center">
                <Icon className={`w-5 h-5 mr-2 ${iconClass}`} />
                {t(titleKey)}
            </h3>
            <p className={`text-secondary-300 leading-relaxed bg-secondary-700/50 p-3 sm:p-4 rounded-md whitespace-pre-wrap ${contentClass}`}>
                {content}
            </p>
        </div>
    );
  }

  const KeyLevelItem: React.FC<{labelKey: any, value?: string, Icon: React.FC<any>, iconColorClass: string}> = ({ labelKey, value, Icon, iconColorClass }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    if (!value || value.toLowerCase() === "not applicable" || value.toLowerCase() === "n/a") return null;

    const handleCopy = () => {
      if (value) {
        // Extracts sequences of digits and decimal points.
        const numbers = value.match(/[\d.]+/g);

        // Joins all found numbers without spaces and copies to clipboard.
        // e.g., "Entry at 1.1230" becomes "1.1230"
        const textToCopy = numbers ? numbers.join('') : '';

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
      }
    };

    return (
        <div className="flex items-center space-x-3">
            <Icon className={`w-6 h-6 flex-shrink-0 ${iconColorClass}`} />
            <div className="flex-grow">
                <span className="text-sm font-medium text-secondary-300">{t(labelKey)}:</span>
                <p className="text-base text-primary-300 whitespace-pre-wrap">{value}</p>
            </div>
             <button
                onClick={handleCopy}
                className={`ml-4 flex-shrink-0 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-700 ${
                    isCopied
                    ? 'bg-green-600 focus:ring-green-500 scale-110'
                    : 'bg-secondary-600 hover:bg-primary-700 focus:ring-primary-500'
                }`}
                aria-label={isCopied ? t('copiedButtonLabel') : t('copyButtonLabel', { level: t(labelKey) })}
                title={isCopied ? t('copiedButtonLabel') : t('copyButtonLabel', { level: t(labelKey) })}
            >
                {isCopied ? (
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
                ) : (
                    <ClipboardDocumentIcon className="w-5 h-5 text-secondary-200" />
                )}
            </button>
        </div>
    );
  };
  
  const hasAnnotations = (analysis.potential_buy_zones && analysis.potential_buy_zones.length > 0) ||
                         (analysis.potential_sell_zones && analysis.potential_sell_zones.length > 0) ||
                         (analysis.visual_entry_points && analysis.visual_entry_points.length > 0) ||
                         (analysis.visual_stop_loss_levels && analysis.visual_stop_loss_levels.length > 0) ||
                         (analysis.visual_take_profit_levels && analysis.visual_take_profit_levels.length > 0);


  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-primary-400 flex items-center">
            <ChartIcon className="w-7 h-7 mr-3 text-primary-500" />
            {t('analysisDisplayResultsTitle')}
        </h2>
        
        <div className="flex items-center space-x-2">
            <button
                onClick={handleCapture}
                title={t('captureSignalButtonTitle')}
                disabled={isCapturing || isCopying}
                className="p-2 bg-secondary-700 text-primary-300 rounded-lg hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isCapturing ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <CameraIcon className="w-5 h-5" />
                )}
            </button>

            <button
                onClick={handleCopyImage}
                title={copySuccess ? t('copiedButtonLabel') : t('copySignalButtonTitle')}
                disabled={isCapturing || isCopying}
                className="p-2 bg-secondary-700 text-primary-300 rounded-lg hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isCopying ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : copySuccess ? (
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-400" />
                ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                )}
            </button>
        </div>
      </div>


      {primaryImageDataForAnnotation && hasAnnotations && (
        <div className="mt-6 mb-4">
          <h3 className="text-xl font-semibold text-primary-300 mb-3 flex items-center">
            <EyeIcon className="w-6 h-6 mr-2 text-primary-400" />
            {t('analysisDisplayAnnotatedChartTitle')}
          </h3>
          <div className="bg-secondary-700/30 p-2 sm:p-3 rounded-lg border border-secondary-600 flex justify-center items-center">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-md shadow-lg"></canvas>
          </div>
           <p className="text-xs text-secondary-400 mt-2 text-center">{t('analysisDisplayAnnotationDisclaimer')}</p>
        </div>
      )}
       {primaryImageDataForAnnotation && !hasAnnotations && analysis.trading_decision !== TradingDecision.NONE && (
         <div className="mt-6 mb-4 p-3 bg-secondary-700/20 border border-secondary-600 rounded-lg text-sm text-secondary-300 text-center">
            {t('analysisDisplayNoVisualZones')}
        </div>
      )}


      {/* Trading Signal & Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-3 sm:p-4 rounded-lg border ${decisionBgColor} flex flex-col items-center justify-center`}>
          <h3 className="text-sm font-medium text-secondary-300 mb-1 flex items-center">
             <DecisionIcon className="w-5 h-5 mr-2 opacity-80" />
            {t('analysisDisplayTradingSignal')}
          </h3>
          <p className={`text-xl sm:text-2xl font-bold ${decisionColor} text-center`} title={signalText}>
            <HighlightedText text={signalText} assetName={analysis.assetName} />
          </p>
        </div>
        
        <div className={`p-3 sm:p-4 rounded-lg border border-secondary-600 bg-secondary-700/30 flex flex-col items-center justify-center`}>
            <h3 className="text-sm font-medium text-secondary-300 mb-1 flex items-center">
                <ConfidenceIcon className="w-5 h-5 mr-2 opacity-80" />
                {t('analysisDisplayConfidenceLevel')}
            </h3>
            <p className={`text-lg sm:text-xl font-bold ${confidenceColor}`}>
                {confidenceText}
            </p>
        </div>
      </div>
      
      {(entryPointsToDisplay || stopLossToDisplay || takeProfitToDisplay) &&
        (entryPointsToDisplay?.toLowerCase() !== "not applicable" || stopLossToDisplay?.toLowerCase() !== "not applicable" || takeProfitToDisplay?.toLowerCase() !== "not applicable") &&
        (entryPointsToDisplay?.toLowerCase() !== "n/a" || stopLossToDisplay?.toLowerCase() !== "n/a" || takeProfitToDisplay?.toLowerCase() !== "n/a") &&
      (
        <div>
          <h3 className="text-lg font-semibold text-primary-300 mb-3 flex items-center">
            <PresentationChartBarIcon className="w-5 h-5 mr-2 text-primary-400" />
            {t('analysisDisplayKeyLevelsTitle')}
          </h3>
          <div className="space-y-3 bg-secondary-700/30 p-3 sm:p-4 rounded-md border border-secondary-600">
            <KeyLevelItem labelKey="analysisDisplayEntryPoints" value={entryPointsToDisplay} Icon={MapPinIcon} iconColorClass="text-blue-400" />
            <KeyLevelItem labelKey="analysisDisplayTakeProfit" value={takeProfitToDisplay} Icon={TrophyIcon} iconColorClass="text-green-400" />
            <KeyLevelItem labelKey="analysisDisplayStopLoss" value={stopLossToDisplay} Icon={HandRaisedIcon} iconColorClass="text-red-400" />
          </div>
        </div>
      )}
      
      <InfoSection 
        titleKey="analysisDisplayReasoning" 
        content={reasoningToDisplay ? <HighlightedText text={reasoningToDisplay} assetName={analysis.assetName} /> : reasoningToDisplay} 
        Icon={LightbulbIcon} 
        contentClass="font-poppins" 
      />

      {analysis.patterns_identified && analysis.patterns_identified.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-primary-300 mb-3">{t('analysisDisplayIdentifiedPatterns')}</h3>
          <ul className="space-y-3">
            {analysis.patterns_identified.map((pattern: IdentifiedPattern, index: number) => (
              <li key={index} className="p-3 sm:p-4 bg-secondary-700/50 rounded-lg border border-secondary-600 hover:border-primary-600 transition-colors">
                <h4 className="font-semibold text-primary-400 flex items-center">
                    <PuzzlePieceIcon className="w-5 h-5 mr-2 text-primary-500 opacity-80" />
                    {getPatternName(pattern)}
                </h4>
                <p className="text-sm text-secondary-300 mt-1 whitespace-pre-wrap font-poppins">
                  <HighlightedText text={getPatternDescription(pattern)} assetName={analysis.assetName} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
       {(analysis.patterns_identified.length === 0 && analysis.trading_decision === TradingDecision.NONE && !analysis.reasoning.startsWith("Error during analysis") && !analysis.reasoning.startsWith("Error durante el análisis")) && (
        <p className="text-secondary-400 text-center py-4">{t('analysisDisplayNoPatterns')}</p>
      )}
    </div>
  );
};

export default FractalAnalysisDisplay;
