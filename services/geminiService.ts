
import { GoogleGenAI, GenerateContentResponse, Part, Chat } from "@google/genai";
import { FractalAnalysisResult, TradingDecision, ConfidenceLevel, isValidTradingDecision, isValidConfidenceLevel, IdentifiedPattern, BoundingBox } from '../types';
import { GEMINI_MODEL_NAME, ANALYSIS_PROMPT } from '../constants';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

const isValidBoundingBox = (box: any): box is BoundingBox => {
  return box &&
    typeof box.x_min === 'number' && box.x_min >= 0 && box.x_min <= 1 &&
    typeof box.y_min === 'number' && box.y_min >= 0 && box.y_min <= 1 &&
    typeof box.x_max === 'number' && box.x_max >= 0 && box.x_max <= 1 &&
    typeof box.y_max === 'number' && box.y_max >= 0 && box.y_max <= 1 &&
    box.x_min < box.x_max &&
    box.y_min < box.y_max &&
    (typeof box.label === 'string' || typeof box.label === 'undefined') &&
    (typeof box.label_es === 'string' || typeof box.label_es === 'undefined');
};

export const analyzeImageWithGemini = async (
  primaryImageBase64: string,
  primaryImageMimeType: string,
  timeframe: string, // Timeframe for the primary image
  assetType: string,
  expectedImageBase64?: string | null,
  expectedImageMimeType?: string | null,
  cvatJsonString?: string | null,
  secondTimeframe?: string | null // Timeframe for the second (expected) image
): Promise<FractalAnalysisResult> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Cannot perform analysis.");
  }

  const contextualPrompt = ANALYSIS_PROMPT
    .replace(/\[ASSET_TYPE_PLACEHOLDER\]/g, assetType || "Not Specified")
    .replace(/\[TIMEFRAME_PLACEHOLDER\]/g, timeframe || "Not Specified") // Primary timeframe
    .replace(/\[SECOND_TIMEFRAME_PLACEHOLDER\]/g, secondTimeframe || "Not Specified"); // Second image's timeframe

  const allParts: Part[] = [{ text: contextualPrompt }];
  
  allParts.push({
    inlineData: {
      mimeType: primaryImageMimeType,
      data: primaryImageBase64,
    },
  });

  if (expectedImageBase64 && expectedImageMimeType) {
    allParts.push({
      inlineData: {
        mimeType: expectedImageMimeType,
        data: expectedImageBase64,
      },
    });
  }

  if (cvatJsonString) {
    allParts.push({ text: cvatJsonString });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: allParts },
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, 
      },
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);

    const assetNameFromAI = typeof parsedData.assetName === 'string' && parsedData.assetName.trim() !== ''
      ? parsedData.assetName.trim()
      : assetType; // Fallback to user-selected asset type

    const validatedPatterns: IdentifiedPattern[] = Array.isArray(parsedData.patterns_identified)
      ? parsedData.patterns_identified.map((p: any) => ({
          name: typeof p.name === 'string' ? p.name : "Unknown Pattern",
          description: typeof p.description === 'string' ? p.description : "No description",
          name_es: typeof p.name_es === 'string' ? p.name_es : undefined,
          description_es: typeof p.description_es === 'string' ? p.description_es : undefined,
        }))
      : [];

    let tradingDecision = isValidTradingDecision(parsedData.trading_decision)
      ? parsedData.trading_decision
      : TradingDecision.NONE;

    const reasoning = typeof parsedData.reasoning === 'string' ? parsedData.reasoning : "No reasoning provided.";
    const reasoning_es = typeof parsedData.reasoning_es === 'string' ? parsedData.reasoning_es : undefined;
    
    const confidenceLevel = parsedData.confidence_level && isValidConfidenceLevel(parsedData.confidence_level)
      ? parsedData.confidence_level
      : ConfidenceLevel.UNKNOWN;

    // If confidence is Low or Unknown (less than 60%), override the decision to HOLD.
    if (confidenceLevel === ConfidenceLevel.LOW || confidenceLevel === ConfidenceLevel.UNKNOWN) {
        tradingDecision = TradingDecision.HOLD;
    }

    const entry_points = typeof parsedData.entry_points === 'string' ? parsedData.entry_points : undefined;
    const entry_points_es = typeof parsedData.entry_points_es === 'string' ? parsedData.entry_points_es : undefined;
    const stop_loss_levels = typeof parsedData.stop_loss_levels === 'string' ? parsedData.stop_loss_levels : undefined;
    const stop_loss_levels_es = typeof parsedData.stop_loss_levels_es === 'string' ? parsedData.stop_loss_levels_es : undefined;
    const take_profit_levels = typeof parsedData.take_profit_levels === 'string' ? parsedData.take_profit_levels : undefined;
    const take_profit_levels_es = typeof parsedData.take_profit_levels_es === 'string' ? parsedData.take_profit_levels_es : undefined;

    const potential_buy_zones: BoundingBox[] = Array.isArray(parsedData.potential_buy_zones)
      ? parsedData.potential_buy_zones.filter(isValidBoundingBox)
      : [];
      
    const potential_sell_zones: BoundingBox[] = Array.isArray(parsedData.potential_sell_zones)
      ? parsedData.potential_sell_zones.filter(isValidBoundingBox)
      : [];

    const visual_entry_points: BoundingBox[] = Array.isArray(parsedData.visual_entry_points)
      ? parsedData.visual_entry_points.filter(isValidBoundingBox)
      : [];
    
    const visual_stop_loss_levels: BoundingBox[] = Array.isArray(parsedData.visual_stop_loss_levels)
      ? parsedData.visual_stop_loss_levels.filter(isValidBoundingBox)
      : [];

    const visual_take_profit_levels: BoundingBox[] = Array.isArray(parsedData.visual_take_profit_levels)
      ? parsedData.visual_take_profit_levels.filter(isValidBoundingBox)
      : [];

    return {
      assetName: assetNameFromAI,
      patterns_identified: validatedPatterns,
      trading_decision: tradingDecision,
      reasoning: reasoning,
      reasoning_es: reasoning_es,
      confidence_level: confidenceLevel,
      entry_points: entry_points,
      entry_points_es: entry_points_es,
      stop_loss_levels: stop_loss_levels,
      stop_loss_levels_es: stop_loss_levels_es,
      take_profit_levels: take_profit_levels,
      take_profit_levels_es: take_profit_levels_es,
      potential_buy_zones: potential_buy_zones,
      potential_sell_zones: potential_sell_zones,
      visual_entry_points: visual_entry_points,
      visual_stop_loss_levels: visual_stop_loss_levels,
      visual_take_profit_levels: visual_take_profit_levels,
    };

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    let errorMessage = "Failed to analyze image with AI. ";
    if (error instanceof Error) {
      errorMessage += error.message;
    }
     const errorReasoning = `Error during analysis: ${errorMessage}. Please check console for details. The AI might have returned an unexpected format. Raw response: ${ (error as any)?.response?.text || 'N/A'}`;
     return {
      assetName: assetType,
      patterns_identified: [],
      trading_decision: TradingDecision.NONE,
      reasoning: errorReasoning,
      reasoning_es: `Error durante el análisis: ${errorMessage}. Por favor, revisa la consola para más detalles. La IA podría haber devuelto un formato inesperado. Respuesta cruda: ${ (error as any)?.response?.text || 'N/A'}`,
      confidence_level: ConfidenceLevel.UNKNOWN,
      potential_buy_zones: [],
      potential_sell_zones: [],
      visual_entry_points: [],
      visual_stop_loss_levels: [],
      visual_take_profit_levels: [],
    };
  }
};

export const createChatForAnalysis = (analysisContext: FractalAnalysisResult): Chat => {
  const systemInstruction = `You are Rosse-AI, an expert financial market analyst from GoldTrade. The user has just received an analysis from you. The original analysis is: ${JSON.stringify(analysisContext, null, 2)}. Now, answer the user's follow-up questions about this specific analysis. Keep your answers concise and directly related to the provided chart and analysis data. If the user asks who you are, introduce yourself as Rosse-AI. Do not refer to yourself as a generic AI or model. Speak as the analyst who provided the initial report.`;

  const chat = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.5,
    },
  });
  return chat;
};
