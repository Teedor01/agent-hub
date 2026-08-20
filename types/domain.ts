export type AgentCategory =
  | "REBALANCING"
  | "GRID_TRADING"
  | "YIELD_OPTIMIZATION"
  | "HEALTH_FACTOR";

export type DataSource =
  | "VERIFIED_ONCHAIN"
  | "VERIFIED_EXTERNAL"
  | "MARKETPLACE_DERIVED"
  | "SELF_REPORTED"
  | "DEMO";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AgentMetricsInput {
  executionsCount: number;
  successRatePct: number;
  uptimePct: number;
  avgCostUsd: number;
  avgLatencySec: number;
  lastActiveAt: Date;
  source: DataSource;
}

export interface AgentSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AgentCategory;
  capabilities: string[];
  supportedProtocols: string[];
  creator: string;
  pricingModel: string;
  erc8004Verified: boolean;
  dataSource: DataSource;
  metrics: AgentMetricsInput;
}

export interface TrustScoreBreakdown {
  score: number; 
  identityComponent: number; 
  performanceComponent: number; 
  reliabilityComponent: number; 
  activityComponent: number; 
  verificationComponent: number; 
  riskLevel: RiskLevel;
}


export interface RecommendationEvidence {
  agentId: string;
  score: number;
  reasons: string[];
  tradeoffs: string[];
}
