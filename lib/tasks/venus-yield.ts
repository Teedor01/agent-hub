import {
  createPublicClient,
  http,
  formatUnits,
  isAddress,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { DataSourceRecord, TaskResult } from "./types";


const VENUS_COMPTROLLER_ADDRESS: Address = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";

const CHAIN_LABEL = "BSC Testnet (chainId 97)";
const VENUS_API_BASE = "https://testnetapi.venus.io/markets";
const VENUS_API_PAGE_LIMIT = 20; 
const VENUS_API_MAX_PAGES = 6; 



const COMPTROLLER_ABI = [
  {
    type: "function",
    name: "getAssetsIn",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
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
] as const;



interface VenusApiMarket {
  address: string;
  underlyingSymbol: string | null;
  underlyingDecimal: number | null;
  category: string | null;
  poolComptrollerAddress: string | null;
  isListed: boolean;
  supplyApy: string | null;
  borrowApy: string | null;
  supplyRatePerBlock: string | null;
  borrowRatePerBlock: string | null;
  tokenPriceCents: string | null;
}

interface VenusApiResponse {
  limit: number;
  page: number;
  total: number;
  result: VenusApiMarket[];
}

const UNAVAILABLE = "unavailable" as const;

export interface YieldMarketOption {
  vTokenAddress: string;
  underlyingSymbol: string;
  underlyingDecimal: number;
  supplyApyPercent: string;
  borrowApyPercent: string;
  supplyRatePerBlockRaw: string;
  tokenPriceUsdCents: string;
}

export interface YieldCurrentPosition {
  vTokenAddress: string;
  underlyingSymbol: string;
  collateralEnabled: boolean;
  suppliedUnderlyingRaw: string;
  suppliedUnderlying: string;
  borrowedUnderlyingRaw: string;
  borrowedUnderlying: string;
  currentSupplyApyPercent: string;
  estimatedUsdValueCents: string;
}

export interface YieldRecommendation {
  bestOpportunity: YieldMarketOption | null;
  apyDifferencePercent: string;
  note: string;
}

export interface VenusYieldOutput {
  wallet: string;
  candidateMarkets: YieldMarketOption[];
  assetsIn: string[];
  currentPosition: YieldCurrentPosition | null;
  recommendation: YieldRecommendation;
}

function rpcUrl(): string | undefined {
  return process.env.BSC_TESTNET_RPC_URL;
}

function getPublicClient() {
  return createPublicClient({ chain: bscTestnet, transport: http(rpcUrl()) });
}


function parseApiNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchVenusMarkets(dataSources: DataSourceRecord[]): Promise<VenusApiMarket[]> {
  const all: VenusApiMarket[] = [];
  let page = 0;
  let total = Infinity;

  while (all.length < total && page < VENUS_API_MAX_PAGES) {
    const url = `${VENUS_API_BASE}?chainId=97&page=${page}&limit=${VENUS_API_PAGE_LIMIT}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Venus API returned HTTP ${res.status} for ${url}`);
    }
    const data = (await res.json()) as VenusApiResponse;
    dataSources.push({
      kind: "VERIFIED_EXTERNAL",
      address: null,
      functionCalled: `GET /markets?chainId=97&page=${page}`,
      chain: "Venus public API (BSC Testnet, chainId 97)",
      blockNumber: null,
      timestamp: new Date().toISOString(),
    });
    total = data.total;
    all.push(...data.result);
    if (data.result.length === 0) break;
    page += 1;
  }

 
  const seen = new Set<string>();
  return all.filter((m) => {
    const key = m.address.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toMarketOption(m: VenusApiMarket): YieldMarketOption {
  const supplyApy = parseApiNumber(m.supplyApy);
  const borrowApy = parseApiNumber(m.borrowApy);
  return {
    vTokenAddress: m.address,
    underlyingSymbol: m.underlyingSymbol ?? "UNKNOWN",
    underlyingDecimal: m.underlyingDecimal ?? 18,
    supplyApyPercent: supplyApy !== null ? supplyApy.toString() : UNAVAILABLE,
    borrowApyPercent: borrowApy !== null ? borrowApy.toString() : UNAVAILABLE,
    supplyRatePerBlockRaw: m.supplyRatePerBlock ?? UNAVAILABLE,
    tokenPriceUsdCents: m.tokenPriceCents ?? UNAVAILABLE,
  };
}


export async function runVenusYieldTask(wallet: string): Promise<TaskResult<VenusYieldOutput>> {
  const taskId = "venus-yield";
  const agentSlug = "stableyield";
  const startedAt = new Date();
  const input = { wallet };

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
  const dataSources: DataSourceRecord[] = [];

  try {
    const allMarkets = await fetchVenusMarkets(dataSources);

    const candidateApiMarkets = allMarkets.filter(
      (m) =>
        m.isListed &&
        m.category === "stablecoins" &&
        m.poolComptrollerAddress?.toLowerCase() === VENUS_COMPTROLLER_ADDRESS.toLowerCase()
    );
    const candidateMarkets = candidateApiMarkets.map(toMarketOption);

    const client = getPublicClient();
    const block = await client.getBlock({ blockTag: "latest" });
    const blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();

    function recordOnchain(functionCalled: string, address: string) {
      dataSources.push({
        kind: "VERIFIED_ONCHAIN",
        address,
        functionCalled,
        chain: CHAIN_LABEL,
        blockNumber: block.number.toString(),
        timestamp: blockTimestamp,
      });
    }

    const assetsIn = await client.readContract({
      address: VENUS_COMPTROLLER_ADDRESS,
      abi: COMPTROLLER_ABI,
      functionName: "getAssetsIn",
      args: [account],
      blockNumber: block.number,
    });
    recordOnchain("getAssetsIn(address)", VENUS_COMPTROLLER_ADDRESS);
    const collateralEnabledSet = new Set(assetsIn.map((a) => a.toLowerCase()));

    let currentPosition: YieldCurrentPosition | null = null;
    let bestUsdCents = -Infinity;

    for (const market of candidateMarkets) {
      const vTokenAddress = market.vTokenAddress as Address;
      const [vTokenBalance, suppliedUnderlyingRaw, borrowedUnderlyingRaw] = await Promise.all([
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "balanceOf", args: [account], blockNumber: block.number }),
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "balanceOfUnderlying", args: [account], blockNumber: block.number }),
        client.readContract({ address: vTokenAddress, abi: VTOKEN_ABI, functionName: "borrowBalanceStored", args: [account], blockNumber: block.number }),
      ]);
      recordOnchain("balanceOf(address)", vTokenAddress);
      recordOnchain("balanceOfUnderlying(address)", vTokenAddress);
      recordOnchain("borrowBalanceStored(address)", vTokenAddress);

      const hasSupplyPosition = vTokenBalance > BigInt(0) || suppliedUnderlyingRaw > BigInt(0);
      const hasBorrowPosition = borrowedUnderlyingRaw > BigInt(0);
      if (!hasSupplyPosition && !hasBorrowPosition) continue;

      const suppliedUnderlying = formatUnits(suppliedUnderlyingRaw, market.underlyingDecimal);
      const priceCents = parseApiNumber(market.tokenPriceUsdCents);
      const suppliedFloat = parseApiNumber(suppliedUnderlying);
      const estimatedUsdValueCents =
        priceCents !== null && suppliedFloat !== null ? (suppliedFloat * priceCents).toString() : UNAVAILABLE;

      const candidate: YieldCurrentPosition = {
        vTokenAddress: market.vTokenAddress,
        underlyingSymbol: market.underlyingSymbol,
        collateralEnabled: collateralEnabledSet.has(vTokenAddress.toLowerCase()),
        suppliedUnderlyingRaw: suppliedUnderlyingRaw.toString(),
        suppliedUnderlying,
        borrowedUnderlyingRaw: borrowedUnderlyingRaw.toString(),
        borrowedUnderlying: formatUnits(borrowedUnderlyingRaw, market.underlyingDecimal),
        currentSupplyApyPercent: market.supplyApyPercent,
        estimatedUsdValueCents,
      };


      const usdCents = estimatedUsdValueCents !== UNAVAILABLE ? Number(estimatedUsdValueCents) : -Infinity;
      if (currentPosition === null || usdCents > bestUsdCents) {
        currentPosition = candidate;
        bestUsdCents = usdCents;
      }
    }


    const rankable = candidateMarkets
      .filter((m) => m.supplyApyPercent !== UNAVAILABLE)
      .sort((a, b) => Number(b.supplyApyPercent) - Number(a.supplyApyPercent));
    const bestOpportunity = rankable[0] ?? null;

    let apyDifferencePercent: string = UNAVAILABLE;
    if (bestOpportunity && currentPosition && currentPosition.currentSupplyApyPercent !== UNAVAILABLE) {
      apyDifferencePercent = (
        Number(bestOpportunity.supplyApyPercent) - Number(currentPosition.currentSupplyApyPercent)
      ).toString();
    }

    const scopeNote =
      "Compares only Venus Core-pool markets tagged \"stablecoins\" by Venus's own API -- the same Comptroller StableYield is scoped to. Venus's isolated pools are not read. supplyApyPercent is Venus's base supply APY (interest only, excludes XVS token rewards). supplyRatePerBlockRaw is a raw per-block rate mantissa, not an APY -- do not treat it as one.";

    const output: VenusYieldOutput = {
      wallet: account,
      candidateMarkets,
      assetsIn: assetsIn as string[],
      currentPosition,
      recommendation: {
        bestOpportunity,
        apyDifferencePercent,
        note:
          candidateMarkets.length === 0
            ? `No Core-pool stablecoin markets found in Venus's API response. ${scopeNote}`
            : scopeNote,
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
      message: err instanceof Error ? err.message : "Unknown error running the yield optimization task.",
      dataSources,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }
}
