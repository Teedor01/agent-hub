import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { AgentCategory, AgentSummary } from "@/types/domain";

// Single choke point for turning Prisma rows into the domain AgentSummary
// shape. Every place in the app that needs agent data goes through here —
// this is what makes "LLM never invents agent data" enforceable: the
// copilot can only ever see what this function returns.

function toSummary(row: any): AgentSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    capabilities: row.capabilities,
    supportedProtocols: row.supportedProtocols,
    creator: row.creator,
    pricingModel: row.pricingModel,
    erc8004Verified: row.erc8004Verified,
    dataSource: row.dataSource,
    metrics: {
      executionsCount: row.metrics.executionsCount,
      successRatePct: row.metrics.successRatePct,
      uptimePct: row.metrics.uptimePct,
      avgCostUsd: row.metrics.avgCostUsd,
      avgLatencySec: row.metrics.avgLatencySec,
      lastActiveAt: row.metrics.lastActiveAt,
      source: row.metrics.source,
    },
  };
}

export async function listAgents(filters?: { category?: AgentCategory; search?: string }): Promise<AgentSummary[]> {
  const rows: any[] = await withDbRetry(() =>
    prisma.agent.findMany({
      where: {
        category: filters?.category,
        ...(filters?.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { metrics: true },
      orderBy: { createdAt: "desc" },
    })
  );
  return rows.filter((r: any) => r.metrics).map(toSummary);
}

export async function getAgentBySlug(slug: string): Promise<any> {
  return withDbRetry(() =>
    prisma.agent.findUnique({
      where: { slug },
      include: { metrics: true, trustScore: true },
    })
  );
}

export async function getAgentsByIds(ids: string[]): Promise<AgentSummary[]> {
  const rows: any[] = await withDbRetry(() =>
    prisma.agent.findMany({
      where: { id: { in: ids } },
      include: { metrics: true },
    })
  );
  return rows.filter((r: any) => r.metrics).map(toSummary);
}

export async function listFeaturedAgents(limit = 4): Promise<AgentSummary[]> {
  const rows: any[] = await withDbRetry(() =>
    prisma.agent.findMany({
      include: { metrics: true, trustScore: true },
      orderBy: { trustScore: { score: "desc" } },
      take: limit,
    })
  );
  return rows.filter((r: any) => r.metrics).map(toSummary);
}

export interface RankedAgentSummary extends AgentSummary {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

// Same ordering as listFeaturedAgents, but keeps the trust score/risk
// alongside each agent -- used by the homepage's ranked list, which shows
// the score inline rather than making a second query per agent.
export async function listTopRatedAgents(limit = 4): Promise<RankedAgentSummary[]> {
  const rows: any[] = await withDbRetry(() =>
    prisma.agent.findMany({
      include: { metrics: true, trustScore: true },
      orderBy: { trustScore: { score: "desc" } },
      take: limit,
    })
  );
  return rows
    .filter((r: any) => r.metrics && r.trustScore)
    .map((r: any) => ({
      ...toSummary(r),
      trustScore: r.trustScore.score,
      riskLevel: r.trustScore.riskLevel,
    }));
}
