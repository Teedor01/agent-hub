import { explainTrustScore } from "@/lib/trust/engine";
import { DataSourceBadge } from "./DataSourceBadge";

export function TrustScorePanel({
  score,
  identityComponent,
  performanceComponent,
  reliabilityComponent,
  activityComponent,
  verificationComponent,
  riskLevel,
  erc8004Verified,
}: {
  score: number;
  identityComponent: number;
  performanceComponent: number;
  reliabilityComponent: number;
  activityComponent: number;
  verificationComponent: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  erc8004Verified: boolean;
}) {
  const evidence = explainTrustScore(
    { score, identityComponent, performanceComponent, reliabilityComponent, activityComponent, verificationComponent, riskLevel },
    erc8004Verified
  );

  const riskColor =
    riskLevel === "LOW" ? "text-emerald-600" : riskLevel === "MEDIUM" ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">AgentHub Trust Score</h3>
        <DataSourceBadge source="MARKETPLACE_DERIVED" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-slate-400">/ 100</span>
        <span className={`ml-auto text-sm font-medium ${riskColor}`}>{riskLevel} risk</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        {evidence.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-300">•</span>
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-400">
        Score is computed deterministically from the metrics and identity data shown on this page.
        It is not generated or estimated by an AI model.
      </p>
    </div>
  );
}
