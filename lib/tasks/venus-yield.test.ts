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

import { runVenusYieldTask } from "./venus-yield";

const BLOCK = { number: BigInt(100), timestamp: BigInt(1_700_000_000) };
const WALLET = "0x000000000000000000000000000000000000dead";
const VENUS_COMPTROLLER_ADDRESS = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";

const V_BUSD = "0x08e0A5575De71037aE36AbfAfb516595fE68e5e4"; 
const V_OTHER_STABLE = "0x1111111111111111111111111111111111111a"; 

function apiMarket(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    address: V_BUSD,
    underlyingSymbol: "BUSD",
    underlyingDecimal: 18,
    category: "stablecoins",
    poolComptrollerAddress: VENUS_COMPTROLLER_ADDRESS,
    isListed: true,
    supplyApy: "0",
    borrowApy: "2.014488262228489174",
    supplyRatePerBlock: "0",
    borrowRatePerBlock: "285388127",
    tokenPriceCents: "100.134667",
    ...overrides,
  };
}

function mockFetchOnce(markets: ReturnType<typeof apiMarket>[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ limit: 20, page: 0, total: markets.length, result: markets }),
  }) as unknown as typeof fetch;
}

function mockOnchainZero() {
  mockGetBlock.mockResolvedValue(BLOCK);
  mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
    if (functionName === "getAssetsIn") return [];
    if (functionName === "balanceOf") return BigInt(0);
    if (functionName === "balanceOfUnderlying") return BigInt(0);
    if (functionName === "borrowBalanceStored") return BigInt(0);
    throw new Error(`unexpected call in this test: ${functionName}`);
  });
}

describe("runVenusYieldTask", () => {
  beforeEach(() => {
    mockGetBlock.mockReset();
    mockReadContract.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects a malformed wallet address without calling the API or RPC", async () => {
    global.fetch = vi.fn();
    const result = await runVenusYieldTask("not-an-address");
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/not a valid EVM address/);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockGetBlock).not.toHaveBeenCalled();
  });

  it("handles a total Venus API failure as a real ERROR, not a fabricated result", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const result = await runVenusYieldTask(WALLET);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("503");
    expect(result.output).toBeNull();
  });

  it("propagates an RPC failure (after a successful API fetch) as ERROR instead of throwing", async () => {
    mockFetchOnce([apiMarket()]);
    mockGetBlock.mockRejectedValue(new Error("simulated RPC failure"));
    const result = await runVenusYieldTask(WALLET);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("simulated RPC failure");
  });

  it("reports no current position when the wallet holds none of the candidate markets", async () => {
    mockFetchOnce([apiMarket({ supplyApy: "5.53" })]);
    mockOnchainZero();
    const result = await runVenusYieldTask(WALLET);
    expect(result.status).toBe("SUCCESS");
    expect(result.output?.currentPosition).toBeNull();
    expect(result.output?.recommendation.bestOpportunity?.supplyApyPercent).toBe("5.53");
  });

  it("retrieves real market/rate data and keeps supplyApy, borrowApy, and the raw per-block rate technically distinct", async () => {
    mockFetchOnce([
      apiMarket({ supplyApy: "5.53", borrowApy: "9.18", supplyRatePerBlock: "770527432" }),
    ]);
    mockOnchainZero();
    const result = await runVenusYieldTask(WALLET);
    const m = result.output?.candidateMarkets[0];
    expect(m?.supplyApyPercent).toBe("5.53");
    expect(m?.borrowApyPercent).toBe("9.18");
    expect(m?.supplyRatePerBlockRaw).toBe("770527432");
    expect(m?.supplyApyPercent).not.toBe(m?.borrowApyPercent);
    expect(m?.supplyRatePerBlockRaw).not.toBe(m?.supplyApyPercent);
  });

  it('returns "unavailable" rather than inventing a value when Venus API rate fields are null', async () => {
    mockFetchOnce([apiMarket({ supplyApy: null, borrowApy: null, supplyRatePerBlock: null })]);
    mockOnchainZero();
    const result = await runVenusYieldTask(WALLET);
    const m = result.output?.candidateMarkets[0];
    expect(m?.supplyApyPercent).toBe("unavailable");
    expect(m?.borrowApyPercent).toBe("unavailable");
    expect(m?.supplyRatePerBlockRaw).toBe("unavailable");
    expect(result.output?.recommendation.bestOpportunity).toBeNull();
    expect(result.output?.recommendation.apyDifferencePercent).toBe("unavailable");
  });

  it("excludes non-stablecoin and non-Core-pool markets from the comparison set", async () => {
    mockFetchOnce([
      apiMarket(),
      apiMarket({
        address: "0x2222222222222222222222222222222222222b",
        underlyingSymbol: "ADA",
        category: "others", 
      }),
      apiMarket({
        address: "0x3333333333333333333333333333333333333c",
        underlyingSymbol: "agEUR",
        category: "stablecoins",
        poolComptrollerAddress: "0x10b57706AD2345e590c2eA4DC02faef0d9f5b08B", 
      }),
    ]);
    mockOnchainZero();
    const result = await runVenusYieldTask(WALLET);
    expect(result.output?.candidateMarkets).toHaveLength(1);
    expect(result.output?.candidateMarkets[0].underlyingSymbol).toBe("BUSD");
  });

  it("computes the current position, best opportunity, and APY difference correctly", async () => {
    mockFetchOnce([
      apiMarket({ address: V_BUSD, underlyingSymbol: "BUSD", supplyApy: "2.0" }),
      apiMarket({ address: V_OTHER_STABLE, underlyingSymbol: "HAY", supplyApy: "7.5" }),
    ]);
    mockGetBlock.mockResolvedValue(BLOCK);
    mockReadContract.mockImplementation(
      async ({ address, functionName }: { address: string; functionName: string }) => {
        if (functionName === "getAssetsIn") return [V_BUSD];
        if (address.toLowerCase() === V_BUSD.toLowerCase()) {
          if (functionName === "balanceOf") return BigInt(1_000_000_000);
          if (functionName === "balanceOfUnderlying") return BigInt("100000000000000000000"); // 100 BUSD
          if (functionName === "borrowBalanceStored") return BigInt(0);
        }
        if (address.toLowerCase() === V_OTHER_STABLE.toLowerCase()) {
          if (functionName === "balanceOf") return BigInt(0);
          if (functionName === "balanceOfUnderlying") return BigInt(0);
          if (functionName === "borrowBalanceStored") return BigInt(0);
        }
        throw new Error(`unexpected call in this test: ${functionName} @ ${address}`);
      }
    );

    const result = await runVenusYieldTask(WALLET);
    expect(result.status).toBe("SUCCESS");
    expect(result.output?.currentPosition?.underlyingSymbol).toBe("BUSD");
    expect(result.output?.currentPosition?.collateralEnabled).toBe(true);
    expect(result.output?.currentPosition?.currentSupplyApyPercent).toBe("2");
    expect(result.output?.recommendation.bestOpportunity?.underlyingSymbol).toBe("HAY");
    expect(result.output?.recommendation.apyDifferencePercent).toBe("5.5");
  });

  it("labels the recommendation note in terms that never call the per-block rate an APY", async () => {
    mockFetchOnce([apiMarket({ supplyApy: "5.53" })]);
    mockOnchainZero();
    const result = await runVenusYieldTask(WALLET);
    expect(result.output?.recommendation.note).toMatch(/not an APY/i);
  });
});
