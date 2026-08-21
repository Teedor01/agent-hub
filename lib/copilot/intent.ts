import { AgentCategory } from "@/types/domain";

const CATEGORY_KEYWORDS: Record<AgentCategory, string[]> = {
  HEALTH_FACTOR: [
    "health factor",
    "liquidation",
    "lending position",
    "collateral",
    "protect my position",
    "borrow",
    "safe",
    "risky position",
  ],
  YIELD_OPTIMIZATION: ["yield", "apy", "stablecoin", "earn", "interest", "lending rate", "idle"],
  GRID_TRADING: ["grid", "range trading", "buy low sell high", "automated trading strategy"],
  REBALANCING: ["rebalance", "rebalancing", "portfolio", "allocation", "drift"],
};

export interface IntentResult {
  category: AgentCategory | null;
  matchedKeywords: string[];
  confidence: "high" | "low" | "none";
}

export function classifyIntent(userText: string): IntentResult {
  const text = userText.toLowerCase();

  let bestCategory: AgentCategory | null = null;
  let bestMatches: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [AgentCategory, string[]][]) {
    const matches = keywords.filter((k) => text.includes(k));
    if (matches.length > bestMatches.length) {
      bestCategory = category;
      bestMatches = matches;
    }
  }

  return {
    category: bestCategory,
    matchedKeywords: bestMatches,
    confidence: bestMatches.length === 0 ? "none" : bestMatches.length === 1 ? "low" : "high",
  };
}
