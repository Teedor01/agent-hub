import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check that .env exists in the project root and defines it.");
  process.exit(1);
}


try {
  const u = new URL(process.env.DATABASE_URL);
  console.log(`Seeding against ${u.hostname}:${u.port}${u.pathname}`);
} catch {
  console.warn("Could not parse DATABASE_URL to log target host.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


type SeedAgent = {
  name: string;
  slug: string;
  description: string;
  category: "REBALANCING" | "GRID_TRADING" | "YIELD_OPTIMIZATION" | "HEALTH_FACTOR";
  capabilities: string[];
  supportedProtocols: string[];
  supportedChains: string[];
  creator: string;
  pricingModel: string;
  executionModel: string;
  erc8004Id?: string;
  erc8004Verified?: boolean;
  dataSource?: "DEMO" | "VERIFIED_EXTERNAL";
  altana?: {
    allowedContract: string;
    contractLabel: string;
    spendCapWei: string;
    sessionDurationSeconds: number;
    proofSelector: string;
  };
  metrics: {
    executionsCount: number;
    successRatePct: number;
    uptimePct: number;
    avgCostUsd: number;
    avgLatencySec: number;
    lastActiveDaysAgo: number;
  };
};

const agents: SeedAgent[] = [

  {
    name: "PortfolioBalancer",
    slug: "portfolio-balancer",
    description:
      "Rebalances a multi-asset BSC portfolio back to target allocation whenever drift exceeds a configurable threshold.",
    category: "REBALANCING",
    capabilities: ["Threshold rebalancing", "Multi-asset support", "Gas-aware batching"],
    supportedProtocols: ["PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0xA1b2...9F3c",
    pricingModel: "$0.05 / rebalance execution",
    executionModel: "Autonomous, triggers when allocation drift exceeds 5%",
    metrics: { executionsCount: 8421, successRatePct: 97.8, uptimePct: 99.1, avgCostUsd: 0.05, avgLatencySec: 2.4, lastActiveDaysAgo: 0 },
    altana: {

      allowedContract: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
      contractLabel: "PancakeSwap V2 Router (BSC testnet)",
      spendCapWei: "1000000000000000", 
      sessionDurationSeconds: 7 * 24 * 60 * 60, // 7 days

      proofSelector: "0xc45a0155",
    },
  },
  {
    name: "DriftGuard",
    slug: "drift-guard",
    description: "Conservative rebalancing agent that prioritizes minimizing slippage over speed.",
    category: "REBALANCING",
    capabilities: ["Slippage-minimized rebalancing", "Scheduled rebalancing"],
    supportedProtocols: ["PancakeSwap", "Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x7Fa1...22Bd",
    pricingModel: "$0.03 / rebalance execution",
    executionModel: "Scheduled daily check, executes only if drift exceeds threshold",
    erc8004Id: "8004-BSC-118842",
    erc8004Verified: true,
    dataSource: "VERIFIED_EXTERNAL",
    metrics: { executionsCount: 3190, successRatePct: 99.0, uptimePct: 99.6, avgCostUsd: 0.03, avgLatencySec: 3.1, lastActiveDaysAgo: 1 },
  },
  {
    name: "QuickRebal",
    slug: "quickrebal",
    description: "Fast, low-cost rebalancing for two-asset pairs only.",
    category: "REBALANCING",
    capabilities: ["Two-asset rebalancing", "Low-latency execution"],
    supportedProtocols: ["PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x99Cc...11Ae",
    pricingModel: "$0.02 / rebalance execution",
    executionModel: "Autonomous, checks every 10 minutes",
    metrics: { executionsCount: 1204, successRatePct: 94.2, uptimePct: 96.8, avgCostUsd: 0.02, avgLatencySec: 1.6, lastActiveDaysAgo: 3 },
  },


  {
    name: "GridMaster",
    slug: "gridmaster",
    description: "Runs classic grid trading strategies within a set price range on BSC pairs.",
    category: "GRID_TRADING",
    capabilities: ["Configurable grid range", "Auto grid-width adjustment", "Multi-pair support"],
    supportedProtocols: ["PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x44Ab...77Ef",
    pricingModel: "$0.04 / grid execution",
    executionModel: "Autonomous, executes on each grid-line touch",
    erc8004Id: "8004-BSC-204471",
    erc8004Verified: true,
    dataSource: "VERIFIED_EXTERNAL",
    metrics: { executionsCount: 21302, successRatePct: 98.1, uptimePct: 99.7, avgCostUsd: 0.07, avgLatencySec: 1.2, lastActiveDaysAgo: 0 },
  },
  {
    name: "RangeBot",
    slug: "rangebot",
    description: "Tight-range grid trading tuned for stablecoin/BNB pairs with low volatility assumptions.",
    category: "GRID_TRADING",
    capabilities: ["Tight-range grids", "Stablecoin pair focus"],
    supportedProtocols: ["PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x12Fe...88Cd",
    pricingModel: "$0.02 / grid execution",
    executionModel: "Autonomous, executes on each grid-line touch",
    metrics: { executionsCount: 8921, successRatePct: 94.8, uptimePct: 97.8, avgCostUsd: 0.02, avgLatencySec: 3.2, lastActiveDaysAgo: 1 },
    altana: {

      allowedContract: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
      contractLabel: "PancakeSwap V2 Router (BSC testnet)",
      spendCapWei: "1000000000000000", // 0.001 BNB
      sessionDurationSeconds: 7 * 24 * 60 * 60, // 7 days
      proofSelector: "0xc45a0155", // factory()
    },
  },
  {
    name: "VolGrid",
    slug: "volgrid",
    description: "Wide-range grid trading built for volatile pairs, wider grid spacing to reduce whipsaw losses.",
    category: "GRID_TRADING",
    capabilities: ["Wide-range grids", "Volatility-adaptive spacing"],
    supportedProtocols: ["PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x33Da...55Ba",
    pricingModel: "$0.06 / grid execution",
    executionModel: "Autonomous, executes on each grid-line touch",
    metrics: { executionsCount: 12481, successRatePct: 97.2, uptimePct: 99.2, avgCostUsd: 0.04, avgLatencySec: 1.8, lastActiveDaysAgo: 0 },
  },

  {
    name: "YieldPilot",
    slug: "yieldpilot",
    description: "Moves idle stablecoin balances to the highest-yielding vault across supported BSC lending protocols.",
    category: "YIELD_OPTIMIZATION",
    capabilities: ["Auto-compounding", "Cross-protocol yield scanning", "Stablecoin focus"],
    supportedProtocols: ["Venus", "PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x88Ee...33Fa",
    pricingModel: "$0.04 / rebalance to new vault",
    executionModel: "Autonomous, rescans yields every hour",
    erc8004Id: "8004-BSC-337719",
    erc8004Verified: true,
    dataSource: "VERIFIED_EXTERNAL",
    metrics: { executionsCount: 15887, successRatePct: 98.6, uptimePct: 99.4, avgCostUsd: 0.04, avgLatencySec: 2.1, lastActiveDaysAgo: 0 },
  },
  {
    name: "StableYield",
    slug: "stableyield",
    description: "Conservative yield agent restricted to blue-chip lending markets only.",
    category: "YIELD_OPTIMIZATION",
    capabilities: ["Blue-chip market restriction", "Auto-compounding"],
    supportedProtocols: ["Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x21Bc...90Ad",
    pricingModel: "$0.03 / rebalance to new vault",
    executionModel: "Autonomous, rescans yields every 4 hours",
    metrics: { executionsCount: 6204, successRatePct: 99.1, uptimePct: 99.8, avgCostUsd: 0.03, avgLatencySec: 2.6, lastActiveDaysAgo: 2 },
    altana: {
      
      allowedContract: "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D",
      contractLabel: "Venus Unitroller / Core Pool Comptroller (BSC testnet)",
      spendCapWei: "1000000000000000", 
      sessionDurationSeconds: 7 * 24 * 60 * 60, 
      proofSelector: "0xf851a440", 
    },
  },
  {
    name: "HighYieldScanner",
    slug: "high-yield-scanner",
    description: "Aggressive yield chaser across a wider set of pools, higher variance in returns.",
    category: "YIELD_OPTIMIZATION",
    capabilities: ["Broad pool scanning", "Aggressive rebalancing"],
    supportedProtocols: ["Venus", "PancakeSwap"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x66Fd...12Ea",
    pricingModel: "$0.05 / rebalance to new vault",
    executionModel: "Autonomous, rescans yields every 30 minutes",
    metrics: { executionsCount: 4102, successRatePct: 92.4, uptimePct: 95.9, avgCostUsd: 0.05, avgLatencySec: 2.9, lastActiveDaysAgo: 4 },
  },


  {
    name: "AgentCensus Health Factor Monitor",
    slug: "agentcensus-health-factor-monitor",
    description:
      "Live Venus Protocol position monitor on BSC. Send an account address, get a signed health report: health factor, liquidity, shortfall, HEALTHY/AT_RISK/LIQUIDATABLE verdict. Built by AgentCensus -- the honest index of the BNB agent economy.",
    category: "HEALTH_FACTOR",
    capabilities: ["Health factor reporting", "Signed attestations", "Venus Protocol"],
    supportedProtocols: ["Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x0475c8fa8ac94888eab9b4329b93c263708a9a07",
    pricingModel: "Not listed via 8004scan -- check agent endpoint",
    executionModel: "On-demand: query by account address, returns a signed report",
    erc8004Id: "56:270183",
    erc8004Verified: true,
    dataSource: "VERIFIED_EXTERNAL",
    metrics: { executionsCount: 0, successRatePct: 0, uptimePct: 0, avgCostUsd: 0, avgLatencySec: 0, lastActiveDaysAgo: 0 },
    altana: {

      allowedContract: "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D",
      contractLabel: "Venus Unitroller / Core Pool Comptroller (BSC testnet)",
      spendCapWei: "1000000000000000", 
      sessionDurationSeconds: 7 * 24 * 60 * 60, // 7 days

      proofSelector: "0xf851a440",
    },
  },
  {
    name: "HealthGuard",
    slug: "healthguard",
    description: "Monitors lending position health factor and takes preemptive action before liquidation risk.",
    category: "HEALTH_FACTOR",
    capabilities: ["Health factor monitoring", "Preemptive collateral top-up", "Liquidation alerts"],
    supportedProtocols: ["Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x55Cc...44Fa",
    pricingModel: "$0.04 / protective action",
    executionModel: "Autonomous, checks position every 5 minutes",
    erc8004Id: "8004-BSC-118820",
    erc8004Verified: true,
    dataSource: "VERIFIED_EXTERNAL",
    metrics: { executionsCount: 12431, successRatePct: 98.7, uptimePct: 99.5, avgCostUsd: 0.04, avgLatencySec: 1.4, lastActiveDaysAgo: 0 },
  },
  {
    name: "LiquidationShield",
    slug: "liquidationshield",
    description: "Aggressive protection agent that repays debt automatically the moment health factor drops below 1.2.",
    category: "HEALTH_FACTOR",
    capabilities: ["Auto-repay", "Fast threshold response"],
    supportedProtocols: ["Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x77Bb...66Cd",
    pricingModel: "$0.06 / protective action",
    executionModel: "Autonomous, checks position every minute",
    metrics: { executionsCount: 5678, successRatePct: 99.3, uptimePct: 99.9, avgCostUsd: 0.06, avgLatencySec: 0.9, lastActiveDaysAgo: 0 },
  },
  {
    name: "PositionWatch",
    slug: "positionwatch",
    description: "Alert-only health factor monitor; notifies the user but does not take automatic action.",
    category: "HEALTH_FACTOR",
    capabilities: ["Health factor monitoring", "Notification-only"],
    supportedProtocols: ["Venus"],
    supportedChains: ["BNB Smart Chain"],
    creator: "0x91Ac...23Bf",
    pricingModel: "$0.01 / check cycle",
    executionModel: "Autonomous, checks position every 5 minutes, alerts only",
    metrics: { executionsCount: 2044, successRatePct: 99.8, uptimePct: 99.2, avgCostUsd: 0.01, avgLatencySec: 0.6, lastActiveDaysAgo: 1 },
  },
];


function computeTrustScore(a: SeedAgent) {
  const identityComponent = a.erc8004Verified ? 20 : 5;

  const performanceComponent = Math.round(
    ((a.metrics.successRatePct / 100) * 0.6 + (a.metrics.uptimePct / 100) * 0.4) * 30
  );

  const volumeFactor = Math.min(a.metrics.executionsCount / 15000, 1); 
  const reliabilityComponent = Math.round(volumeFactor * 25);

  const activityComponent =
    a.metrics.lastActiveDaysAgo === 0 ? 15 : a.metrics.lastActiveDaysAgo <= 2 ? 10 : a.metrics.lastActiveDaysAgo <= 7 ? 5 : 0;

  const verificationComponent = a.dataSource === "VERIFIED_EXTERNAL" ? 10 : 3;

  const score =
    identityComponent + performanceComponent + reliabilityComponent + activityComponent + verificationComponent;

  const riskLevel: "LOW" | "MEDIUM" | "HIGH" = score >= 80 ? "LOW" : score >= 55 ? "MEDIUM" : "HIGH";

  return {
    score,
    identityComponent,
    performanceComponent,
    reliabilityComponent,
    activityComponent,
    verificationComponent,
    riskLevel,
  };
}

async function main() {
  console.log(`Seeding ${agents.length} agents...`);

  for (const a of agents) {
    const lastActiveAt = new Date();
    lastActiveAt.setDate(lastActiveAt.getDate() - a.metrics.lastActiveDaysAgo);

    const created = await prisma.agent.create({
      data: {
        name: a.name,
        slug: a.slug,
        description: a.description,
        category: a.category,
        capabilities: a.capabilities,
        supportedProtocols: a.supportedProtocols,
        supportedChains: a.supportedChains,
        creator: a.creator,
        pricingModel: a.pricingModel,
        pricingSource: "SELF_REPORTED",
        executionModel: a.executionModel,
        erc8004Id: a.erc8004Id,
        erc8004Verified: a.erc8004Verified ?? false,
        dataSource: a.dataSource ?? "DEMO",
        altanaEnabled: !!a.altana,
        altanaAllowedContract: a.altana?.allowedContract,
        altanaContractLabel: a.altana?.contractLabel,
        altanaSpendCapWei: a.altana?.spendCapWei,
        altanaSessionDurationSeconds: a.altana?.sessionDurationSeconds,
        altanaProofSelector: a.altana?.proofSelector,
        metrics: {
          create: {
            executionsCount: a.metrics.executionsCount,
            successRatePct: a.metrics.successRatePct,
            uptimePct: a.metrics.uptimePct,
            avgCostUsd: a.metrics.avgCostUsd,
            avgLatencySec: a.metrics.avgLatencySec,
            lastActiveAt,
            source: a.dataSource === "VERIFIED_EXTERNAL" ? "VERIFIED_EXTERNAL" : "DEMO",
          },
        },
      },
    });

    const t = computeTrustScore(a);
    await prisma.trustScore.create({
      data: {
        agentId: created.id,
        score: t.score,
        identityComponent: t.identityComponent,
        performanceComponent: t.performanceComponent,
        reliabilityComponent: t.reliabilityComponent,
        activityComponent: t.activityComponent,
        verificationComponent: t.verificationComponent,
        riskLevel: t.riskLevel,
      },
    });

    console.log(`  created ${a.name} (${a.category}) — trust score ${t.score}`);
  }

  const perCategory = await prisma.agent.groupBy({
    by: ["category"],
    _count: true,
  });
  console.log("Per-category counts:", perCategory);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
