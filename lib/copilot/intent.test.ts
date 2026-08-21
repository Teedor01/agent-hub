import { describe, expect, it } from "vitest";
import { classifyIntent } from "./intent";

describe("classifyIntent", () => {
  it("maps lending protection language to HEALTH_FACTOR", () => {
    const result = classifyIntent("I want something that keeps my lending position safe");
    expect(result.category).toBe("HEALTH_FACTOR");
  });

  it("maps yield language to YIELD_OPTIMIZATION", () => {
    const result = classifyIntent("I want to optimize my stablecoin yield");
    expect(result.category).toBe("YIELD_OPTIMIZATION");
  });

  it("maps rebalancing language to REBALANCING", () => {
    const result = classifyIntent("I want an agent to automatically rebalance my portfolio");
    expect(result.category).toBe("REBALANCING");
  });

  it("maps grid language to GRID_TRADING", () => {
    const result = classifyIntent("run a grid trading strategy for me");
    expect(result.category).toBe("GRID_TRADING");
  });

  it("returns null category with no keyword overlap", () => {
    const result = classifyIntent("what's the weather like today");
    expect(result.category).toBeNull();
    expect(result.confidence).toBe("none");
  });
});
