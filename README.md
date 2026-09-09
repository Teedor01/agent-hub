# AgentHub

> **A trust-first marketplace for discovering, comparing, and hiring AI agents on BNB Chain.**

AgentHub is an AI agent marketplace built for the **BNB Chain Smart Money Era hackathon**.

Instead of simply listing AI agents, AgentHub helps users answer:

> **"Which agent should I trust to do this job?"**

Users describe what they want to accomplish, AgentHub identifies the relevant task category, ranks available agents, explains the recommendation, exposes trust and verification signals, and provides a permissioned hiring flow.

For supported agents, execution is powered by **Altana session keys**, giving the user scoped permissions, spending limits, expiration, and revocation.

---

## Why AgentHub?

The AI agent ecosystem is growing quickly, but discovering an agent is not the same as trusting one.

AgentHub focuses on the missing marketplace layer:

* **Discovery** ... find agents by the job you need done
* **Comparison** ... compare agents using consistent signals
* **Trust** ... inspect identity, activity, verification, and performance evidence
* **AI Copilot** ... translate natural-language intent into relevant agents
* **Hiring** ... create a scoped, revocable execution session
* **Onchain proof** ... connect agent execution to real BNB Chain transactions

The goal is simple:

**Intent → Discovery → Evaluation → Hire → Permissioned Execution → Proof**

---

## Core User Flow

```text
User Intent
    ↓
AI Copilot
    ↓
Task Classification
    ↓
Agent Retrieval
    ↓
Deterministic Ranking
    ↓
Recommendation + Explanation
    ↓
Agent Profile
    ↓
Trust Evidence
    ↓
Compare Agents
    ↓
Hire Agent
    ↓
Altana Permissioned Session
    ↓
BNB Chain Execution
    ↓
Transaction Proof
    ↓
Revoke Session
```

---

## Main Categories

AgentHub currently focuses on four DeFi agent categories aligned with the BNB Chain hackathon:

### Rebalancing

Agents that help manage portfolio allocations and identify rebalancing actions.

### Grid Trading

Agents that calculate mechanical trading ranges and grid levels from onchain liquidity data.

### Yield Optimization

Agents that compare available DeFi markets and identify potential yield opportunities.

### Health Factor Monitoring

Agents that inspect lending positions and surface account liquidity, borrow exposure, and risk-related information.

---

# AI Copilot

The AgentHub Copilot lets users describe their goal naturally.

For example:

```text
"I want to monitor my Venus lending position."
```

The Copilot:

1. Understands the user's intent
2. Classifies the task
3. Retrieves relevant agents
4. Applies deterministic ranking
5. Explains why an agent was recommended

The LLM is used for understanding and narration.

**Ranking itself is deterministic.**

This prevents the model from arbitrarily inventing agent scores or recommendations.

---

# Trust Layer

AgentHub treats trust as structured data rather than a marketing claim.

Agent information can be classified as:

* **Verified**
* **Derived**
* **Self-reported**
* **Demo / Simulated**

This distinction is important.

AgentHub does **not** present demo data as verified historical performance.

The trust score is designed to be explainable and deterministic, using signals such as:

* Identity
* Performance
* Reliability
* Activity
* Verification

Example weighting:

```text
Identity       20%
Performance    30%
Reliability    25%
Activity       15%
Verification   10%
```

The system can therefore explain not only an agent's score, but **why the score exists**.

---

# ERC-8004

AgentHub integrates with **ERC-8004** agent identity infrastructure.

Registered agents can expose identity and reputation information through the ERC-8004 ecosystem.

AgentHub currently has a real registered agent:

**AgentCensus Health Factor Monitor**

The application can retrieve registration and reputation metadata from 8004scan.

---

# Altana Integration

Altana provides the permissioned execution layer for AgentHub.

The hiring architecture is:

```text
AgentHub
   │
   ├── Discovery
   ├── Ranking
   ├── Trust
   ├── Comparison
   └── Hiring
          │
          ▼
       Altana
          │
          ├── Session key
          ├── Contract allowlist
          ├── Spend cap
          ├── Expiration
          └── Revocation
                  │
                  ▼
             BNB Testnet
```

A hire can create a real, scoped Altana session.

The session can be restricted by:

* Allowed contract calls
* Spending limit
* Expiration
* User revocation

This means hiring an agent does not require handing the agent unrestricted wallet access.

