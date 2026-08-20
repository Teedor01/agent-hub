import { AgentSummary } from "@/types/domain";
import { DataSourceBadge } from "./DataSourceBadge";
import Link from "next/link";

type Row = {
  label: string;
  render: (a: AgentSummary) => React.ReactNode;
  sourceOf?: (a: AgentSummary) => AgentSummary["dataSource"];
};

export function ComparisonTable({
  agents,
  trustScores,
}: {
  agents: AgentSummary[];
  trustScores: Record<string, { score: number; riskLevel: "LOW" | "MEDIUM" | "HIGH" }>;
}) {
  const rows: Row[] = [
    { label: "Success rate", render: (a) => `${a.metrics.successRatePct}%`, sourceOf: (a) => a.metrics.source },
    { label: "Executions", render: (a) => a.metrics.executionsCount.toLocaleString(), sourceOf: (a) => a.metrics.source },
    { label: "Uptime", render: (a) => `${a.metrics.uptimePct}%`, sourceOf: (a) => a.metrics.source },
    { label: "Avg cost", render: (a) => `$${a.metrics.avgCostUsd.toFixed(2)}`, sourceOf: (a) => a.metrics.source },
    { label: "Avg latency", render: (a) => `${a.metrics.avgLatencySec.toFixed(1)}s`, sourceOf: (a) => a.metrics.source },
    {
      label: "Trust score",
      render: (a) => trustScores[a.id]?.score ?? "—",
    },
    {
      label: "Risk",
      render: (a) => trustScores[a.id]?.riskLevel ?? "—",
    },
    {
      label: "Identity",
      render: (a) => (a.erc8004Verified ? "ERC-8004 verified" : "Unverified"),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="p-4 text-left font-medium text-slate-500"> </th>
            {agents.map((a) => (
              <th key={a.id} className="p-4 text-left">
                <Link href={`/agents/${a.slug}`} className="font-semibold text-slate-900 hover:text-blue-600">
                  {a.name}
                </Link>
                <div className="mt-1">
                  <DataSourceBadge source={a.dataSource} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-50 last:border-0">
              <td className="p-4 text-slate-500">{row.label}</td>
              {agents.map((a) => (
                <td key={a.id} className="p-4 font-medium text-slate-800">
                  {row.render(a)}
                  {row.sourceOf && (
                    <div className="mt-1">
                      <DataSourceBadge source={row.sourceOf(a)} />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
