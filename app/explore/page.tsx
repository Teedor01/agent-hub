import Link from "next/link";
import { listAgents } from "@/lib/agents/repository";
import { AgentCard } from "@/components/AgentCard";
import { AgentCategory } from "@/types/domain";

const CATEGORIES: { key: AgentCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "HEALTH_FACTOR", label: "Health Factor" },
  { key: "YIELD_OPTIMIZATION", label: "Yield" },
  { key: "REBALANCING", label: "Rebalancing" },
  { key: "GRID_TRADING", label: "Grid Trading" },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = (category?.toUpperCase() as AgentCategory | undefined) ?? undefined;
  const agents = await listAgents(active ? { category: active } : undefined);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Explore agents</h1>
        <p className="mt-1 text-sm text-slate-500">
          {agents.length} agent{agents.length === 1 ? "" : "s"} on BNB Smart Chain
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = c.key === "ALL" ? !active : active === c.key;
            return (
              <Link
                key={c.key}
                href={c.key === "ALL" ? "/explore" : `/explore?category=${c.key.toLowerCase()}`}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
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
