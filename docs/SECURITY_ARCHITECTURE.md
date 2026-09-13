# Secure Source Marketplace

## Architecture and trust boundaries

The integrated product is `/Users/manuel/Documents/JoaquinProg/DevVaultt/DevVault-creator-platform`, branch `feat/secure-source-marketplace`. The separate integration repository discovered locally is `/Users/manuel/Documents/JoaquinProg/HackaTon/DevVault-unlock-hashkey`; its upstream contracts are not copied or modified.

React UI → `useAuth` / purchase hook → HTTP routes → authenticated application services → Supabase/private storage and chain adapters. `HttpError` maps predictable failures to stable status/code responses without returning database errors or stack traces. Public API and server-rendered project data use an explicit allowlist.

## Authentication

Wallet → EIP-4361 SIWE → database session → **2-hour hard TTL** → heartbeat → explicit reauthentication. The existing `/api/auth/{nonce,verify,session,logout}` flow is retained. SIWE uses the installed viem implementation and checks domain, URI, scheme, address, nonce, version, supported chain, issued-at and expiration, plus the EOA signature. See [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361). Contract-account/ERC-1271 signing is not supported.

The challenge expires in five minutes. An atomic DELETE RETURNING consumes it once, even on a failed signature attempt. Session tokens are random 256-bit values, stored only as SHA-256 digests in Supabase. Cookies are HttpOnly, SameSite=Strict, Path=/, with explicit expiry/Max-Age and Secure in production. The session has `created_at` and `expires_at`; reads never extend it. Old pre-SIWE sessions require login again after the migration.

`AuthProvider` owns initial/reconnect/focus/visibility checks, deduplicates concurrent checks, validates every five minutes while authenticated and visible, and clears state at local hard expiry. Backend 401s invalidate local identity. A connected wallet without a valid matching session exposes `REAUTH_REQUIRED` and “Re-authenticate wallet”; signatures only occur after user intent.

Wallet A → provider changes to B → local identity immediately becomes unusable → old database session is deleted → B must sign SIWE. Protected requests validate identity before sending and after receiving; an optional `X-DevVault-Wallet` consistency assertion is checked against the server session and never supplies authorization. Mutating auth calls are serialized. Logout clears local identity first, deletes the database session, expires cookies, and removes query caches marked `meta.protected`. Local protected lists are scoped to the authenticated wallet. Revocation failures remain visible rather than being reported as success.

Errors: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `WALLET_CHANGED`, `REAUTH_REQUIRED`, `INVALID_SIGNATURE`, `INVALID_NONCE`. Expired sessions fail closed even before expired-row maintenance. Schedule deletion of expired challenge/session rows in your existing database maintenance; no background service is introduced.

## Source marketplace

Purchase → HSK receipt and calldata verification → unique confirmed purchase → protected source delivery. The server derives buyer identity from the session. It verifies chain 133, successful canonical receipt, two confirmations, expected contract, buyer/recipient, exact native value, project-specific purchase data, post-publication timestamp and matching mint event. Checkout/publication validates the configured factory, PublicLock v15, native currency, price and creator management. A payment cannot prove another project even if both share a lock. Database uniqueness on `(chain_id, transaction_hash)` and `(project_id, buyer_wallet)` makes permanent entitlement insertion idempotent.

**Lifetime** purchases are permanent and independent of Unlock key expiry. The pre-existing, explicitly selected **subscription** license retains active-membership gating. It is not represented as permanent ownership. The first purchase receipt remains immutable; subscription renewals refresh on-chain membership rather than rewriting that receipt. The purchase list therefore is not a complete renewal accounting ledger.

Creators and authorized buyers obtain a ten-minute signed URL from the private `source-artifacts` bucket. Public responses never contain archive data or standalone storage keys. The storage adapter refuses a public bucket. Uploaded ZIPs are not executed or extracted. Signed URLs are bearer grants: logout prevents issuing new URLs, but already issued URLs remain usable until their ten-minute expiration; downloaded archives cannot be revoked.

## Demo security

A creator supplies an already deployed public HTTPS URL. Development also allows `http://localhost`; arbitrary HTTP, credential-bearing URLs, javascript/data/file/blob URLs and malformed values are rejected. DevVault does not fetch arbitrary demo URLs on the backend.

