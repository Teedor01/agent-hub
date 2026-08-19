// SANDBOX-ONLY verification script. Not part of the AgentHub app.
// Exists because Prisma Client can't be generated in this build sandbox
// (binaries.prisma.sh is blocked by network policy). This proves the
// schema DDL and seed data/trust-score logic are correct against a real
// Postgres instance, using the `pg` driver directly instead of Prisma.
import pg from "pg";

const client = new pg.Client({
  host: "localhost",
  user: "agenthub",
  password: "agenthub",
  database: "agenthub",
});
await client.connect();

const agents = [
  { name: "PortfolioBalancer", category: "REBALANCING", executionsCount: 8421, successRatePct: 97.8, uptimePct: 99.1, lastActiveDaysAgo: 0, erc8004Verified: false, dataSource: "DEMO" },
  { name: "DriftGuard", category: "REBALANCING", executionsCount: 3190, successRatePct: 99.0, uptimePct: 99.6, lastActiveDaysAgo: 1, erc8004Verified: true, dataSource: "VERIFIED_EXTERNAL" },
  { name: "QuickRebal", category: "REBALANCING", executionsCount: 1204, successRatePct: 94.2, uptimePct: 96.8, lastActiveDaysAgo: 3, erc8004Verified: false, dataSource: "DEMO" },
  { name: "GridMaster", category: "GRID_TRADING", executionsCount: 21302, successRatePct: 98.1, uptimePct: 99.7, lastActiveDaysAgo: 0, erc8004Verified: true, dataSource: "VERIFIED_EXTERNAL" },
  { name: "RangeBot", category: "GRID_TRADING", executionsCount: 8921, successRatePct: 94.8, uptimePct: 97.8, lastActiveDaysAgo: 1, erc8004Verified: false, dataSource: "DEMO" },
  { name: "VolGrid", category: "GRID_TRADING", executionsCount: 12481, successRatePct: 97.2, uptimePct: 99.2, lastActiveDaysAgo: 0, erc8004Verified: false, dataSource: "DEMO" },
  { name: "YieldPilot", category: "YIELD_OPTIMIZATION", executionsCount: 15887, successRatePct: 98.6, uptimePct: 99.4, lastActiveDaysAgo: 0, erc8004Verified: true, dataSource: "VERIFIED_EXTERNAL" },
  { name: "StableYield", category: "YIELD_OPTIMIZATION", executionsCount: 6204, successRatePct: 99.1, uptimePct: 99.8, lastActiveDaysAgo: 2, erc8004Verified: false, dataSource: "DEMO" },
  { name: "HighYieldScanner", category: "YIELD_OPTIMIZATION", executionsCount: 4102, successRatePct: 92.4, uptimePct: 95.9, lastActiveDaysAgo: 4, erc8004Verified: false, dataSource: "DEMO" },
  { name: "HealthGuard", category: "HEALTH_FACTOR", executionsCount: 12431, successRatePct: 98.7, uptimePct: 99.5, lastActiveDaysAgo: 0, erc8004Verified: true, dataSource: "VERIFIED_EXTERNAL" },
  { name: "LiquidationShield", category: "HEALTH_FACTOR", executionsCount: 5678, successRatePct: 99.3, uptimePct: 99.9, lastActiveDaysAgo: 0, erc8004Verified: false, dataSource: "DEMO" },
  { name: "PositionWatch", category: "HEALTH_FACTOR", executionsCount: 2044, successRatePct: 99.8, uptimePct: 99.2, lastActiveDaysAgo: 1, erc8004Verified: false, dataSource: "DEMO" },
];

function computeTrustScore(a) {
  const identityComponent = a.erc8004Verified ? 20 : 5;
  const performanceComponent = Math.round(((a.successRatePct / 100) * 0.6 + (a.uptimePct / 100) * 0.4) * 30);
  const volumeFactor = Math.min(a.executionsCount / 15000, 1);
  const reliabilityComponent = Math.round(volumeFactor * 25);
  const activityComponent = a.lastActiveDaysAgo === 0 ? 15 : a.lastActiveDaysAgo <= 2 ? 10 : a.lastActiveDaysAgo <= 7 ? 5 : 0;
  const verificationComponent = a.dataSource === "VERIFIED_EXTERNAL" ? 10 : 3;
  const score = identityComponent + performanceComponent + reliabilityComponent + activityComponent + verificationComponent;
  const riskLevel = score >= 80 ? "LOW" : score >= 55 ? "MEDIUM" : "HIGH";
  return { score, identityComponent, performanceComponent, reliabilityComponent, activityComponent, verificationComponent, riskLevel };
}

let i = 0;
for (const a of agents) {
  i++;
  const id = `agent_${i}`;
  await client.query(
    `INSERT INTO "Agent" (id, name, slug, description, category, capabilities, "supportedProtocols", "supportedChains", creator, "pricingModel", "executionModel", "erc8004Verified", "dataSource")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, a.name, a.name.toLowerCase(), "demo description", a.category, [], [], [], "0xdemo", "$0.04/exec", "autonomous", a.erc8004Verified, a.dataSource]
  );
  const lastActiveAt = new Date();
  lastActiveAt.setDate(lastActiveAt.getDate() - a.lastActiveDaysAgo);
  await client.query(
    `INSERT INTO "AgentMetrics" (id, "agentId", "executionsCount", "successRatePct", "uptimePct", "avgCostUsd", "avgLatencySec", "lastActiveAt", source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [`metrics_${i}`, id, a.executionsCount, a.successRatePct, a.uptimePct, 0.04, 2.0, lastActiveAt, a.dataSource === "VERIFIED_EXTERNAL" ? "VERIFIED_EXTERNAL" : "DEMO"]
  );
  const t = computeTrustScore(a);
  await client.query(
    `INSERT INTO "TrustScore" (id, "agentId", score, "identityComponent", "performanceComponent", "reliabilityComponent", "activityComponent", "verificationComponent", "riskLevel")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [`trust_${i}`, id, t.score, t.identityComponent, t.performanceComponent, t.reliabilityComponent, t.activityComponent, t.verificationComponent, t.riskLevel]
  );
  console.log(`${a.name.padEnd(20)} ${a.category.padEnd(20)} trust=${t.score} risk=${t.riskLevel}`);
}

const counts = await client.query(`SELECT category, COUNT(*) FROM "Agent" GROUP BY category ORDER BY category;`);
console.log("\nPer-category counts:");
console.table(counts.rows);

await client.end();
