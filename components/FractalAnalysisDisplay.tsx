import React, { useEffect, useRef } from 'react';
import { FractalAnalysisResult, TradingDecision, ConfidenceLevel, IdentifiedPattern, BoundingBox } from '../types';
import LightbulbIcon from './icons/LightbulbIcon';
import ChartIcon from './icons/ChartIcon';
import { useTranslations } from '../hooks/useTranslations';

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

interface ImageFileData {
  base64Image: string;
  mimeType: string;
}

interface FractalAnalysisDisplayProps {
  analysis: FractalAnalysisResult | null;
  primaryImageDataForAnnotation?: ImageFileData | null;
}

const FractalAnalysisDisplay: React.FC<FractalAnalysisDisplayProps> = ({ analysis, primaryImageDataForAnnotation }) => {
  const { t, currentLanguage } = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const InfoSection: React.FC<{titleKey: any, content?: string, Icon: React.FC<any>, iconClass?: string, contentClass?: string}> = ({titleKey, content, Icon, iconClass="text-primary-400", contentClass=""}) => {
    if (!content || content.toLowerCase() === "not applicable" || content.toLowerCase() === "n/a") return null;
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
    if (!value || value.toLowerCase() === "not applicable" || value.toLowerCase() === "n/a") return null;
    return (
        <div className="flex items-start space-x-2">
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorClass}`} />
            <div>
                <span className="text-sm font-medium text-secondary-300">{t(labelKey)}:</span>
                <p className="text-base text-primary-300 ml-1">{value}</p>
            </div>
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
      <h2 className="text-2xl font-semibold text-primary-400 flex items-center">
        <ChartIcon className="w-7 h-7 mr-3 text-primary-500" />
        {t('analysisDisplayResultsTitle')}
      </h2>

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
        <div className={`p-3 sm:p-4 rounded-lg border ${decisionBgColor} flex flex-col`}>
          <h3 className="text-sm font-medium text-secondary-300 mb-1 flex items-center">
             <DecisionIcon className="w-5 h-5 mr-2 opacity-80" />
            {t('analysisDisplayTradingSignal')}
          </h3>
          <p className={`text-xl sm:text-2xl font-bold ${decisionColor} mb-2`}>
            {translateTradingDecision(analysis.trading_decision)}
          </p>
        </div>
        
        <div className={`p-3 sm:p-4 rounded-lg border border-secondary-600 bg-secondary-700/30`}>
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
            {t('analysisDisplayKeyLevelsTitle')}
          </h3>
          <div className="space-y-3 bg-secondary-700/30 p-3 sm:p-4 rounded-md border border-secondary-600">
            <KeyLevelItem labelKey="analysisDisplayEntryPoints" value={entryPointsToDisplay} Icon={MapPinIcon} iconColorClass="text-blue-400" />
            <KeyLevelItem labelKey="analysisDisplayStopLoss" value={stopLossToDisplay} Icon={HandRaisedIcon} iconColorClass="text-red-400" />
            <KeyLevelItem labelKey="analysisDisplayTakeProfit" value={takeProfitToDisplay} Icon={TrophyIcon} iconColorClass="text-green-400" />
          </div>
        </div>
      )}
      
      <InfoSection titleKey="analysisDisplayReasoning" content={reasoningToDisplay} Icon={LightbulbIcon} />

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
                <p className="text-sm text-secondary-300 mt-1 whitespace-pre-wrap">{getPatternDescription(pattern)}</p>
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