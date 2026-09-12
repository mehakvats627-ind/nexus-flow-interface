# NEXUS

### Autonomous AI Payments, With Rules That Cannot Be Ignored.

NEXUS is a **Web3-native payment control layer for AI agents**.

AI agents are becoming capable of choosing and purchasing services autonomously. But giving an agent a wallet creates a fundamental problem:

> **How do you let an AI spend money without giving it unlimited control over your funds?**

NEXUS solves this by putting the **budget and payment rules on-chain**.

A human defines the spending authority.
An AI agent chooses and requests services.
The smart contract enforces the limits.
Every successful payment becomes an auditable on-chain record.

The agent gets autonomy. The human keeps control.

---

## ⚡ What NEXUS Does

NEXUS enables an AI agent to autonomously purchase digital services such as:

* 🌐 Translation
* 💻 Code generation
* 🎨 Image generation
* ⚙️ Compute and other API-based services

Each agent operates through a dedicated wallet with a predefined spending budget.

When the agent attempts a purchase:

```text
AI Agent
   ↓
Service Request
   ↓
402 Payment Required
   ↓
Agent Wallet Signs Payment
   ↓
NEXUS Budget Contract
   ↓
Budget + Request Validation
   ↓
USDC Settlement
   ↓
Service Delivery
   ↓
Content Verification
   ↓
Immutable Receipt
```

If the payment violates the rules, the blockchain rejects it.

---

## 🛡️ The Core Security Model

NEXUS is built around one principle:

### **The AI should never be the authority.**

The AI can **request** a payment, but it cannot override the rules governing that payment.

The smart contract enforces:

| Rule                          | Enforcement  |
| ----------------------------- | ------------ |
| Maximum spending budget       | On-chain     |
| Authorized agent              | On-chain     |
| Duplicate request protection  | On-chain     |
| Payment amount                | On-chain     |
| Payment history               | On-chain     |
| Service delivery verification | Content hash |
| Audit trail                   | Blockchain   |

This means even if an agent makes a bad decision, exceeds its budget, or attempts to replay an old request, the enforcement layer remains outside the AI's control.

---

## 🤖 Agentic Architecture

NEXUS separates **decision-making** from **authorization**.

### AI Layer

The AI agent is responsible for:

* Understanding the user's task
* Selecting an appropriate service
* Comparing available services
* Determining whether a purchase is necessary
* Initiating the payment flow

### Blockchain Layer

The smart contract is responsible for:

* Who can spend
* How much can be spent
* Whether the request has already been processed
* Recording successful payments
* Maintaining the audit trail

This separation prevents the AI from becoming its own security boundary.

---

## 💳 x402 Payment Flow

NEXUS uses the **x402 payment protocol** to enable machine-to-machine payments over HTTP.

A service can respond with:

```text
402 Payment Required
```

The agent then:

1. Reads the payment requirements
2. Evaluates the requested service
3. Signs the payment using its dedicated wallet
4. Submits the payment
5. Receives the service
6. Verifies the delivered content
7. Records the resulting receipt

This allows AI agents to interact with paid APIs without requiring a human to manually approve every transaction.

---

## 🔐 Budget Enforcement

Suppose the agent has:

```text
Budget:       $10 USDC
Spent:         $7 USDC
Remaining:     $3 USDC
```

The agent attempts to purchase a service costing `$5`.

The AI may request it.

The application may attempt it.

But the smart contract says:

```text
Requested: $5
Remaining: $3

❌ Budget Exceeded
Transaction Reverted
Funds Protected
```

The AI cannot negotiate with the contract.

Because, thankfully, Solidity does not care how persuasive your chatbot is.

---

## 🔁 Replay Protection

Every payment request receives a unique `requestId`.

Once a request has been settled, it cannot be processed again.

```text
Request ID: req-001

First attempt
    ↓
✅ Payment settled

Second attempt
    ↓
❌ Duplicate request rejected
```

This prevents an agent or malicious client from accidentally or intentionally charging the same request twice.

---

## 🧾 Verifiable Receipts

Every successful service purchase produces a receipt containing information such as:

* Request ID
* Agent address
* Service
* Provider
* Amount
* Transaction hash
* Timestamp
* Content hash
* Payment status

The delivered service output is hashed and the hash is associated with the payment record.

This creates a verifiable connection between:

**Payment → Service → Delivered Result**

---

## 🖥️ NEXUS Dashboard

The dashboard provides a real-time control surface for the autonomous agent.

### Dashboard

Monitor:

