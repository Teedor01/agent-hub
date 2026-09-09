# Altana Integration

AgentHub separates **agent discovery and trust** from **agent execution**.

**AgentHub owns:** discovery, ranking, comparison, and marketplace trust.

**Altana owns:** permissioned agent execution, session keys, spending limits, and execution authorization.

This separation is intentional. AgentHub does not hold user funds, and Altana does not influence marketplace ranking or trust scores.

## Integration Status

**4 of 13 marketplace agents currently have real Altana execution pathways.**

Of these, **AgentCensus** is the only agent backed by a genuinely verified ERC-8004 on-chain identity and track record.

The other three agents, **StableYield, PortfolioBalancer, and RangeBot**, use demo marketplace data. Their **Altana execution infrastructure is real**, but their historical metrics, creator information, and execution history are not presented as real-world facts.

AgentHub makes this distinction explicit throughout the UI using the `DataSourceBadge`.

A real Altana transaction is never presented as proof that an agent's marketplace metrics are real.

## Data Sources

Every agent card, profile, comparison row, and hire page includes a `DataSourceBadge` identifying the source of the displayed information.

| Category              | Meaning                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `VERIFIED_ONCHAIN`    | Data confirmed directly against blockchain state                         |
| `VERIFIED_EXTERNAL`   | Data confirmed through a trusted external registry such as 8004scan      |
| `MARKETPLACE_DERIVED` | Deterministic metrics calculated by AgentHub                             |
| `SELF_REPORTED`       | Information provided by the agent listing and not independently verified |
| `DEMO`                | Fabricated fixture data used to demonstrate marketplace functionality    |

When an agent has `altanaEnabled = true` but its marketplace data is not independently verified, the hire page explicitly tells the user:

**The transaction is real. The marketplace data is demo data.**

This prevents the execution proof from being mistaken for a verified agent track record.

## What's Real

The Altana integration uses the real `@altananetwork/sdk` package against BNB Chain testnet. There are no mocked Altana calls.

For an agent configured with `altanaEnabled = true`, a hire follows this flow:

1. **Create an Altana wallet**

   A real Altana wallet is created using a server-held owner signer.

2. **Grant a scoped session**

   `client.grantSession` creates a real session with:

   * a specific contract allowlist
   * a spend cap
   * an expiration time

   The session is registered in Altana's Keystore when the transaction confirms.

3. **Execute a real transaction**

   `client.execute` sends one minimal proof transaction through the session.

   The transaction uses `value: 0`, so the integration proves that the session can authorize execution without unnecessarily moving funds.

4. **Record the execution**

   AgentHub stores the real:

   * transaction hash
   * agent wallet address
   * spend cap
   * session expiry

   in the corresponding `Hire` record.

5. **Revoke access**

   The revoke endpoint calls `client.revokeSession` and records the actual revocation timestamp.

The hire page also displays the agent's configured permissions **before approval**, including the contract, spend cap, and session duration.

These values come from the `Agent` record rather than hardcoded UI text.

## What's Simulated

Agents without `altanaEnabled = true` continue to use AgentHub's original simulated hiring path.

A simulated hire:

* creates a `Hire` record
* uses `status: "SIMULATED"`
* has `txHash: null`
* creates no wallet
* creates no Altana session
* performs no blockchain transaction

The UI identifies these hires as simulated.

### Current Real Agents

Four agents are currently configured for the real execution path:

| Agent                               | Category           | Marketplace Data | Altana Execution |
| ----------------------------------- | ------------------ | ---------------- | ---------------- |
| `agentcensus-health-factor-monitor` | Health Factor      | Verified         | Real             |
| `stableyield`                       | Yield Optimization | Demo             | Real             |
| `portfolio-balancer`                | Rebalancing        | Demo             | Real             |
| `rangebot`                          | Grid Trading       | Demo             | Real             |

The four agents were deliberately selected to demonstrate real execution across AgentHub's four marketplace categories.

The remaining nine agents can be connected once their real execution contracts and verified proof selectors have been sourced.

## What's Not Implemented

The current integration intentionally does **not** implement:

### Agent-to-agent commerce

Agents cannot autonomously hire or pay other agents.

### Autonomous treasury operations

This is not a continuously running trading, monitoring, or rebalancing system.

Each real hire produces a single proof transaction.

### Real-time spend tracking

The hire page does not display a fabricated "spent so far" value.

The current proof transaction sends `value: 0`, and AgentHub does not have real ongoing spend data to report.

If actual agent spending is introduced later, usage should be calculated from real execution data.

## Contract Addresses

Each proof transaction uses a real contract function that:

* exists directly on the target contract
* is a pure/view operation
* requires no arguments
* does not modify state

This avoids using arbitrary calldata simply to produce a transaction.

| Contract                                 | Address                                      | Chain       | Used By                     | Proof Selector           | Source                              |
| ---------------------------------------- | -------------------------------------------- | ----------- | --------------------------- | ------------------------ | ----------------------------------- |
| Venus Unitroller / Core Pool Comptroller | `0x94d1820b2D1c7c7452A163983Dc888CEC546b77D` | BSC Testnet | AgentCensus, StableYield    | `admin()` `0xf851a440`   | Venus Protocol deployment           |
| PancakeSwap V2 Router                    | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` | BSC Testnet | PortfolioBalancer, RangeBot | `factory()` `0xc45a0155` | PancakeSwap developer documentation |

The selectors were derived from the function signatures using the standard Ethereum ABI method:

`keccak256(functionSignature)[0:4]`

During development, an invalid selector was tested against the Venus Unitroller and correctly reverted because the function did not exist. The final integration uses selectors verified against the actual target contracts.

Protocol deployments can change, so these addresses should be revalidated before extending the integration.

## Altana Track Requirements

| Requirement                                     | Status       |
| ----------------------------------------------- | ------------ |
| Agents have their own Altana wallets            | Complete     |
| Sessions use contract allowlists                | Complete     |
| Sessions have spend limits                      | Complete     |
| Sessions have expiration                        | Complete     |
| Sessions registered in Keystore                 | Complete     |
| Real transactions executed through session keys | Complete     |
| User can review permissions before approval     | Complete     |
| User can revoke agent authority                 | Complete     |
| Agent-to-agent commerce                         | Out of scope |
| Autonomous repeated execution                   | Out of scope |

## Environment Variables

The integration requires:

```env
ALTANA_ENABLED="true"
ALTANA_OWNER_PRIVATE_KEY="0x..."
```

`ALTANA_ENABLED` acts as the global kill switch. When disabled, all agents use the simulated path regardless of their individual configuration.

`ALTANA_OWNER_PRIVATE_KEY` must be a **testnet-only private key** funded with BNB testnet tokens.

Never commit this key, expose it to the client, or use a wallet containing mainnet funds.

## Security

The owner private key is read only by `lib/altana/client.ts`.

It is never:

* logged
* returned through an API response
* exposed to browser-side code
* stored in the database

The four currently wired agents use a deliberately small **0.001 BNB spend cap**.

These are proof-of-integration limits, not production operating budgets.

If additional agents are connected, their limits should remain appropriately scoped to the minimum authority required for their task.
