import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { AgentCategory, AgentSummary } from "@/types/domain";



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
