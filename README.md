# DevVault Creator Platform

Decentralized content platform for creators built with Next.js, TypeScript, Tailwind CSS, Hardhat, Solidity, OpenZeppelin, wagmi, viem, and RainbowKit.

**Frontend checkpoint:** [Architecture, verified stack and known blockers](docs/frontend-architecture.md) · [Tasks 1–10 and manual checks](docs/frontend-checkpoint.md).

**Task 11:** [Development-only Unlocked preview and validation](docs/task-11-unlocked.md). In development, use the Locked/Unlocked selector on a publication page. The production build ignores this selector.

Explore and content previews use shared mocks. Subscribe is intentionally disabled; the existing Create screen calculates a local hash only. Membership purchases, publication transactions and protected backend delivery are not implemented yet.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, strict TypeScript, Tailwind CSS 4
- **Web3 Integration**: Wagmi, Viem, RainbowKit, Unlock Protocol
- **Smart Contracts**: Solidity ^0.8.24, Hardhat, OpenZeppelin Contracts
- **Target networks**: HashKey Chain for memberships; Avalanche Fuji for content proofs. The inherited wallet configuration is still Avalanche-only until the network integration task.

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
│   │   ├── unlock.ts            # Unlock Protocol lock integration
│   │   ├── memberships.ts       # Membership validation & tiers
│   │   ├── avalanche.ts         # Avalanche network utilities & explorers
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