---

# Real Onchain Task Computations

AgentHub contains real task-computation pathways for selected agents.

These computations are separate from the simulated marketplace data.

## AgentCensus

AgentCensus reads real Venus Testnet data.

It can inspect:

* vToken balances
* Underlying supplied assets
* Borrow balances
* Venus account liquidity
* Venus account shortfall
* Market configuration

Example data sources include:

```text
Venus Comptroller
getAccountLiquidity(address)

Venus vToken
balanceOf(address)
balanceOfUnderlying(address)
borrowBalanceStored(address)

Venus Comptroller
markets(address)
```

The system clearly distinguishes authoritative Venus account liquidity/shortfall from derived calculations.

---

## StableYield

StableYield compares real Venus market data against the user's real onchain position.

It uses:

* Venus market API data
* BSC Testnet wallet data
* Supply APY
* Borrow APY
* Current market position

Example output:

```text
Best available market: USDe

Supply APY: 1.9251%
Borrow APY: 4.4570%
```

The application clearly states that the Venus base supply APY does not include XVS rewards.

---

## RangeBot

RangeBot reads real PancakeSwap V2 Testnet liquidity data and mechanically calculates a grid.

It discovers the required contracts rather than relying on hardcoded pair assumptions:

```text
Router
  ↓
Factory
  ↓
Pair
  ↓
Reserves
  ↓
Current Price
  ↓
Grid Range
  ↓
Grid Levels
```

The grid uses a configurable percentage band around the current price.

Example:

```text
Current Price
      ↓
±10% Range
      ↓
5 evenly spaced levels
```

These are **mechanical calculations**, not predictions.

AgentHub does not claim that the calculated grid guarantees profit or represents historical trading performance.

---

# TermiX Agent Advantage Benchmark

AgentHub was tested against manual execution for real tasks.

## Task 1 ... AgentCensus

| Metric            |    AgentHub |  Manual |
| ----------------- | ----------: | ------: |
| Execution time    |      10.62s | 203.60s |
| Time saved        | **192.98s** |         |
| Speed improvement |  **~19.2×** |         |

The core manually verified values matched AgentHub:

* vBNB balance
* Borrow balance
* Venus account liquidity
* Venus account shortfall

---

## Task 3 ... RangeBot

| Metric            |    AgentHub | Manual |
| ----------------- | ----------: | -----: |
| Execution time    |       5.75s |   113s |
| Time saved        | **107.25s** |        |
| Speed improvement |  **~19.7×** |        |

The manual test retrieved real PancakeSwap pair reserves.

The calculation period for the manual test was not recorded and is therefore **not claimed**.

---

## Task 2 ... StableYield

StableYield completed successfully using real Venus API and BSC Testnet data.

```text
AgentHub execution: 15 seconds
Manual benchmark: pending
```

No manual time is invented or estimated.

---

# Data Integrity

AgentHub follows a strict rule:

> **If the system did not verify it, it should not present it as verified.**

Marketplace agents may contain demo data for hackathon demonstration.

When that happens, the UI explicitly labels it.

Real execution pathways are also separated from historical performance.

For example:

```text
Real Altana session
≠
Verified historical trading performance
```

This distinction is intentional.

---

# Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js App Router
* TypeScript API routes
* Prisma
* PostgreSQL

### Blockchain

* Viem
* Wagmi
* BNB Smart Chain Testnet
* ERC-8004
* PancakeSwap V2
* Venus Protocol

### Agent Execution

* Altana SDK
* Session keys
* Contract allowlists
* Spend limits
* Expiration
* Revocation

### AI

* LLM-powered Copilot
* Intent classification
* Agent retrieval
* Recommendation explanation

---

# Architecture

```text
┌───────────────────────────────────────┐
│              AgentHub UI              │
│                                       │
│  Search · Copilot · Profiles · Hire  │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│          AgentHub Application          │
│                                       │
│  Intent Classification                │
│  Agent Retrieval                      │
│  Deterministic Ranking                │
│  Trust Engine                         │
│  Comparison Engine                    │
│  Task Computation                     │
└───────┬───────────────┬───────────────┘
        │               │
        ▼               ▼
┌──────────────┐   ┌───────────────┐
│ PostgreSQL   │   │ External Data  │
│ + Prisma     │   │               │
│              │   │ ERC-8004      │
│ Agent Data   │   │ Venus         │
│ Trust Data   │   │ PancakeSwap   │
└──────────────┘   └───────┬───────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Altana SDK  │
                    │             │
                    │ Session Key │
                    │ Spend Cap   │
                    │ Allowlist   │
                    │ Expiry      │
                    │ Revocation  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ BNB Chain   │
                    │ Testnet     │
                    └─────────────┘
```

