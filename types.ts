export interface TradingPlan {
  targetName: string; // Stock Name or Sector
  direction: 'BUY' | 'SELL' | 'WATCH';
  triggerCondition: string; // When to buy
  strategy: string; // How to buy (low suck, limit board, etc.)
  positionControl: string; // e.g., "10% max"
  stopLoss: string;
  takeProfit: string;
  rationale: string;
}

export interface HotSector {
  name: string;
  performance: string; // e.g., "+3.5%"
  leaderStock: string;
  flowStatus: string; // e.g., "Inflow", "Outflow"
}

export interface SentimentPoint {
  date: string;
  score: number;
  label: string;
}

export interface SectorPoint {
  date: string;
  sectorName: string;
  intensity: number; // 1-10 scale or 0-100
  description: string;
}

export interface MarketAnalysis {
  marketDate: string;
  sentimentScore: number; // 0-100
  sentimentText: string; // "Fear", "Greed", "Cautious"
  limitUpCount: number;
  limitDownCount: number;
  marketVolume: string; // e.g. "8000亿"
  
  // Section 1: Review
  hotSectors: HotSector[];
  fundFlowAnalysis: string; // Analysis of institutions vs retail vs north
  marketLogic: string; // The core narrative
  
  // Section 2: Trends (New)
  sentimentTrend: SentimentPoint[];
  sectorTrend: SectorPoint[];

  // Section 3: Plan
  tradingPlans: TradingPlan[];
  
  // Sources for grounding
  sources: { title: string; uri: string }[];
}

export interface AnalysisState {
  isLoading: boolean;
  data: MarketAnalysis | null;
  error: string | null;
}