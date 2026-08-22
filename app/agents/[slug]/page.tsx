import { getAgentBySlug } from "@/lib/agents/repository";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { TrustScorePanel } from "@/components/TrustScorePanel";
import { notFound } from "next/navigation";
import Link from "next/link";

const CATEGORY_LABEL: Record<string, string> = {
  REBALANCING: "Rebalancing",
  GRID_TRADING: "Grid Trading",
  YIELD_OPTIMIZATION: "Yield Optimization",
  HEALTH_FACTOR: "Health Factor",
};

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent || !agent.metrics || !agent.trustScore) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">{CATEGORY_LABEL[agent.category]}</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">{agent.name}</h1>
              <p className="mt-2 max-w-xl text-slate-600">{agent.description}</p>
            </div>
            <DataSourceBadge source={agent.dataSource as any} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {agent.capabilities.map((c: string) => (
              <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {c}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
            <Stat label="Success rate" value={`${agent.metrics.successRatePct}%`} source={agent.metrics.source as any} />
            <Stat label="Uptime" value={`${agent.metrics.uptimePct}%`} source={agent.metrics.source as any} />
            <Stat label="Executions" value={agent.metrics.executionsCount.toLocaleString()} source={agent.metrics.source as any} />
            <Stat label="Avg cost" value={`$${agent.metrics.avgCostUsd.toFixed(2)}`} source={agent.metrics.source as any} />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div className="text-sm text-slate-600">
              <span className="font-medium">Identity: </span>
              {agent.erc8004Verified ? (
                <span>ERC-8004 verified — <code className="text-xs">{agent.erc8004Id}</code></span>
              ) : (
                <span>No verified ERC-8004 identity on file</span>
              )}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Creator: </span>
              <code className="text-xs">{agent.creator}</code>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div>
              <div className="text-sm font-medium text-slate-900">{agent.pricingModel}</div>
              <div className="text-xs text-slate-400">{agent.executionModel}</div>
            </div>
            <Link
              href={`/hire/${agent.slug}`}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Hire Agent
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <TrustScorePanel
            score={agent.trustScore.score}
            identityComponent={agent.trustScore.identityComponent}
            performanceComponent={agent.trustScore.performanceComponent}
            reliabilityComponent={agent.trustScore.reliabilityComponent}
            activityComponent={agent.trustScore.activityComponent}
            verificationComponent={agent.trustScore.verificationComponent}
            riskLevel={agent.trustScore.riskLevel as any}
            erc8004Verified={agent.erc8004Verified}
          />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, source }: { label: string; value: string; source: any }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
      <div className="mt-1">
        <DataSourceBadge source={source} />
      </div>
    </div>
  );
}
