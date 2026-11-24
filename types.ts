
export interface ImageFileData {
  base64Image: string;
  mimeType: string;
  fileName: string;
}

export interface IdentifiedPattern {
  name: string;
  description: string;
  name_es?: string;
  description_es?: string;
}

export enum TradingDecision {
  BUY = "BUY",
  SELL = "SELL",
  HOLD = "HOLD",
  NONE = "NONE"
}

export enum ConfidenceLevel {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
  UNKNOWN = "Unknown"
}

export interface BoundingBox {
  x_min: number; // Percentage of image width (0.0 to 1.0)
  y_min: number; // Percentage of image height (0.0 to 1.0)
  x_max: number; // Percentage of image width (0.0 to 1.0)
  y_max: number; // Percentage of image height (0.0 to 1.0)
  label?: string; // Optional English label
  label_es?: string; // Optional Spanish label
}

export interface FractalAnalysisResult {
  assetName?: string;
  patterns_identified: IdentifiedPattern[];
  trading_decision: TradingDecision;
  reasoning: string;
  confidence_level?: ConfidenceLevel;
  reasoning_es?: string;
  entry_points?: string; 
  stop_loss_levels?: string; 
  take_profit_levels?: string; 
  entry_points_es?: string;
  stop_loss_levels_es?: string;
  take_profit_levels_es?: string;
  potential_buy_zones?: BoundingBox[];
  potential_sell_zones?: BoundingBox[];
  visual_entry_points?: BoundingBox[]; // Added for blue entry lines
  visual_stop_loss_levels?: BoundingBox[]; // Added for red stop loss lines
  visual_take_profit_levels?: BoundingBox[]; // Added for green take profit lines
}

export interface HistoricalAnalysis {
  id: string; 
  result: FractalAnalysisResult;
  fileNames: string[]; 
  timestamp: number; 
  primaryImageData?: ImageFileData;
  expectedImageData?: ImageFileData;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nickname?: string;
  passwordHash: string; // In a real app, this would be a securely generated hash
  credits: number;
  isBlocked: boolean;
  role: 'user' | 'admin' | 'sub-admin';
  contactNumber: string;
  dateOfBirth: string;
  registrationTimestamp: number;
  profilePictureUrl?: string; // Can be a data URL
  referralCodeUsed?: string;
  ownReferralCode?: string;
  accountType: 'demo' | 'pro' | 'enterprise';
  consumedCredits?: number; // For sub-admins to track usage
}

export type ReactionType = 'like' | 'wow' | 'sad' | 'funny';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  reactions: {
    [key in ReactionType]: number;
  };
  reactedBy: {
    [userId: string]: ReactionType;
  };
  targetAccountTypes?: ('demo' | 'pro' | 'enterprise')[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}


export function isValidTradingDecision(value: string): value is TradingDecision {
  return Object.values(TradingDecision).includes(value as TradingDecision);
}

export function isValidConfidenceLevel(value: string): value is ConfidenceLevel {
  return Object.values(ConfidenceLevel).includes(value as ConfidenceLevel);
}