import Link from "next/link";
import { listAgents } from "@/lib/agents/repository";
import { AgentCard } from "@/components/AgentCard";
import { AgentCategory } from "@/types/domain";

const CATEGORIES: { key: AgentCategory; label: string; blurb: string }[] = [
  { key: "HEALTH_FACTOR", label: "Health Factor", blurb: "Protect lending positions before liquidation" },
  { key: "YIELD_OPTIMIZATION", label: "Yield Optimization", blurb: "Put idle capital where it earns most" },
  { key: "REBALANCING", label: "Rebalancing", blurb: "Keep a portfolio at target allocation" },
  { key: "GRID_TRADING", label: "Grid Trading", blurb: "Automated strategies within a set range" },
];

export default async function HomePage() {
  const allAgents = await listAgents();
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c.key, allAgents.filter((a) => a.category === c.key)])
  );

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
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
            />
            <button className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
              Ask AgentHub
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        {CATEGORIES.map((c) => (
          <section key={c.key}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{c.label}</h2>
                <p className="text-sm text-slate-500">{c.blurb}</p>
              </div>
              <Link href={`/category/${c.key.toLowerCase()}`} className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {byCategory[c.key].map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
