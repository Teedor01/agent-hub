import Link from "next/link";
import { listAgents } from "@/lib/agents/repository";
import { AgentCard } from "@/components/AgentCard";
import { AgentCategory } from "@/types/domain";
import { notFound } from "next/navigation";

const VALID: Record<string, AgentCategory> = {
  rebalancing: "REBALANCING",
  "grid-trading": "GRID_TRADING",
  "yield-optimization": "YIELD_OPTIMIZATION",
  "health-factor": "HEALTH_FACTOR",
};

const LABEL: Record<AgentCategory, string> = {
  REBALANCING: "Rebalancing",
  GRID_TRADING: "Grid Trading",
  YIELD_OPTIMIZATION: "Yield Optimization",
  HEALTH_FACTOR: "Health Factor",
};

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const key = VALID[category];
  if (!key) notFound();

  const agents = await listAgents({ category: key });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{LABEL[key]} agents</h1>
            <p className="mt-1 text-sm text-slate-500">{agents.length} agents in this category</p>
          </div>
          {agents.length >= 2 && (
            <Link
              href={`/compare?ids=${agents.slice(0, 3).map((a) => a.id).join(",")}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Compare top {Math.min(3, agents.length)}
            </Link>
          )}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </main>
  );
}
