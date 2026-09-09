# Task 3: RangeBot / Grid Trading

Part of the TermiX Agent Advantage Report for the BNB Chain Smart Money Era hackathon.

**Status: Execution-time benchmark complete, manual calculation period not recorded**

## Task Definition

Given a PancakeSwap V2 token pair on BSC Testnet, read the pair's real reserves and derive a mechanical grid trading setup around the current observed price.

The task produces:

* Current price
* Grid range
* Number of grid levels
* Grid spacing

The benchmark compares performing the analysis manually against performing it through AgentHub's RangeBot task computation in `lib/tasks/pancake-grid.ts`.

This is the **trading task** used to satisfy the TermiX bounty's required high-stakes task category.

**Pair under test:** USDT/WBNB

**Pair contract:**

`0x97B0307973f6f662FF32720c6D57c6619e936319`

## AgentHub Execution

**Duration:** 5.75 seconds

*Self-reported by the user and timed personally.*

**Procedure:**

`POST /api/tasks/rangebot/execute`

→ `lib/tasks/pancake-grid.ts::runPancakeGridTask`

**Result:** `SUCCESS`

**Output:**

* Current price: `0.000000000000150414` WBNB per USDT
* Grid range: `1.353726e-13` to `1.654554e-13`
* Grid levels: `5`
* Grid spacing: `7.520700000000002e-15`

The computation used real BSC Testnet / PancakeSwap V2 data read live through AgentHub's Task Computation panel.

The data was obtained from the Router, Factory, Pair, USDT, and WBNB contracts.

The result represents a **mechanical grid setup**, not a claim of profitability. No completed trades, historical backtest, or guaranteed return is represented by this benchmark.

## Manual Execution

**Duration:** 1:53, or **113 seconds**

*Self-reported by the user and timed personally.*

The manual run performed a direct `getReserves()` read against the same PancakeSwap V2 pair.

**Manual output:**

* `reserve0`: `670209589828534484`
* `reserve1`: `100809401478913047`
* `blockTimestampLast`: `1788169571`

The manual reserve values were obtained through a real onchain read.

**Calculation period: Not recorded / pending.**

The manual run did not separately measure the time required to transform the raw reserves into the derived price and grid configuration.

This report therefore does **not** estimate or assume a calculation period. Only the measured **113-second overall manual execution time** is used in the benchmark.

## Output Parity

**Not directly compared value-by-value in this record.**

The manual run captured the raw `getReserves()` values, while AgentHub produced the derived price and grid configuration.

A direct parity check would require applying the same token-decimal adjustments and price formula used by AgentHub to the manually captured reserves.

That calculation has not yet been performed, so this report does not claim that the derived outputs match.

## Benchmark

The benchmark compares **measured execution times only**.

|                |        Time |
| -------------- | ----------: |
| Manual         |        113s |
| AgentHub       |       5.75s |
| **Time saved** | **107.25s** |
| **Speedup**    |  **~19.7x** |

Calculation:

`113 - 5.75 = 107.25 seconds saved`

`113 / 5.75 ≈ 19.65x`

Rounded to **19.7x faster**.

The unrecorded manual calculation period is **not included in or implied by this result**. It was not measured and is therefore left pending.

## Quality Comparison

The TermiX quality rubric has not yet been scored.

The rubric evaluates:

* Accuracy, /10
* Completeness, /10
* Actionability, /10
* Relevance, /10

Scores are deferred rather than assigning placeholder values.

## Conclusion

AgentHub's RangeBot task computation successfully completed a mechanical grid analysis using live PancakeSwap V2 data in **5.75 seconds**, compared with **113 seconds** for the measured manual execution.

This represents a measured **~19.7x execution-time speedup**.

However, this is not yet a fully closed manual-vs-AgentHub comparison.

Two items remain open:

1. The manual calculation period was not separately recorded.
2. The manually captured reserves have not yet been transformed using the same formula to verify value-by-value parity with AgentHub's derived price and grid levels.

Therefore, the **19.7x figure should be presented specifically as a measured execution-time comparison**, not as a claim about total end-to-end task time or output parity.
