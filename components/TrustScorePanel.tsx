import { DataSourceBadge } from "./DataSourceBadge";

const COMPONENTS = [
  { key: "identityComponent", label: "Identity", max: 20 },
  { key: "performanceComponent", label: "Performance", max: 30 },
  { key: "reliabilityComponent", label: "Reliability", max: 25 },
  { key: "activityComponent", label: "Activity", max: 15 },
  { key: "verificationComponent", label: "Verification", max: 10 },
] as const;

const RISK_STYLE: Record<string, { text: string; ring: string }> = {
  LOW: { text: "text-emerald-600", ring: "stroke-emerald-500" },
  MEDIUM: { text: "text-amber-600", ring: "stroke-amber-500" },
  HIGH: { text: "text-red-600", ring: "stroke-red-500" },
};

export function TrustScorePanel({
  score,
  identityComponent,
  performanceComponent,
  reliabilityComponent,
  activityComponent,
  verificationComponent,
  riskLevel,
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
  const values: Record<string, number> = {
    identityComponent,
    performanceComponent,
    reliabilityComponent,
    activityComponent,
    verificationComponent,
  };
  const risk = RISK_STYLE[riskLevel];


  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">Trust score</h3>
        <span className={`text-xs font-medium ${risk.text}`}>{riskLevel} risk</span>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="relative h-28 w-28">
          <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
            <circle cx="50" cy="50" r={r} className="stroke-slate-100" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={r}
              className={risk.ring}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Evidence breakdown</span>
          <DataSourceBadge source="MARKETPLACE_DERIVED" />
        </div>
        {COMPONENTS.map(({ key, label, max }) => (
          <div key={key}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{label}</span>
              <span className="text-slate-400">
                {values[key]}/{max}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${(values[key] / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Computed deterministically from the metrics and identity data shown on this page.
        Not generated or estimated by an AI model.
      </p>
    </div>
  );
}
