import { describe, expect, it } from "vitest";
import { computeTrustScore } from "./engine";

describe("computeTrustScore", () => {
  it("gives a verified, high-performing, high-volume, recently-active agent a high score", () => {
    const result = computeTrustScore({
      erc8004Verified: true,
      dataSource: "VERIFIED_EXTERNAL",
      metrics: {
        executionsCount: 20000,
        successRatePct: 99,
        uptimePct: 99.5,
        avgCostUsd: 0.04,
        avgLatencySec: 1.5,
        lastActiveAt: new Date(),
        source: "VERIFIED_EXTERNAL",
      },
    });
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.riskLevel).toBe("LOW");
  });

  it("gives an unverified, low-volume, stale agent a low score", () => {
    const stale = new Date();
    stale.setDate(stale.getDate() - 30);
    const result = computeTrustScore({
      erc8004Verified: false,
      dataSource: "DEMO",
      metrics: {
        executionsCount: 50,
        successRatePct: 80,
        uptimePct: 85,
        avgCostUsd: 0.1,
        avgLatencySec: 5,
        lastActiveAt: stale,
        source: "DEMO",
      },
    });
    expect(result.riskLevel).toBe("HIGH");
  });

  it("is deterministic: same inputs produce same output", () => {
    const input = {
      erc8004Verified: true,
      dataSource: "VERIFIED_EXTERNAL" as const,
      metrics: {
        executionsCount: 5000,
        successRatePct: 95,
        uptimePct: 97,
        avgCostUsd: 0.03,
        avgLatencySec: 2,
        lastActiveAt: new Date("2026-08-01T00:00:00Z"),
        source: "VERIFIED_EXTERNAL" as const,
      },
    };
    const a = computeTrustScore(input);
    const b = computeTrustScore(input);
    expect(a).toEqual(b);
  });

  it("component weights never exceed their caps", () => {
    const result = computeTrustScore({
      erc8004Verified: true,
      dataSource: "VERIFIED_ONCHAIN",
      metrics: {
        executionsCount: 999999,
        successRatePct: 100,
        uptimePct: 100,
        avgCostUsd: 0,
        avgLatencySec: 0,
        lastActiveAt: new Date(),
        source: "VERIFIED_ONCHAIN",
      },
    });
    expect(result.identityComponent).toBeLessThanOrEqual(20);
    expect(result.performanceComponent).toBeLessThanOrEqual(30);
    expect(result.reliabilityComponent).toBeLessThanOrEqual(25);
    expect(result.activityComponent).toBeLessThanOrEqual(15);
    expect(result.verificationComponent).toBeLessThanOrEqual(10);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
