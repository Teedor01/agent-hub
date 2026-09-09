# AgentHub, TermiX Agent Advantage Report

## Purpose

This report evaluates whether agents hired through **AgentHub** provide a measurable advantage over performing the same tasks manually.

The TermiX bounty requires:

* At least **3 real tasks**
* Each task performed both through the marketplace and manually
* Comparison of **time, cost, and output quality**
* Real task outputs attached as evidence
* At least one task involving **trading, equities, or security**

AgentHub itself is **not integrated with TermiX**. This document is the required evidence and benchmark report for the TermiX bounty.

### Benchmark methodology

Manual runs were performed and timed personally by the user.

AgentHub runs were executed through the actual application.

Claude was used for development and debugging, but **was not used to perform or time the manual benchmark runs**.

Every reported measurement comes from an actual execution. No missing values have been estimated or fabricated.

---

# Benchmark Status

| Task                    | Agent       | AgentHub Run | Manual Run | Status                           |
| ----------------------- | ----------- | -----------: | ---------: | -------------------------------- |
| Lending / Health Factor | AgentCensus |       10.62s |    203.60s | **Complete**                     |
| Yield Optimization      | StableYield |          15s |    Pending | **AgentHub tested**              |
| Grid Trading            | RangeBot    |        5.75s |       113s | **Execution benchmark complete** |

**Current conclusion:** Task 1 is fully closed. Task 3 has a measured execution-time comparison but does not yet have full output-parity verification. Task 2 still requires a manual baseline.

---

# Task 1, AgentCensus

### Lending / Health Factor Monitoring

Full evidence: [`task-1-lending.md`](./task-1-lending.md)

**Wallet**

`0x9d5e4d9BE05EBAB93AF94D8B42e53B6C2594c7fA`

### Results

| Metric            |          AgentHub |      Manual |
| ----------------- | ----------------: | ----------: |
| Execution time    |        **10.62s** | **203.60s** |
| Time saved        |       **192.98s** |             |
| Speed improvement | **~19.2× faster** |             |

### Output parity

The following values were independently checked during the manual run and matched AgentHub exactly:

* Supplied vBNB balance
* Borrow balance
* Venus account liquidity
* Venus account shortfall

### Data source

AgentHub used real BSC Testnet and Venus onchain data, including:

* `balanceOf(address)`
* `balanceOfUnderlying(address)`
* `borrowBalanceStored(address)`
* `getAccountLiquidity(address)`
* `markets(address)`

### Data integrity note

AgentHub displayed a **70% collateral factor** obtained from `Comptroller.markets(vBNB)`.

The manual benchmark attempted to retrieve this value using the wrong method, so the 70% figure is **not claimed as independently verified by the manual run**.

It is therefore excluded from the output-parity claim.

### Quality

A formal quality score has not yet been assigned.

---

# Task 2, StableYield

### Yield Optimization

Full evidence: [`task-2-yield.md`](./task-2-yield.md)

### AgentHub execution

**Status:** SUCCESS

**Execution time:** 15 seconds

**Wallet:**

`0x9d5e4d9BE05EBAB93AF94D8B42e53B6C2594c7fA`

AgentHub compared real Venus market data with the wallet's real BSC Testnet position.

The tested wallet had no current position in the compared stablecoin market.

### Example result

**Best available market:** USDe

* Supply APY: `1.9251324808226524%`
* Borrow APY: `4.457012383661684%`

### Data sources

* Real Venus API market data
* Real BSC Testnet onchain wallet data

The task computation itself involved:

* No transaction
* No spend
* No Altana session

### Manual benchmark

**Pending.**

The Venus frontend/API workflow was not usable as a reliable manual benchmark during testing.

No manual execution time has been estimated or invented.

### Quality

A formal quality score has not yet been assigned.

---

# Task 3, RangeBot

### Grid Trading

Full evidence: [`task-3-trading.md`](./task-3-trading.md)

This is the **trading task** required by the TermiX bounty.

### Pair

**USDT/WBNB**

Pair contract:

`0x97B0307973f6f662FF32720c6D57c6619e936319`

