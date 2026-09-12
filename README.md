# DevVault Creator Platform

Decentralized content platform for creators built with Next.js, TypeScript, Tailwind CSS, Hardhat, Solidity, OpenZeppelin, wagmi, viem, and RainbowKit.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Web3 Integration**: Wagmi, Viem, RainbowKit, Unlock Protocol
- **Smart Contracts**: Solidity ^0.8.24, Hardhat, OpenZeppelin Contracts
- **Network**: Avalanche (C-Chain Mainnet & Fuji Testnet)

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
pnpm install
```

### 2. Environment Configuration

Copy the sample environment file and populate the variables:

```bash
cp .env.example .env.local
```

### 3. Smart Contracts (Hardhat)

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
