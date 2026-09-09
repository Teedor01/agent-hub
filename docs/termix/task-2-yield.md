# Task 2: StableYield / Yield Optimization

Part of the TermiX Agent Advantage Report for the BNB Chain Smart Money Era hackathon.

**Status: AgentHub-tested, manual comparison pending**

## Task Definition

Given a wallet address, compare Venus Protocol stablecoin supply opportunities on BSC Testnet.

The task should:

* Identify the wallet's current position, if any, in the compared Core-pool stablecoin markets.
* Compare available stablecoin supply APYs.
* Identify the best available supply opportunity.

The benchmark compares performing this analysis manually against performing it through AgentHub's StableYield task computation in `lib/tasks/venus-yield.ts`.

**Wallet under test:**

`0x9d5e4d9BE05EBAB93AF94D8B42e53B6C2594c7fA`

## AgentHub Execution

**Duration:** 15 seconds

*Self-reported by the user and timed personally.*

**Procedure:**

`POST /api/tasks/stableyield/execute`

→ `lib/tasks/venus-yield.ts::runVenusYieldTask`

**Result:** `SUCCESS`

**Output:**

* Current position: No current position in a compared stablecoin market
* Best available market: **USDe**
* Supply APY: **1.9251324808226524%**
* Borrow APY: **4.457012383661684%**

The result combines real Venus API market data with real BSC Testnet onchain wallet data and was read live through AgentHub's Task Computation panel.

No transaction, spend, or Altana session was involved in the computation.

## Manual Execution

**Not completed.**

The available Venus frontend/API workflow was not usable as a reliable manual benchmark during testing.

As a result, no manual execution time or output has been recorded.

No manual values have been estimated or invented.

The manual benchmark remains **pending**.

## Output Parity

**Not assessable yet.**

There is currently no reliable manual result against which the AgentHub output can be compared.

## Benchmark

|                |    Time |
| -------------- | ------: |
| Manual         | Pending |
| AgentHub       |     15s |
| **Time saved** | Pending |
| **Speedup**    | Pending |

## Quality Comparison

The TermiX quality rubric has not yet been scored.

The rubric evaluates:

* Accuracy, /10
* Completeness, /10
* Actionability, /10
* Relevance, /10

Scores are intentionally deferred rather than assigning placeholder values.

## Conclusion

AgentHub successfully completed the StableYield task using real Venus API market data and real BSC Testnet wallet data.

The computation identified **USDe** as the best available market in the compared set, with a reported supply APY of **1.9251324808226524%**.

However, this task cannot yet be counted as a completed Agent Advantage comparison because a reliable manual baseline has not been established.

**Task 1 remains the only fully completed manual-vs-AgentHub comparison in this report.**

Task 2 is therefore recorded as **AgentHub-tested, manual comparison pending**, with no fabricated benchmark values.
