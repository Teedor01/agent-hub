import { computeTrustScore } from "@/lib/trust/engine";
import { AgentSummary, RecommendationEvidence } from "@/types/domain";


export function rankAgents(agents: AgentSummary[]): RecommendationEvidence[] {
  const scored = agents.map((agent) => {
    const trust = computeTrustScore({
      erc8004Verified: agent.erc8004Verified,
      dataSource: agent.dataSource,
      metrics: agent.metrics,
    });

    const reasons: string[] = [];
    const tradeoffs: string[] = [];

    if (agent.erc8004Verified) reasons.push("Verified ERC-8004 identity");
    if (agent.metrics.successRatePct >= 98) reasons.push(`High success rate (${agent.metrics.successRatePct}%)`);
    if (agent.metrics.executionsCount >= 10000)
      reasons.push(`Extensive track record (${agent.metrics.executionsCount.toLocaleString()} executions)`);
    if (agent.metrics.uptimePct >= 99) reasons.push(`High uptime (${agent.metrics.uptimePct}%)`);

    if (agent.metrics.executionsCount < 3000)
      tradeoffs.push(`Limited track record (${agent.metrics.executionsCount.toLocaleString()} executions)`);
    if (agent.metrics.avgCostUsd > 0.05) tradeoffs.push(`Higher cost per execution ($${agent.metrics.avgCostUsd.toFixed(2)})`);
    if (!agent.erc8004Verified) tradeoffs.push("No independently verified identity yet");
    if (trust.riskLevel === "HIGH") tradeoffs.push("Trust engine flags this as higher risk");

    if (reasons.length === 0) reasons.push("Meets the basic requirements for this category");

    return {
      agentId: agent.id,
      score: trust.score,
      reasons,
      tradeoffs,
    } satisfies RecommendationEvidence;
  });

  return scored.sort((a, b) => b.score - a.score);
}
