# DevVault Creator Platform

Decentralized content platform for creators built with Next.js, TypeScript, Tailwind CSS, Hardhat, Solidity, wagmi, viem, and RainbowKit.

## Tech Stack

- **Frontend**: Next.js 16.3.4 (App Router), React, TypeScript, Tailwind CSS
- **Web3 Integration**: Wagmi, Viem, RainbowKit, Unlock Protocol
- **Smart Contracts**: Solidity 0.8.24, Hardhat
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

# Verify source code on the block explorer
pnpm hardhat verify --network avalancheFuji <deployed_address>
```

#### Deployed Contracts

| Contract | Network | Address | Verified Source |
|---|---|---|---|
| `ContentProofRegistry` | Avalanche Fuji (testnet, chain ID 43113) | `0x5451C57dA3A8a3f0f04a74475702501628170211` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x5451C57dA3A8a3f0f04a74475702501628170211#code) |

### 4. Development Server (Next.js)

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Software marketplace: creator and buyer flow

The integrated software flow now uses private Supabase ZIP storage and permanent purchase entitlements. See [Marketplace setup, API and security model](docs/MARKETPLACE.md) for the required migration and exact testnet demo steps. These instructions supersede earlier descriptions of public ZIP links, simulated execution and frontend-only gating.

### Creator Flow

Create → Upload private source → Add public demo → Set matching HSK lock price → Review → Publish. Draft metadata is collected before upload; drafts can be resumed from the dashboard.

### Buyer Flow

View demo → Connect wallet → Sign wallet challenge → Buy → Blockchain confirmation → Backend verification → Permanent entitlement → Secure source access. Return through **My Purchases** to download again.

### Security Model

Demo metadata is public; source is private. The frontend cannot authorize access. The backend binds the authenticated wallet to a signed challenge and independently verifies HSK payment. Database uniqueness prevents transaction replay. Purchase entitlement is permanent; each signed download URL expires after ten minutes. Apply the migration before enabling this flow.

### Current Testnet

HSKChain Testnet (133) uses existing Unlock PublicLock v15 payments. Optional content provenance uses the existing Avalanche Fuji (43113) registry. This is a testnet integration, not a mainnet or production-readiness claim.

## Security and local validation

See [Security architecture and exact local setup](docs/SECURITY_ARCHITECTURE.md) for SIWE, two-hour sessions, wallet changes, private downloads, Live Demo isolation and the dual-chain boundary. [Validation record](docs/SECURITY_VALIDATION.md) separates tested behavior from missing development services. Run `corepack pnpm smoke:web` against a running development server to check HTTP and database readiness.
