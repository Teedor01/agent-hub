import Link from "next/link";
import { AgentSummary } from "@/types/domain";
import { DataSourceBadge } from "./DataSourceBadge";

const CATEGORY_LABEL: Record<AgentSummary["category"], string> = {
  REBALANCING: "Rebalancing",
  GRID_TRADING: "Grid Trading",
  YIELD_OPTIMIZATION: "Yield Optimization",
  HEALTH_FACTOR: "Health Factor",
};

export function AgentCard({ agent }: { agent: AgentSummary }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{agent.name}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-blue-600">{CATEGORY_LABEL[agent.category]}</p>
        </div>
        <DataSourceBadge source={agent.dataSource} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{agent.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-slate-400">Success rate</div>
          <div className="font-medium text-slate-800">{agent.metrics.successRatePct}%</div>
        </div>
        <div>
          <div className="text-slate-400">Executions</div>
          <div className="font-medium text-slate-800">{agent.metrics.executionsCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-400">Cost</div>
          <div className="font-medium text-slate-800">${agent.metrics.avgCostUsd.toFixed(2)}</div>
        </div>
      </div>
    </Link>
  );
}