The Live Demo iframe uses only `sandbox="allow-scripts"`, never `allow-same-origin`, and `referrerPolicy="no-referrer"`. Camera, microphone, geolocation, clipboard, payments and USB are denied. The external “Open Live Demo” link is always available with noopener/noreferrer. Frame errors hide the embed; a timed notice and hide control handle blank frames. Cross-origin frame blocking cannot be detected reliably from onLoad; DevVault cannot bypass X-Frame-Options or frame-ancestors.

Parent CSP restricts defaults, objects, base URLs, ancestors, scripts, connections, images and frames. HTTPS/WSS destinations stay broad for configurable RPCs, wallet connectors, images and creator demos. Static Next hydration and RainbowKit retain inline scripts/styles; unsafe-eval is development-only. This is a compatibility baseline, not a nonce-based strict CSP. Parent CSP does not govern an external page's internals; iframe sandboxing supplies isolation.

## Dual chain and contracts

Avalanche Fuji (43113) → ContentProofRegistry → immutable historical content/provenance proofs. HashKey Testnet (133) → upstream Unlock v14 / PublicLock v15 → membership/payment/access. Backend → authenticated wallet + project + entitlement + private archive.

Registry review: compiler pinned to 0.8.24, custom errors, explicit visibility, creator-only version append, narrow storage, meaningful events, no loops or external calls. Duplicate hashes deliberately allocate independent IDs. Original ownership and historical proofs cannot change. The per-proof version field remains for ABI/storage compatibility. Reentrancy is **not applicable**: no external calls or funds, so no guard or artificial reentrancy test was added. Existing Hardhat tests cover exact events/data, duplicate hashes, unauthorized callers and zero/nonexistent boundary values.

## Local run

Package manager: `pnpm@12.4.1` through Corepack. No separate backend process or worker; Next serves UI and `/api` on port 3000. Existing persistence is managed Supabase; there is no Docker Compose or local DB CLI configuration in this repository.

```sh
cd /Users/manuel/Documents/JoaquinProg/DevVaultt/DevVault-creator-platform
corepack pnpm install --frozen-lockfile
```

If no `.env.local` exists, copy `.env.example` to `.env.local` and supply **development Supabase** URL, anon key and service-role key, plus your WalletConnect project ID. Set `APP_ORIGIN=http://localhost:3000`. Never paste service-role credentials into client variables. The current checkout had no configured Supabase credentials.

In the SQL editor of that development Supabase project, run these files in this order (base schema and marketplace migration are first-install scripts, not repeatable migration commands):

1. `supabase/schema.sql`
2. `supabase/migrations/20260912_marketplace.sql`
3. `supabase/migrations/20260912_acquisition_model.sql`
4. `supabase/migrations/20260912_auth_sessions.sql`

For an existing marketplace development DB, apply only missing migrations. No migrations were run against an unidentified or production database during this work.

```sh
corepack pnpm dev
```

Frontend: http://localhost:3000. API: http://localhost:3000/api. Readiness: http://localhost:3000/api/health (503 until required persistence/schema are available).

In another terminal:

```sh
corepack pnpm smoke:web
corepack pnpm test:marketplace
corepack pnpm test
corepack pnpm lint
corepack pnpm build
corepack pnpm typecheck
corepack pnpm typecheck:contracts
git diff --check
```

Run build and typecheck sequentially: build regenerates `.next/types`. There is no standalone format script. `smoke:web` never authenticates or broadcasts. It intentionally fails readiness when Supabase is missing instead of treating the public fixture store as a database connection.

## Verification checklist

1. Open `/`, connect MetaMask/Rabby on HashKey Testnet, choose Re-authenticate wallet and sign.
2. Confirm Wallet authenticated and a successful `/api/auth/session` response; cookies remain HttpOnly.
3. Switch accounts: authenticated identity disappears and SIWE is required again.
4. Open `/create`, create or manage a software project, upload a ZIP without credentials, use an existing creator-managed HSK PublicLock v15 with matching native price, and publish.
5. Open its `/content/{id}` page. Inspect the Live Demo iframe: allow-scripts only, no allow-same-origin; Open Live Demo also works for a blank/blocked embed.
6. Verify source is locked for a non-buyer. Run mocked purchase verification tests before optionally making a real testnet purchase with your wallet. The automated checks never broadcast.
7. After a confirmed lifetime entitlement, access source and repeat from My Purchases. Test separately as the creator.
8. Logout and confirm protected APIs return 401. Already issued download URLs expire after ten minutes.
