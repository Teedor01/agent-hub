import { getAgentsByIds } from "@/lib/agents/repository";
import { prisma } from "@/lib/db";
import { ComparisonTable } from "@/components/ComparisonTable";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").filter(Boolean).slice(0, 3); 

  if (idList.length < 2) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-600">
          Select at least two agents to compare. Go to a category page and choose agents to add to comparison.
        </div>
      </main>
    );
  }

  const agents = await getAgentsByIds(idList);
  const trustRows = await prisma.trustScore.findMany({ where: { agentId: { in: idList } } });
  const trustScores = Object.fromEntries(
    trustRows.map((t: { agentId: string; score: number; riskLevel: string }) => [
      t.agentId,
      { score: t.score, riskLevel: t.riskLevel as "LOW" | "MEDIUM" | "HIGH" },
    ])
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Compare agents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Same metrics, side by side, so you can see why one might fit your task better than another.
        </p>
        <div className="mt-6">
          <ComparisonTable agents={agents} trustScores={trustScores} />
        </div>
      </div>
    </main>
  );
}
