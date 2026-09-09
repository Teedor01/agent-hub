import {
  createPublicClient,
  http,
  formatUnits,
  isAddress,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { DataSourceRecord, TaskResult } from "./types";

export const VENUS_COMPTROLLER_ADDRESS: Address =
  "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D"; 


export const VBNB_ADDRESS: Address = "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c";

const KNOWN_MARKETS: Address[] = [VBNB_ADDRESS];

const CHAIN_LABEL = "BSC Testnet (chainId 97)";


const COMPTROLLER_ABI = [
  {
    type: "function",
    name: "getAccountLiquidity",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "error", type: "uint256" },
      { name: "liquidity", type: "uint256" },
      { name: "shortfall", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getAssetsIn",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "markets",
    stateMutability: "view",
    inputs: [{ name: "vTokenAddress", type: "address" }],
    outputs: [
      { name: "isListed", type: "bool" },
      { name: "collateralFactorMantissa", type: "uint256" },
      { name: "isVenus", type: "bool" },
    ],
  },
] as const;

const VTOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {

    type: "function",
    name: "balanceOfUnderlying",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "borrowBalanceStored",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "underlying",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const ERC20_ABI = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export interface VenusMarketPosition {
  vTokenAddress: string;
  underlyingSymbol: string;
  underlyingDecimals: number;
  collateralFactorPct: number; 
  collateralEnabled: boolean;
  hasSupplyPosition: boolean; 
  hasBorrowPosition: boolean; 
  suppliedUnderlyingRaw: string; 
  suppliedUnderlying: string; 
  borrowedUnderlyingRaw: string;
  borrowedUnderlying: string;
}

export interface VenusHealthOutput {
  wallet: string;
  errorCode: number;
  liquidityRaw: string;
  liquidity: string; 
  shortfallRaw: string;
  shortfall: string; 
  assetsIn: string[];
  
  markets: VenusMarketPosition[];
  derivedRiskRatio: {
    formula: string;
    value: number | null;
    note: string;
  };
}

function rpcUrl(): string | undefined {
  return process.env.BSC_TESTNET_RPC_URL;
}

function getPublicClient() {
  return createPublicClient({
    chain: bscTestnet,
    transport: http(rpcUrl()),
  });
}

/**
 * Runs the Venus health-monitoring task for a given wallet address.
 * Makes only free `eth_call` reads... no transactions, no Altana session.
 *
 * @param wallet Address to check. Caller-supplied (this task does not
 *   assume any particular "demo wallet"...see the hire-page UI for how
 *   the wallet value is sourced).
 * @param blockNumber Optional historical block to read at, for
 *   independent reproducibility. Omit for the latest block.
 */
export async function runVenusHealthTask(
  wallet: string,
  blockNumber?: bigint
): Promise<TaskResult<VenusHealthOutput>> {
  const taskId = "venus-health";
  const agentSlug = "agentcensus-health-factor-monitor";
  const startedAt = new Date();
  const input = { wallet, blockNumber: blockNumber?.toString() ?? "latest" };

  if (!isAddress(wallet)) {
    const finishedAt = new Date();
    return {
      taskId,
      agentSlug,
      status: "ERROR",
      input,
      output: null,
      message: `"${wallet}" is not a valid EVM address.`,
      dataSources: [],
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }

  const account = wallet as Address;
  const client = getPublicClient();
  const dataSources: DataSourceRecord[] = [];

  try {

    const block = await client.getBlock(
      blockNumber ? { blockNumber } : { blockTag: "latest" }
    );
    const resolvedBlockNumber = block.number;
    const blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();

    function recordSource(functionCalled: string, address: string | null, kind: DataSourceRecord["kind"] = "VERIFIED_ONCHAIN") {
      dataSources.push({
        kind,
        address,
        functionCalled,
        chain: CHAIN_LABEL,
        blockNumber: resolvedBlockNumber.toString(),
        timestamp: blockTimestamp,
      });
    }

    const [errorCode, liquidity, shortfall] = await client.readContract({
      address: VENUS_COMPTROLLER_ADDRESS,
      abi: COMPTROLLER_ABI,
      functionName: "getAccountLiquidity",
      args: [account],
      blockNumber: resolvedBlockNumber,
    });
    recordSource("getAccountLiquidity(address)", VENUS_COMPTROLLER_ADDRESS);

    if (errorCode !== BigInt(0)) {
      const finishedAt = new Date();
      return {
        taskId,
        agentSlug,
        status: "ERROR",
        input,
        output: null,
        message: `Venus Comptroller returned error code ${errorCode.toString()} from getAccountLiquidity -- treating as a real onchain error, not fabricating a result.`,
        dataSources,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };
    }

    const assetsIn = await client.readContract({
      address: VENUS_COMPTROLLER_ADDRESS,
      abi: COMPTROLLER_ABI,
      functionName: "getAssetsIn",
      args: [account],
      blockNumber: resolvedBlockNumber,
    });
    recordSource("getAssetsIn(address)", VENUS_COMPTROLLER_ADDRESS);


    const collateralEnabledSet = new Set(assetsIn.map((a) => a.toLowerCase()));


    const marketsToCheck = new Set<string>([
      ...assetsIn.map((a) => a.toLowerCase()),
      ...KNOWN_MARKETS.map((a) => a.toLowerCase()),
    ]);

    const markets: VenusMarketPosition[] = [];
    let anyPosition = false;

    for (const vTokenAddressLower of marketsToCheck) {
      const vTokenAddress = vTokenAddressLower as Address;

      const [isListed, collateralFactorMantissa] = await client.readContract({
        address: VENUS_COMPTROLLER_ADDRESS,
        abi: COMPTROLLER_ABI,
        functionName: "markets",
        args: [vTokenAddress],
        blockNumber: resolvedBlockNumber,
      });
      recordSource("markets(address)", VENUS_COMPTROLLER_ADDRESS);

      if (!isListed) continue; 

      const [vTokenBalance, suppliedUnderlyingRaw, borrowedUnderlyingRaw] = await Promise.all([
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "balanceOf", args: [account], blockNumber: resolvedBlockNumber }),
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "balanceOfUnderlying", args: [account], blockNumber: resolvedBlockNumber }),
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "borrowBalanceStored", args: [account], blockNumber: resolvedBlockNumber }),
      ]);
      recordSource("balanceOf(address)", vTokenAddress);
      recordSource("balanceOfUnderlying(address)", vTokenAddress);
      recordSource("borrowBalanceStored(address)", vTokenAddress);

      const hasSupplyPosition = vTokenBalance > BigInt(0) || suppliedUnderlyingRaw > BigInt(0);
      const hasBorrowPosition = borrowedUnderlyingRaw > BigInt(0);
      const collateralEnabled = collateralEnabledSet.has(vTokenAddressLower);

      if (hasSupplyPosition || hasBorrowPosition) anyPosition = true;


      if (!hasSupplyPosition && !hasBorrowPosition && !collateralEnabled) continue;

      let underlyingSymbol: string;
      let underlyingDecimals: number;
      try {
        const underlyingAddress = await client.readContract({
          address: vTokenAddress,
          abi: VTOKEN_ABI,
          functionName: "underlying",
          blockNumber: resolvedBlockNumber,
        });
        recordSource("underlying()", vTokenAddress);
        const [sym, dec] = await Promise.all([
          client.readContract({ address: underlyingAddress, abi: ERC20_ABI, functionName: "symbol", blockNumber: resolvedBlockNumber }),
          client.readContract({ address: underlyingAddress, abi: ERC20_ABI, functionName: "decimals", blockNumber: resolvedBlockNumber }),
        ]);
        recordSource("symbol()/decimals()", underlyingAddress);
        underlyingSymbol = sym;
        underlyingDecimals = dec;
      } catch {

        underlyingSymbol = "BNB";
        underlyingDecimals = 18;
      }

      markets.push({
        vTokenAddress,
        underlyingSymbol,
        underlyingDecimals,
        collateralFactorPct: Number(formatUnits(collateralFactorMantissa, 18)) * 100,
        collateralEnabled,
        hasSupplyPosition,
        hasBorrowPosition,
        suppliedUnderlyingRaw: suppliedUnderlyingRaw.toString(),
        suppliedUnderlying: formatUnits(suppliedUnderlyingRaw, underlyingDecimals),
        borrowedUnderlyingRaw: borrowedUnderlyingRaw.toString(),
        borrowedUnderlying: formatUnits(borrowedUnderlyingRaw, underlyingDecimals),
      });
    }

    if (!anyPosition) {
      const finishedAt = new Date();
      return {
        taskId,
        agentSlug,
        status: "NO_POSITION",
        input,
        output: null,
        message: "Wallet has no active Venus position. Supply and borrow data unavailable.",
        dataSources,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };
    }

    const output: VenusHealthOutput = {
      wallet: account,
      errorCode: Number(errorCode),
      liquidityRaw: liquidity.toString(),
      liquidity: formatUnits(liquidity, 18),
      shortfallRaw: shortfall.toString(),
      shortfall: formatUnits(shortfall, 18),
      assetsIn: assetsIn as string[],
      markets,
      derivedRiskRatio: {
        formula: "n/a in this version -- see note",
        value: null,
        note:
          "A single account-level collateral/borrow ratio would require each market's USD price from Venus's PriceOracle, which this minimal implementation does not read. Venus's own liquidity/shortfall above (from getAccountLiquidity) is the authoritative, protocol-reported risk signal for this account -- not a value derived here.",
      },
    };

    const finishedAt = new Date();
    return {
      taskId,
      agentSlug,
      status: "SUCCESS",
      input,
      output,
      message: null,
      dataSources,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } catch (err) {
    const finishedAt = new Date();
    return {
      taskId,
      agentSlug,
      status: "ERROR",
      input,
      output: null,
      message: err instanceof Error ? err.message : "Unknown error calling Venus Comptroller.",
      dataSources,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }
}