### AgentHub execution

**Status:** SUCCESS

**Execution time:** 5.75 seconds

AgentHub retrieved real PancakeSwap V2 Testnet data from:

* Router
* Factory
* Pair
* USDT
* WBNB

It then calculated the current price and a mechanical grid around that price.

### Result

**Current price:**

`0.000000000000150414 WBNB per USDT`

**Grid range:**

`1.353726e-13` to `1.654554e-13`

**Levels:** 5

**Spacing:**

`7.520700000000002e-15`

These are deterministic calculations based on live reserve data.

They are **not predictions, guaranteed returns, or historical trading performance**.

---

## Manual execution

**Execution time:** 113 seconds

The manual run retrieved the pair's raw reserves:

```text
reserve0: 670209589828534484
reserve1: 100809401478913047
blockTimestampLast: 1788169571
```

### Benchmark

| Metric            |          AgentHub |   Manual |
| ----------------- | ----------------: | -------: |
| Execution time    |         **5.75s** | **113s** |
| Time saved        |       **107.25s** |          |
| Speed improvement | **~19.7× faster** |          |

The reported speed improvement compares **measured execution times only**.

The manual calculation period after retrieving the reserves was not recorded separately, so it is not included in the calculation and has not been estimated.

### Output verification

The manual run successfully retrieved the raw reserves.

A complete value-by-value comparison between those reserves and AgentHub's derived price/grid output has **not yet been completed**.

### Quality

A formal quality score has not yet been assigned.

---

# What the Benchmarks Show

The completed measurements already show a consistent reduction in execution time:

| Task        | AgentHub |  Manual |   Speedup |
| ----------- | -------: | ------: | --------: |
| AgentCensus |   10.62s | 203.60s | **19.2×** |
| RangeBot    |    5.75s |    113s | **19.7×** |
| StableYield |      15s | Pending |   Pending |

For the two tasks with measured manual baselines, AgentHub completed the measured workflow approximately **19× faster**.

However, these results should not be generalized beyond the tested workflows.

The benchmark measures the specific task implementations and manual procedures used in this report.

---

# Evidence and Reproducibility

Each task uses real protocol data and records its data sources.

### AgentCensus

Venus Comptroller and vBNB contracts on BSC Testnet.

### StableYield

Venus API plus BSC Testnet wallet data.

### RangeBot

PancakeSwap V2 Router, Factory, Pair, USDT, and WBNB contracts on BSC Testnet.

Where a value is derived rather than directly returned by a contract or API, AgentHub labels it as a calculation and exposes the underlying inputs and formula.

---

# Important Limitations

This report intentionally does **not** claim more than the evidence supports.

### Task 1

Fully benchmarked with manual output parity.

### Task 2

Real AgentHub execution completed, but manual benchmark is still pending.

### Task 3

AgentHub and manual execution times were measured, but the manual calculation period and complete derived-output parity were not recorded.

### Marketplace data

Some AgentHub marketplace agents use demo data for hackathon demonstration.

Demo marketplace metadata is not presented as verified historical performance.

Similarly:

**A real Altana execution pathway does not automatically mean an agent has verified historical trading performance.**

---

# Overall Conclusion

AgentHub has demonstrated that its agent marketplace can turn real DeFi tasks into measurable, repeatable workflows.

The strongest completed result is **AgentCensus**, where:

* The same core outputs were independently verified
* AgentHub completed the workflow in **10.62 seconds**
* The manual workflow took **203.60 seconds**
* AgentHub was approximately **19.2× faster**

RangeBot provides a second measured execution-time comparison:

* AgentHub: **5.75 seconds**
* Manual: **113 seconds**
* Approximately **19.7× faster**

StableYield has also completed a successful real-data AgentHub run, but its manual benchmark remains pending.

Therefore, the report's final three-task conclusion is **deferred until all three manual comparisons and quality evaluations are closed**.

The evidence collected so far supports a clear proposition:

> **AgentHub can reduce the time required to discover, execute, and evaluate repeatable DeFi tasks, while exposing the underlying data and execution boundaries instead of hiding them behind opaque agent claims.**
