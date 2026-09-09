import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetBlock = vi.fn();
const mockReadContract = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: () => ({
      getBlock: mockGetBlock,
      readContract: mockReadContract,
    }),
  };
});

import { runPancakeGridTask } from "./pancake-grid";

const BLOCK = { number: BigInt(100), timestamp: BigInt(1_700_000_000) };
const ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const USDT = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";
const PAIR = "0x9999999999999999999999999999999999999a";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Fixture {
  reserve0?: bigint;
  reserve1?: bigint;
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token0Decimals?: number;
  token1Symbol?: string;
  token1Decimals?: number;
  pairAddress?: string;
}

function mockChain(fixture: Fixture = {}) {
  const {
    reserve0 = BigInt("5000000000000000000"), 
    reserve1 = BigInt("1500000000"), 
    token0 = WBNB,
    token1 = USDT,
    token0Symbol = "WBNB",
    token0Decimals = 18,
    token1Symbol = "USDT",
    token1Decimals = 6,
    pairAddress = PAIR,
  } = fixture;

  mockGetBlock.mockResolvedValue(BLOCK);
  mockReadContract.mockImplementation(
    async ({ address, functionName }: { address: string; functionName: string }) => {
      if (address.toLowerCase() === ROUTER.toLowerCase()) {
        if (functionName === "factory") return FACTORY;
        if (functionName === "WETH") return WBNB;
      }
      if (address.toLowerCase() === FACTORY.toLowerCase()) {
        if (functionName === "getPair") return pairAddress;
      }
      if (address.toLowerCase() === pairAddress.toLowerCase()) {
        if (functionName === "getReserves") return [reserve0, reserve1, 0];
        if (functionName === "token0") return token0;
        if (functionName === "token1") return token1;
      }
      if (address.toLowerCase() === token0.toLowerCase() && functionName === "symbol") return token0Symbol;
      if (address.toLowerCase() === token0.toLowerCase() && functionName === "decimals") return token0Decimals;
      if (address.toLowerCase() === token1.toLowerCase() && functionName === "symbol") return token1Symbol;
      if (address.toLowerCase() === token1.toLowerCase() && functionName === "decimals") return token1Decimals;
      throw new Error(`unexpected call in this test: ${functionName} @ ${address}`);
    }
  );
}

describe("runPancakeGridTask", () => {
  beforeEach(() => {
    mockGetBlock.mockReset();
    mockReadContract.mockReset();
  });

  it("rejects an invalid tokenA address without making any network calls", async () => {
    const result = await runPancakeGridTask({ tokenA: "not-an-address" });
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/not a valid EVM address for tokenA/);
    expect(mockGetBlock).not.toHaveBeenCalled();
  });

  it("rejects an invalid tokenB address", async () => {
    const result = await runPancakeGridTask({ tokenB: "0xnotreal" });
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/tokenB/);
  });

  it("rejects an out-of-range gridLevels value", async () => {
    const result = await runPancakeGridTask({ gridLevels: 1 });
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/gridLevels/);
    expect(mockGetBlock).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range gridRangePercent value", async () => {
    const result = await runPancakeGridTask({ gridRangePercent: 500 });
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/gridRangePercent/);
  });

  it('returns "no pair" (repurposed NO_POSITION) when the Factory has no pair for this token combination, without fabricating reserves', async () => {
    mockChain({ pairAddress: ZERO_ADDRESS });
    const result = await runPancakeGridTask({});
    expect(result.status).toBe("NO_POSITION");
    expect(result.message).toMatch(/No PancakeSwap V2 pair exists/);
    expect(result.output).toBeNull();
  });

  it("returns NO_POSITION for a real pair with zero reserves, instead of dividing by zero or inventing a price", async () => {
    mockChain({ reserve0: BigInt(0), reserve1: BigInt(1000) });
    const result = await runPancakeGridTask({});
    expect(result.status).toBe("NO_POSITION");
    expect(result.message).toMatch(/zero reserves/);
    expect(result.output).toBeNull();
  });

  it("wraps an RPC failure as a real ERROR result instead of throwing", async () => {
    mockGetBlock.mockRejectedValue(new Error("simulated RPC failure"));
    const result = await runPancakeGridTask({});
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("simulated RPC failure");
  });

  it("discovers the factory and WBNB from the Router (not hardcoded) and computes a correct current price from reserves", async () => {

    mockChain({});
    const result = await runPancakeGridTask({});
    expect(result.status).toBe("SUCCESS");
    expect(result.output?.pair.pairAddress).toBe(PAIR);
    expect(result.output?.pair.token0Symbol).toBe("WBNB");
    expect(result.output?.pair.token1Symbol).toBe("USDT");
    expect(Number(result.output?.currentPrice)).toBeCloseTo(300, 6);
    expect(result.dataSources.some((d) => d.functionCalled === "factory()")).toBe(true);
    expect(result.dataSources.some((d) => d.functionCalled === "WETH()")).toBe(true);
  });

  it("does not call WETH() when tokenA is explicitly provided", async () => {
    mockChain({ token0: USDT, token0Symbol: "USDT", token0Decimals: 6, token1: WBNB, token1Symbol: "WBNB", token1Decimals: 18 });
    const result = await runPancakeGridTask({ tokenA: USDT, tokenB: WBNB });
    expect(result.status).toBe("SUCCESS");
    expect(result.dataSources.some((d) => d.functionCalled === "WETH()")).toBe(false);
  });

  it("computes correct lower/upper bounds and grid spacing for the default 10%/5-level configuration", async () => {
    mockChain({});
    const result = await runPancakeGridTask({});
    expect(result.status).toBe("SUCCESS");
    const price = Number(result.output?.currentPrice); // 300
    const expectedLower = price * 0.9;
    const expectedUpper = price * 1.1;
    expect(Number(result.output?.lowerBound)).toBeCloseTo(expectedLower, 6);
    expect(Number(result.output?.upperBound)).toBeCloseTo(expectedUpper, 6);
    const expectedSpacing = (expectedUpper - expectedLower) / (5 - 1);
    expect(Number(result.output?.spacing)).toBeCloseTo(expectedSpacing, 6);
  });

  it("generates the correct number of grid levels, evenly spaced and inclusive of both bounds", async () => {
    mockChain({});
    const result = await runPancakeGridTask({ gridLevels: 4, gridRangePercent: 20 });
    expect(result.status).toBe("SUCCESS");
    expect(result.output?.gridCount).toBe(4);
    expect(result.output?.gridLevels).toHaveLength(4);
    expect(Number(result.output?.gridLevels[0].price)).toBeCloseTo(Number(result.output?.lowerBound), 6);
    expect(Number(result.output?.gridLevels[3].price)).toBeCloseTo(Number(result.output?.upperBound), 6);
    const spacing = Number(result.output?.spacing);
    for (let i = 1; i < 4; i++) {
      const diff = Number(result.output?.gridLevels[i].price) - Number(result.output?.gridLevels[i - 1].price);
      expect(diff).toBeCloseTo(spacing, 6);
    }
  });

  it("never labels the output a prediction, profit guarantee, or trading result (structured data only, no UI strings)", async () => {
    mockChain({});
    const result = await runPancakeGridTask({});
    const serialized = JSON.stringify(result.output);
    expect(serialized).not.toMatch(/profit|guarantee|prediction/i);
  });
});
