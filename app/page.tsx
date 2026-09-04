import Link from "next/link";
import { listTopRatedAgents } from "@/lib/agents/repository";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { IconShield, IconPieChart, IconScale, IconGrid } from "@/components/icons";
import { AgentCategory } from "@/types/domain";

const CATEGORIES: {
  key: AgentCategory;
  label: string;
  blurb: string;
  icon: typeof IconShield;
}[] = [
  { key: "HEALTH_FACTOR", label: "Health Factor", blurb: "Protect positions before liquidation", icon: IconShield },
  { key: "YIELD_OPTIMIZATION", label: "Yield", blurb: "Optimize and grow your yield", icon: IconPieChart },
  { key: "REBALANCING", label: "Rebalancing", blurb: "Keep your portfolio in balance", icon: IconScale },
  { key: "GRID_TRADING", label: "Grid Trading", blurb: "Automate market-making strategies", icon: IconGrid },
];

const CATEGORY_LABEL: Record<AgentCategory, string> = {
  REBALANCING: "Rebalancing",
  GRID_TRADING: "Grid Trading",
  YIELD_OPTIMIZATION: "Yield Optimization",
  HEALTH_FACTOR: "Health Factor",
};

const RISK_COLOR: Record<string, string> = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
};

export default async function HomePage() {
  const topAgents = await listTopRatedAgents(4);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Find the right AI agent for your DeFi task
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Describe what you want to accomplish. AgentHub finds the best agent on BNB Smart Chain,
            shows the evidence, and lets you compare before you hire.
          </p>
          <form action="/copilot" className="mx-auto mt-8 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="e.g. I want to protect my lending position"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
            />
            <button className="rounded-lg bg-blue-800 px-5 py-3 text-sm font-medium text-white hover:bg-blue-900">
              Ask AgentHub
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/category/${c.key.toLowerCase().replace(/_/g, "-")}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-500 hover:shadow-sm"
            >
              <c.icon className="h-6 w-6 text-blue-800" />
              <div className="mt-3 font-semibold text-slate-900">{c.label}</div>
              <p className="mt-1 text-xs text-slate-500">{c.blurb}</p>
            </Link>
          ))}
        </div>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top rated agents</h2>
              <p className="text-sm text-slate-500">Ranked by AgentHub Trust Score, across all categories</p>
            </div>
            <Link href="/explore" className="text-sm text-blue-800 hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {topAgents.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <span className="w-5 text-sm font-medium text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{agent.name}</span>
                    <DataSourceBadge source={agent.dataSource} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {CATEGORY_LABEL[agent.category]} · {agent.description}
                  </p>
                </div>
                <div className="hidden shrink-0 gap-6 text-right text-sm sm:flex">
                  <div>
                    <div className="text-xs text-slate-400">Trust score</div>
                    <div className={`font-medium ${RISK_COLOR[agent.riskLevel]}`}>{agent.trustScore}/100</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Success rate</div>
                    <div className="font-medium text-slate-800">{agent.metrics.successRatePct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Executions</div>
                    <div className="font-medium text-slate-800">{agent.metrics.executionsCount.toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:grid-cols-4">
          <div>All agents on BNB Smart Chain</div>
          <div>Transparent evidence</div>
          <div>Compare before you hire</div>
          <div>Simulated or on-chain hiring</div>
        </div>
      </div>
    </main>
  );
}