* Total budget
* Amount spent
* Remaining budget
* Agent status
* Recent payments
* Payment activity
* Security events

### AI Agent

View:

* Agent identity
* Authorized wallet
* Spending authority
* Network
* Budget utilization
* Agent activity

### Services

Explore available services and initiate purchases through the NEXUS payment flow.

### Transactions

Inspect successful, blocked, and duplicate payment attempts.

### Receipts

Review the complete payment and delivery record for each successful request.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      Human User     │
                    │                     │
                    │  Sets Budget/Rules  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      AI Agent       │
                    │                     │
                    │ Selects Services     │
                    │ Initiates Purchases  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       x402          │
                    │  Payment Protocol   │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │      NEXUS Smart Contract      │
              │                                │
              │  ✓ Authorized Agent            │
              │  ✓ Budget Enforcement          │
              │  ✓ Replay Protection           │
              │  ✓ Payment Records             │
              └───────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │     USDC Payment    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Service Provider │
                    │                     │
                    │  Delivers Result    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Content Verification│
                    │    + Receipt        │
                    └─────────────────────┘
```

---

## 🧰 Tech Stack

**Frontend**

* React
* TypeScript
* TanStack Router
* TanStack Start
* Tailwind CSS
* Lucide Icons

**Blockchain**

* Solidity
* Ethereum
* Sepolia Testnet
* USDC
* Hardhat
* ethers.js

**Payments**

* x402 protocol
* HTTP 402 payment flow

**Security**

* Smart-contract budget enforcement
* Authorized-agent access control
* Request replay protection
* Content hashing
* On-chain payment records

---

## 📁 Project Structure

```text
nexus-flow-interface/
│
├── contracts/
│   └── NexusBudgetManager.sol
│
├── scripts/
│   ├── compile-contracts.cjs
│   └── deploy.cjs
│
├── src/
│   ├── components/
│   │   └── nexus/
│   │
│   ├── lib/
│   │   └── nexus/
│   │       ├── blockchain/
│   │       ├── services/
│   │       └── x402/
│   │
│   └── routes/
│       ├── index.tsx
│       ├── agent.tsx
│       ├── services.tsx
│       ├── transactions.tsx
│       └── settings.tsx
│
├── test/
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Requirements

* Node.js
* npm
* Git

### Install

```bash
git clone https://github.com/mehakvats627-ind/nexus-flow-interface.git

cd nexus-flow-interface

npm install
```

### Start Development Server

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

### Build

```bash
npm run build
```

---

## 🔑 Environment Variables

Create a `.env` file using `.env.example`.

For blockchain functionality, configure the appropriate Sepolia RPC endpoint, wallet credentials, contract address, and agent configuration.

**Never commit private keys or production credentials to Git.**

---

## 🧪 Smart Contract

The core contract is:

```text
NexusBudgetManager.sol
```

Its responsibilities include:

* Agent authorization
* Budget configuration
* Payment settlement
* Budget validation
* Duplicate request prevention
* Payment recording
* Ownership management

The contract is intentionally designed so that **AI decisions remain separate from financial enforcement**.

---

## 🎬 Hackathon Demo

The ideal NEXUS demonstration follows this sequence:

### 1. Give the agent a budget

```text
Budget = $10 USDC
Spent  = $0
```

### 2. Ask the agent to complete a task

The AI determines which service is required.

### 3. Service requests payment

The provider responds with:

```text
402 Payment Required
```

### 4. Agent pays autonomously

The dedicated agent wallet signs the payment.

### 5. Smart contract validates it

The contract checks:

```text
Authorized?
     ✓

Within budget?
     ✓

Already processed?
     ✗
```

### 6. Service is delivered

The provider returns the requested result.

### 7. NEXUS verifies the result

The content hash is calculated and associated with the payment.

### 8. Receipt is generated

The dashboard displays the complete transaction.

### 9. Attack the system

Attempt a purchase above the remaining budget.

```text
❌ Budget Exceeded
```

Then replay an already-settled request.

```text
❌ Duplicate Request
```

The result demonstrates the core proposition:

> **The agent is autonomous. The money is not.**

---

## 🎯 Why NEXUS?

Most AI agents are designed around **capability**.

NEXUS focuses on **controlled capability**.

Giving an AI a wallet is easy.

Giving it a wallet that can autonomously transact while remaining constrained by deterministic, auditable rules is the real challenge.

NEXUS creates that missing control layer.

### Autonomous intelligence on top.

### Deterministic financial enforcement underneath.

---

## 📜 License

This project is developed as a hackathon prototype.

See the repository for the current licensing and usage terms.

