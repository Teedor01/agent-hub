
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

import { runVenusHealthTask, VBNB_ADDRESS, VENUS_COMPTROLLER_ADDRESS } from "./venus-health";

const BLOCK = { number: BigInt(100), timestamp: BigInt(1_700_000_000) };
const WALLET = "0x000000000000000000000000000000000000dead";

interface VbnbFixture {
  errorCode?: bigint;
  liquidity?: bigint;
  shortfall?: bigint;
  assetsIn?: string[];
  collateralFactorMantissa?: bigint;
  balanceOf?: bigint;
  balanceOfUnderlying?: bigint;
  borrowBalanceStored?: bigint;
  native?: boolean;
}


function mockVbnbOnly(fixture: VbnbFixture) {
  const {
    errorCode = BigInt(0),
    liquidity = BigInt(0),
    shortfall = BigInt(0),
    assetsIn = [],
    collateralFactorMantissa = BigInt("800000000000000000"),
    balanceOf = BigInt(0),
    balanceOfUnderlying = BigInt(0),
    borrowBalanceStored = BigInt(0),
    native = true,
  } = fixture;

  return async ({ address, functionName }: { address: string; functionName: string }) => {
    if (address.toLowerCase() === VENUS_COMPTROLLER_ADDRESS.toLowerCase()) {
      if (functionName === "getAccountLiquidity") return [errorCode, liquidity, shortfall];
      if (functionName === "getAssetsIn") return assetsIn;
      if (functionName === "markets") return [true, collateralFactorMantissa, false];
    }
    if (address.toLowerCase() === VBNB_ADDRESS.toLowerCase()) {
      if (functionName === "balanceOf") return balanceOf;
      if (functionName === "balanceOfUnderlying") return balanceOfUnderlying;
      if (functionName === "borrowBalanceStored") return borrowBalanceStored;
      if (functionName === "underlying") {
        if (native) throw new Error("reverted: no underlying()");
        return "0x9999999999999999999999999999999999999d";
      }
    }
    throw new Error(`unexpected call in this test: ${functionName} @ ${address}`);
  };
}

describe("runVenusHealthTask", () => {
  beforeEach(() => {
    mockGetBlock.mockReset();
    mockReadContract.mockReset();
    mockGetBlock.mockResolvedValue(BLOCK);
  });

  it("rejects an invalid address without making any network calls", async () => {
    const result = await runVenusHealthTask("not-an-address");
    expect(result.status).toBe("ERROR");
    expect(result.message).toMatch(/not a valid EVM address/);
    expect(mockGetBlock).not.toHaveBeenCalled();
    expect(mockReadContract).not.toHaveBeenCalled();
  });

  it("returns NO_POSITION only when vBNB and every entered-collateral market are genuinely empty", async () => {
    mockReadContract.mockImplementation(mockVbnbOnly({ assetsIn: [] }));
    const result = await runVenusHealthTask(WALLET);
    expect(result.status).toBe("NO_POSITION");
    expect(result.message).toBe("Wallet has no active Venus position. Supply and borrow data unavailable.");
    expect(result.output).toBeNull();
  });

  it("returns ERROR (not a fabricated result) when the Comptroller reports a non-zero error code", async () => {
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === "getAccountLiquidity") return [BigInt(13), BigInt(0), BigInt(0)];
      throw new Error(`unexpected call in this test: ${functionName}`);
    });
    const result = await runVenusHealthTask(WALLET);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("13");
    expect(result.output).toBeNull();
  });

  it("wraps an RPC/network failure as a real ERROR result instead of throwing", async () => {
    mockGetBlock.mockRejectedValue(new Error("simulated network failure"));
    const result = await runVenusHealthTask(WALLET);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("simulated network failure");
  });


  it("detects a real vBNB supply position even when getAssetsIn() returns an empty array", async () => {
    mockReadContract.mockImplementation(
      mockVbnbOnly({
        assetsIn: [], 
        balanceOf: BigInt(963_800),
        balanceOfUnderlying: BigInt("9638000000000000"), 
        borrowBalanceStored: BigInt(0),
      })
    );

    const result = await runVenusHealthTask(WALLET);

    expect(result.status).toBe("SUCCESS");
    expect(result.output?.assetsIn).toEqual([]);
    expect(result.output?.markets).toHaveLength(1);

    const vbnbPosition = result.output?.markets[0];
    expect(vbnbPosition?.vTokenAddress.toLowerCase()).toBe(VBNB_ADDRESS.toLowerCase());
    expect(vbnbPosition?.underlyingSymbol).toBe("BNB");
    expect(vbnbPosition?.hasSupplyPosition).toBe(true);
    expect(vbnbPosition?.hasBorrowPosition).toBe(false);
    expect(vbnbPosition?.collateralEnabled).toBe(false);
    expect(vbnbPosition?.suppliedUnderlyingRaw).toBe("9638000000000000");

    expect(JSON.stringify(result.output)).not.toMatch(/health[\s_-]?factor/i);
  });

  it("reports collateralEnabled: true when entered via getAssetsIn, and correctly flags a borrow position", async () => {
    mockReadContract.mockImplementation(
      mockVbnbOnly({
        shortfall: BigInt("100000000000000000"),
        assetsIn: [VBNB_ADDRESS],
        balanceOf: BigInt(963_800),
        balanceOfUnderlying: BigInt("9638000000000000"),
        borrowBalanceStored: BigInt("1000000000000000000"),
      })
    );

    const result = await runVenusHealthTask(WALLET);
    expect(result.status).toBe("SUCCESS");
    expect(result.output?.markets[0].collateralEnabled).toBe(true);
    expect(result.output?.markets[0].hasBorrowPosition).toBe(true);
    expect(result.output?.shortfallRaw).toBe("100000000000000000");
    expect(result.output?.derivedRiskRatio.value).toBeNull(); 
  });

  it("returns NO_POSITION when a market is entered as collateral but has zero balance and zero borrow everywhere", async () => {
    mockReadContract.mockImplementation(
      mockVbnbOnly({
        assetsIn: [VBNB_ADDRESS],
        balanceOf: BigInt(0),
        balanceOfUnderlying: BigInt(0),
        borrowBalanceStored: BigInt(0),
      })
    );

    const result = await runVenusHealthTask(WALLET);
    expect(result.status).toBe("NO_POSITION");
  });
});
