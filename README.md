# DevVault Creator Platform

Decentralized content platform for creators built with Next.js, TypeScript, Tailwind CSS, Hardhat, Solidity, OpenZeppelin, wagmi, viem, and RainbowKit.

**Current frontend checkpoint:** [Persona 3 — completed demo flows, validation and integration handoff](docs/persona-3-checkpoint.md).

**Historical checkpoints:** [Architecture](docs/frontend-architecture.md) · [Tasks 1–10](docs/frontend-checkpoint.md) · [Task 11](docs/task-11-unlocked.md). The old URL-based Unlocked selector has been replaced by mock membership verification; query parameters never unlock content.

**Subscribe:** [Mock flow](docs/task-12-subscribe.md). In development, Subscribe → confirmation → purchase → verification → fictional content. Production keeps Subscribe disabled.

**Continuation:** [Publishing, subscription recovery, dashboard, networks, and remaining dependencies](docs/continuation-status.md).

Explore and content previews use shared mocks. Development includes a validated publishing form, simulated lock/proof operations, recoverable subscription errors, and session publications in Dashboard. Real membership purchases, publication transactions and protected backend delivery are not implemented yet.

Use **Demo wallet & network** to connect/disconnect or select another account. New publications appear in Dashboard and Profile and have session-only detail links. Reloading clears demos and memberships. Use fictional content only.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, strict TypeScript, Tailwind CSS 4
- **Web3 Integration**: Wagmi, Viem, RainbowKit, Unlock Protocol
- **Smart Contracts**: Solidity ^0.8.24, Hardhat, OpenZeppelin Contracts
- **Configured testnets**: HashKey testnet for memberships; Avalanche Fuji for content proofs. Wallet connection does not enable real publishing or purchases.

## Project Structure

```text
creator-platform/
│
├── app/                         # Next.js App Router
│   ├── page.tsx                 # Explore feed
│   ├── create/
│   │   └── page.tsx             # Create publication
│   ├── content/
│   │   └── [id]/
│   │       └── page.tsx         # View & gated content reader
│   ├── dashboard/
│   │   └── page.tsx             # Creator analytics & management
│   └── profile/
│       └── [address]/
│           └── page.tsx         # User & creator profile
│
├── components/
│   ├── ui/                      # Reusable UI primitives
│   ├── wallet/                  # Wallet connection & Web3 providers
│   ├── content/                 # Content cards, previews & viewers
│   └── membership/              # Unlock Protocol membership gating
│
├── lib/
│   ├── web3/
│   │   ├── chains.ts            # Supported EVM chain configurations
│   │   ├── adapters/mock.ts     # Simulated memberships and proofs
│   │   ├── integration.ts       # Wallet and protected-content ports
│   │   ├── explorers.ts         # Verified-format links / simulation labels
│   │   └── contentProof.ts      # Content proof contract client & ABI
│   │
│   ├── api/
│   │   └── client.ts            # Typed HTTP API client
│   │
│   └── utils/                   # Helpers (classes, formatters)
│
├── contracts/
│   └── ContentProofRegistry.sol # Content provenance & gating registry
│
├── scripts/
│   └── deploy.ts                # Hardhat deployment script
│
├── test/
│   └── ContentProofRegistry.test.ts # Smart contract test suite
│
├── public/                      # Static assets
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated CI (lint, compile, test, build)
│       └── deploy.yml           # Avalanche deployment pipeline
│
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
└── README.md
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Environment Configuration

Environment variables are optional for the current frontend preview. Copy the sample only when configuring an integration, and keep private values out of public variables and Git:

```bash
cp .env.example .env.local
```

### 3. Smart Contracts (Hardhat)

The inherited Hardhat configuration currently has compatibility errors; see the frontend architecture note above. This frontend checkpoint does not validate contract compilation, tests or deployment.

```bash
# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Avalanche Fuji
pnpm hardhat run scripts/deploy.ts --network avalancheFuji
```

### 4. Development Server (Next.js)

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Frontend validation

Run sequentially (Next regenerates route types during build):

```bash
npm run lint
npm run typecheck
npm run typecheck:demo
npm run test:demo
npm run build
# With development running on port 3000:
npm run test:access -- development http://127.0.0.1:3000
# With npm run start -- --port 3001 running:
npm run test:access -- production http://127.0.0.1:3001
```

`test:demo` uses the already-installed Jiti binary from the locked toolchain; no dependency was added. The contract checks remain separate (`npm run typecheck:contracts`).