---

# Project Structure

```text
agenthub/
├── app/
│   ├── api/
│   │   ├── agents/
│   │   ├── copilot/
│   │   ├── tasks/
│   │   └── hire/
│   │
│   ├── agents/
│   ├── hire/
│   ├── compare/
│   └── page.tsx
│
├── lib/
│   ├── altana/
│   ├── erc8004/
│   ├── tasks/
│   │   ├── venus-health.ts
│   │   └── pancake-grid.ts
│   ├── trust/
│   ├── ranking/
│   └── db/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# Getting Started

## Requirements

* Node.js 20+
* npm
* PostgreSQL
* BNB Smart Chain Testnet wallet
* Required API credentials

---

## Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd agenthub
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

---

## Database

Run Prisma:

```bash
npx prisma generate
```

Push the schema:

```bash
npx prisma db push
```

If the project includes seed data:

```bash
npm run db:seed
```

---

## Development

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Environment Variables

Example configuration:

```env
DATABASE_URL="your_postgresql_connection_string"

NEXT_PUBLIC_BSC_TESTNET_RPC="your_bsc_testnet_rpc"

ALTANA_API_KEY="your_altana_api_key"

ERC8004_API_KEY="your_8004scan_api_key"

LLM_API_KEY="your_llm_api_key"
```

Do not commit `.env` files or private keys.

---

# Security

AgentHub is designed around scoped execution rather than unrestricted wallet access.

Important safeguards include:

* Session-based permissions
* Contract allowlists
* Spend caps
* Session expiration
* User-controlled revocation
* Explicit testnet boundaries
* Separation between demo data and verified data

Private keys and secrets must remain outside the repository.

---

# Current Scope

AgentHub is currently a hackathon MVP.

Some marketplace agents use demo/simulated metadata while their execution pathways are being developed.

The following distinction is intentional:

```text
Demo marketplace data
        ≠
Verified agent track record

Real execution pathway
        ≠
Historical performance
```

The system exposes these differences to users instead of hiding them.

---

# Roadmap

### Near term

* Expand real ERC-8004 agent coverage
* Add more real task-computation pathways
* Complete more manual Agent Advantage benchmarks
* Add richer reputation evidence
* Improve agent comparison

### Future

* More DeFi protocols
* More agent categories
* Agent-to-agent hiring
* Automated task verification
* ERC-8183 integration
* x402 / B402 payments
* Production BNB Chain deployment
* Marketplace reputation and reviews

---

# Hackathon Tracks

AgentHub is designed around the **BNB Chain Smart Money Era** ecosystem and directly demonstrates:

* DeFi agent discovery
* Rebalancing
* Grid Trading
* Yield Optimization
* Health Factor Monitoring
* ERC-8004 identity
* Altana permissioned agent execution

The marketplace is designed to support a future where users do not need to manually navigate multiple DeFi protocols for every task.

Instead:

```text
Tell AgentHub what you need.
        ↓
Find the right agent.
        ↓
Understand why it is trusted.
        ↓
Hire it with scoped permissions.
        ↓
Verify what happened onchain.
```

---

# Philosophy

AgentHub is built around three principles:

### 1. Discovery should be intelligent

Users should be able to describe a goal, not search through technical agent names.

### 2. Trust should be inspectable

A score without evidence is just a number.

AgentHub aims to show users where trust signals come from.

### 3. Execution should be permissioned

Hiring an agent should not mean giving it unlimited control.

Scoped permissions, spending limits, expiration, and revocation make agent execution safer and easier to reason about.

---

# Built for the Smart Money Era

AgentHub is not trying to build another chatbot.

It is building the **marketplace layer between users and autonomous financial agents**.

The long-term vision is a BNB Chain ecosystem where users can discover specialized agents, compare their capabilities, verify their track record, hire them safely, and see the resulting onchain actions.

**Find the agent.
Understand the agent.
Hire the agent.
Verify the work.**

---

## License


