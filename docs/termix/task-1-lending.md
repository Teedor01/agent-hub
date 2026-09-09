# Task 1: AgentCensus / Health Factor Monitoring

Part of the TermiX Agent Advantage Report for the BNB Chain Smart Money Era hackathon.

**Status: Complete**

## Task Definition

Given a wallet address, determine its Venus Protocol lending position on BSC Testnet, including:

* Supplied vBNB balance
* Borrowed balance
* Venus native account liquidity
* Venus native account shortfall

The benchmark compares performing these reads manually through direct contract calls against performing the same task through AgentHub's AgentCensus task computation in `lib/tasks/venus-health.ts`.

**Wallet under test:**

`0x9d5e4d9BE05EBAB93AF94D8B42e53B6C2594c7fA`

## Manual Execution

**Duration:** 3:23.60, or **203.60 seconds**

*Self-reported by the user and timed personally.*

**Procedure:** Direct contract reads against the Venus vBNB market and Comptroller contracts on BSC Testnet.

**Observed output:**

* `balanceOf(address)`: `963800`
* `borrowBalanceStored(address)`: `0`
* `getAccountLiquidity(address)`: `(0, 0, 0)`

  * Error: `0`
  * Liquidity: `0`
  * Shortfall: `0`
* `getCollateralFactor(address)`: `0`

The collateral factor result was **excluded from the benchmark**. The manual run used the wrong method for retrieving a market's collateral factor, so the returned `0` is not treated as a valid data point.

## AgentHub Execution

**Duration:** 10.62 seconds

*Self-reported by the user and timed personally.*

**Procedure:**

`POST /api/tasks/agentcensus-health-factor-monitor/execute`

→ `lib/tasks/venus-health.ts::runVenusHealthTask`

The task reads the same wallet against the same Venus vBNB market and Comptroller.

**Observed output:**

* vBNB `balanceOf`: `963800`
* Borrowed: `0`
* Venus account liquidity: `0`
* Venus account shortfall: `0`
* Collateral factor: `70%`

The AgentHub result was read live from BSC Testnet.

The `70%` collateral factor comes from AgentHub's `Comptroller.markets(vBNB)` read. It was **not independently verified during the manual benchmark**, so it is not included in the output-parity comparison.

## Output Parity

| Value                  |               Manual | AgentHub | Match          |
| ---------------------- | -------------------: | -------: | -------------- |
| Supplied, vBNB balance |               963800 |   963800 | Yes            |
| Borrowed               |                    0 |        0 | Yes            |
| Account liquidity      |                    0 |        0 | Yes            |
| Account shortfall      |                    0 |        0 | Yes            |
| Collateral factor      | Not validly obtained |      70% | Not comparable |

The four core values that were validly obtained during both runs matched exactly.

## Benchmark

|                |        Time |
| -------------- | ----------: |
| Manual         |     203.60s |
| AgentHub       |      10.62s |
| **Time saved** | **192.98s** |
| **Speedup**    |  **~19.2x** |

Calculation:

`203.60 - 10.62 = 192.98 seconds saved`

`203.60 / 10.62 ≈ 19.17x`

Rounded to **19.2x faster**.

## Quality Comparison

The agreed TermiX quality rubric has not yet been scored.

The rubric evaluates:

* Accuracy, /10
* Completeness, /10
* Actionability, /10
* Relevance, /10

Each score requires a written justification.

No placeholder scores are assigned because doing so would introduce subjective judgments that have not yet been independently evaluated.

## Conclusion

For this task, AgentHub reproduced the manually verified Venus lending position exactly across the four core values:

* Supplied balance
* Borrowed balance
* Account liquidity
* Account shortfall

AgentHub completed the task in **10.62 seconds**, compared with **203.60 seconds manually**, representing a measured **~19.2x speedup**.

The only additional figure shown by AgentHub, the **70% collateral factor**, is backed by a real onchain `Comptroller.markets(vBNB)` read but was not validly obtained during the manual benchmark. It is therefore excluded from the parity calculation.

This benchmark demonstrates the primary AgentHub advantage for this task: **turning multiple low-level contract reads into a single, structured result while preserving the underlying onchain values.**
