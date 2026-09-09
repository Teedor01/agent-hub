import {
  createPublicClient,
  http,
  formatUnits,
  isAddress,
  type Address,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { DataSourceRecord, TaskResult } from "./types";

const PANCAKE_ROUTER_ADDRESS: Address = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; 
const DEFAULT_TOKEN_B: Address = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";

const CHAIN_LABEL = "BSC Testnet (chainId 97)";
const DEFAULT_GRID_RANGE_PERCENT = 10; 
const DEFAULT_GRID_LEVELS = 5;
const MAX_GRID_LEVELS = 20;
const MAX_GRID_RANGE_PERCENT = 50;



const ROUTER_ABI = [
  { type: "function", name: "factory", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "WETH", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;

const FACTORY_ABI = [
  {
    type: "function",
    name: "getPair",
    stateMutability: "view",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const PAIR_ABI = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;

const ERC20_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

export interface GridLevel {
  index: number;
  price: string;
}

export interface PancakeGridOutput {
  pair: {
    pairAddress: string;
    token0: string;
    token0Symbol: string;
    token0Decimals: number;
    token1: string;
    token1Symbol: string;
    token1Decimals: number;
  };
  reserves: {
    reserve0Raw: string;
    reserve1Raw: string;
  };

  currentPrice: string;
  lowerBound: string;
  upperBound: string;
  gridCount: number;
  spacing: string;
  gridLevels: GridLevel[];
  assumptions: {
    gridRangePercent: number;
    formulaCurrentPrice: string;
    formulaGridRange: string;
    formulaGridLevels: string;
  };
}

export interface PancakeGridInput {

  wallet?: string;
  tokenA?: string;
  tokenB?: string;
  gridRangePercent?: number;
  gridLevels?: number;
}

function rpcUrl(): string | undefined {
  return process.env.BSC_TESTNET_RPC_URL;
}

function getPublicClient() {
  return createPublicClient({ chain: bscTestnet, transport: http(rpcUrl()) });
}


function priceFromReserves(reserveA: bigint, decimalsA: number, reserveB: bigint, decimalsB: number): string | null {
  if (reserveA === BigInt(0)) return null;
  const PRECISION = 18;
  const numerator = reserveB * BigInt(10) ** BigInt(PRECISION) * BigInt(10) ** BigInt(decimalsA);
  const denominator = reserveA * BigInt(10) ** BigInt(decimalsB);
  const scaled = numerator / denominator; // integer division -- exact to PRECISION digits, no floats
  return formatUnits(scaled, PRECISION);
}

export async function runPancakeGridTask(input: PancakeGridInput): Promise<TaskResult<PancakeGridOutput>> {
  const taskId = "pancake-grid";
  const agentSlug = "rangebot";
  const startedAt = new Date();
  const recordedInput: Record<string, unknown> = { ...input };

  const gridRangePercent = input.gridRangePercent ?? DEFAULT_GRID_RANGE_PERCENT;
  const gridLevelsCount = input.gridLevels ?? DEFAULT_GRID_LEVELS;

  function errorResult(message: string, dataSources: DataSourceRecord[] = []): TaskResult<PancakeGridOutput> {
    const finishedAt = new Date();
    return {
      taskId,
      agentSlug,
      status: "ERROR",
      input: recordedInput,
      output: null,
      message,
      dataSources,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }

  if (input.tokenA !== undefined && !isAddress(input.tokenA)) {
    return errorResult(`"${input.tokenA}" is not a valid EVM address for tokenA.`);
  }
  if (input.tokenB !== undefined && !isAddress(input.tokenB)) {
    return errorResult(`"${input.tokenB}" is not a valid EVM address for tokenB.`);
  }
  if (!Number.isInteger(gridLevelsCount) || gridLevelsCount < 2 || gridLevelsCount > MAX_GRID_LEVELS) {
    return errorResult(`gridLevels must be an integer between 2 and ${MAX_GRID_LEVELS} (got ${gridLevelsCount}).`);
  }
  if (!(gridRangePercent > 0) || gridRangePercent > MAX_GRID_RANGE_PERCENT) {
    return errorResult(`gridRangePercent must be between 0 and ${MAX_GRID_RANGE_PERCENT} (got ${gridRangePercent}).`);
  }

  const tokenB = (input.tokenB ?? DEFAULT_TOKEN_B) as Address;
  const dataSources: DataSourceRecord[] = [];

  try {
    const client = getPublicClient();
    const block = await client.getBlock({ blockTag: "latest" });
    const blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();

    function recordSource(functionCalled: string, address: string) {
      dataSources.push({
        kind: "VERIFIED_ONCHAIN",
        address,
        functionCalled,
        chain: CHAIN_LABEL,
        blockNumber: block.number.toString(),
        timestamp: blockTimestamp,
      });
    }

    const factoryAddress = await client.readContract({
      address: PANCAKE_ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "factory",
      blockNumber: block.number,
    });
    recordSource("factory()", PANCAKE_ROUTER_ADDRESS);

    let tokenA: Address;
    if (input.tokenA) {
      tokenA = input.tokenA as Address;
    } else {
      tokenA = await client.readContract({
        address: PANCAKE_ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: "WETH",
        blockNumber: block.number,
      });
      recordSource("WETH()", PANCAKE_ROUTER_ADDRESS);
    }

    const pairAddress = await client.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "getPair",
      args: [tokenA, tokenB],
      blockNumber: block.number,
    });
    recordSource("getPair(address,address)", factoryAddress);

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
      const finishedAt = new Date();
      return {
        taskId,
        agentSlug,
        status: "NO_POSITION", 
        input: recordedInput,
        output: null,
        message: "No PancakeSwap V2 pair exists for this token combination on BSC testnet.",
        dataSources,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };
    }

    const [reserve0, reserve1] = await client.readContract({
      address: pairAddress,
      abi: PAIR_ABI,
      functionName: "getReserves",
      blockNumber: block.number,
    });
    recordSource("getReserves()", pairAddress);

    const [token0, token1] = await Promise.all([
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "token0", blockNumber: block.number }),
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "token1", blockNumber: block.number }),
    ]);
    recordSource("token0()", pairAddress);
    recordSource("token1()", pairAddress);

    const [[token0Symbol, token0Decimals], [token1Symbol, token1Decimals]] = await Promise.all([
      Promise.all([
        client.readContract({ address: token0, abi: ERC20_ABI, functionName: "symbol", blockNumber: block.number }),
        client.readContract({ address: token0, abi: ERC20_ABI, functionName: "decimals", blockNumber: block.number }),
      ]),
      Promise.all([
        client.readContract({ address: token1, abi: ERC20_ABI, functionName: "symbol", blockNumber: block.number }),
        client.readContract({ address: token1, abi: ERC20_ABI, functionName: "decimals", blockNumber: block.number }),
      ]),
    ]);
    recordSource("symbol()/decimals()", token0);
    recordSource("symbol()/decimals()", token1);

    if (reserve0 === BigInt(0) || reserve1 === BigInt(0)) {
      const finishedAt = new Date();
      return {
        taskId,
        agentSlug,
        status: "NO_POSITION", 
        input: recordedInput,
        output: null,
        message: "Pair exists but has zero reserves on at least one side; a current price cannot be computed.",
        dataSources,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };
    }

    const currentPriceStr = priceFromReserves(reserve0, token0Decimals, reserve1, token1Decimals);
    if (currentPriceStr === null) {
      const finishedAt = new Date();
      return {
        taskId,
        agentSlug,
        status: "NO_POSITION",
        input: recordedInput,
        output: null,
        message: "Current price could not be computed from reserves.",
        dataSources,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      };
    }


    const currentPrice = Number(currentPriceStr);
    const lowerBound = currentPrice * (1 - gridRangePercent / 100);
    const upperBound = currentPrice * (1 + gridRangePercent / 100);
    const spacing = (upperBound - lowerBound) / (gridLevelsCount - 1);
    const gridLevels: GridLevel[] = Array.from({ length: gridLevelsCount }, (_, i) => ({
      index: i,
      price: (lowerBound + i * spacing).toString(),
    }));

    const output: PancakeGridOutput = {
      pair: {
        pairAddress,
        token0,
        token0Symbol,
        token0Decimals,
        token1,
        token1Symbol,
        token1Decimals,
      },
      reserves: {
        reserve0Raw: reserve0.toString(),
        reserve1Raw: reserve1.toString(),
      },
      currentPrice: currentPriceStr,
      lowerBound: lowerBound.toString(),
      upperBound: upperBound.toString(),
      gridCount: gridLevelsCount,
      spacing: spacing.toString(),
      gridLevels,
      assumptions: {
        gridRangePercent,
        formulaCurrentPrice: `reserve1 / reserve0, adjusted for token decimals (token0=${token0Symbol}, token1=${token1Symbol})`,
        formulaGridRange: `lowerBound = currentPrice * (1 - ${gridRangePercent}/100); upperBound = currentPrice * (1 + ${gridRangePercent}/100)`,
        formulaGridLevels: `${gridLevelsCount} levels evenly spaced between lowerBound and upperBound, inclusive`,
      },
    };

    const finishedAt = new Date();
    return {
      taskId,
      agentSlug,
      status: "SUCCESS",
      input: recordedInput,
      output,
      message: null,
      dataSources,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } catch (err) {
    return errorResult(
      err instanceof Error ? err.message : "Unknown error running the grid setup analysis task.",
      dataSources
    );
  }
}
