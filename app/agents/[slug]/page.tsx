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

const CATEGORY_SLUG: Record<string, string> = {
  REBALANCING: "rebalancing",
  GRID_TRADING: "grid-trading",
  YIELD_OPTIMIZATION: "yield-optimization",
  HEALTH_FACTOR: "health-factor",
};

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent || !agent.metrics || !agent.trustScore) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-blue-800">Home</Link>
          <span>/</span>
          <Link href={`/category/${CATEGORY_SLUG[agent.category]}`} className="hover:text-blue-800">
            {CATEGORY_LABEL[agent.category]}
          </Link>
          <span>/</span>
          <span className="text-slate-600">{agent.name}</span>
        </nav>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-800">{CATEGORY_LABEL[agent.category]}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-slate-900">{agent.name}</h1>
                    <DataSourceBadge source={agent.dataSource as any} />
                  </div>
                  <p className="mt-2 max-w-xl text-slate-600">{agent.description}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {agent.capabilities.map((c: string) => (
                  <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                <Meta label="Creator" value={agent.creator} mono />
                <Meta label="Pricing" value={agent.pricingModel} />
                <Meta label="Execution model" value={agent.executionModel} />
                <Meta
                  label="Identity"
                  value={agent.erc8004Verified ? `ERC-8004 verified (${agent.erc8004Id})` : "No verified ERC-8004 identity"}
                  mono={agent.erc8004Verified}
                />
              </div>

              {agent.supportedProtocols?.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="text-xs text-slate-400">Supported protocols</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {agent.supportedProtocols.map((p: string) => (
                      <span key={p} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-500">Marketplace metrics</h2>
                <DataSourceBadge source={agent.metrics.source as any} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Success rate" value={`${agent.metrics.successRatePct}%`} />
                <Stat label="Uptime" value={`${agent.metrics.uptimePct}%`} />
                <Stat label="Executions" value={agent.metrics.executionsCount.toLocaleString()} />
                <Stat label="Avg cost" value={`$${agent.metrics.avgCostUsd.toFixed(2)}`} />
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Current snapshot figures from marketplace data. AgentHub does not store a historical
                execution time series for this agent.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <div className="text-sm font-medium text-slate-900">{agent.pricingModel}</div>
                <div className="text-xs text-slate-400">{agent.executionModel}</div>
              </div>
              <Link
                href={`/hire/${agent.slug}`}
                className="rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900"
              >
                Hire agent
              </Link>
            </div>
          </div>

          <div>
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
      </div>
    </main>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}
