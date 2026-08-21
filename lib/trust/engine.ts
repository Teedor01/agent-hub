import { AgentMetricsInput, DataSource, RiskLevel, TrustScoreBreakdown } from "@/types/domain";


const RELIABILITY_SATURATION_EXECUTIONS = 15000;

function daysAgo(date: Date): number {
  const ms = Date.now() - date.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function computeTrustScore(params: {
  erc8004Verified: boolean;
  dataSource: DataSource;
  metrics: AgentMetricsInput;
}): TrustScoreBreakdown {
  const { erc8004Verified, dataSource, metrics } = params;

  const identityComponent = erc8004Verified ? 20 : 5;

  const performanceComponent = Math.round(
    ((metrics.successRatePct / 100) * 0.6 + (metrics.uptimePct / 100) * 0.4) * 30
  );

  const volumeFactor = Math.min(metrics.executionsCount / RELIABILITY_SATURATION_EXECUTIONS, 1);
  const reliabilityComponent = Math.round(volumeFactor * 25);

  const age = daysAgo(metrics.lastActiveAt);
  const activityComponent = age < 1 ? 15 : age <= 2 ? 10 : age <= 7 ? 5 : 0;

  const verificationComponent = dataSource === "VERIFIED_EXTERNAL" || dataSource === "VERIFIED_ONCHAIN" ? 10 : 3;

  const score =
    identityComponent + performanceComponent + reliabilityComponent + activityComponent + verificationComponent;

  const riskLevel: RiskLevel = score >= 80 ? "LOW" : score >= 55 ? "MEDIUM" : "HIGH";

  return {
    score,
    identityComponent,
    performanceComponent,
    reliabilityComponent,
    activityComponent,
    verificationComponent,
    riskLevel,
  };
}


export function explainTrustScore(breakdown: TrustScoreBreakdown, erc8004Verified: boolean): string[] {
  const lines: string[] = [];
  lines.push(
    erc8004Verified
      ? `ERC-8004 identity verified (${breakdown.identityComponent}/20)`
      : `No verified ERC-8004 identity on file (${breakdown.identityComponent}/20)`
  );
  lines.push(`Performance score ${breakdown.performanceComponent}/30, based on success rate and uptime`);
  lines.push(`Reliability score ${breakdown.reliabilityComponent}/25, based on total execution volume`);
  lines.push(`Activity score ${breakdown.activityComponent}/15, based on recency of last execution`);
  lines.push(`Verification score ${breakdown.verificationComponent}/10, based on data source`);
  return lines;
}
