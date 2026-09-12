# Software marketplace integration

## Architecture

Inspected branch `feat/backend-integration` at `cf1c821` with a clean working tree. Next.js App Router / React / Tailwind, API route handlers, Supabase PostgreSQL, RainbowKit/wagmi/viem, ethers HSK PublicLock v15 helpers and the Avalanche Fuji ContentProofRegistry were already present. Existing publications are extended; there is no parallel project model. Contract modules and contract tests remain in place.

Previously, public APIs exposed premium content and source URLs, any caller could claim a creator wallet, creation fabricated proof transaction hashes, and the demo console simulated successful execution. Public responses now use an explicit metadata projection, source storage is private, wallet identity requires a signed challenge, and proof links require a real verified registry event for new publications.

## Setup

1. Install with `corepack pnpm install --frozen-lockfile`.
2. Configure `.env.local` using `.env.example`: Supabase URL, **server-only** service role key, `APP_ORIGIN`, and WalletConnect project ID. Do not commit credentials. Anonymous keys cannot run marketplace operations.
3. Apply `supabase/schema.sql` only for a new database. Apply `supabase/migrations/20260912_marketplace.sql` once to the existing database through your normal migration process. This creates private storage and commerce tables and revokes direct anonymous/authenticated access to publications/users. Server API reads continue through the service role. Existing software is deliberately left in DRAFT until a private archive is uploaded and publication is explicit; existing article visibility is retained.
4. Use an existing native-HSK PublicLock **v15** deployed by the configured Unlock factory. The creator wallet must be a lock manager and the entered price must match `keyPrice()`. The shared example lock can only be used by its actual manager. This UI does not deploy locks. Existing `createMembershipLock()` helper remains available, but deployment requires a separately authorized wallet action.
5. Optional: configure the existing deployed Fuji `NEXT_PUBLIC_CONTENT_PROOF_REGISTRY_ADDRESS` to enable real content proof registration. The content commitment currently covers the public description, not the private ZIP. No synthetic transaction is created when it is unconfigured.
6. Start `corepack pnpm dev`.

## Creator Flow

Create → Save draft → Upload private source → Add demo (in draft form) → Set price → Review → Publish.

The form collects title, public description/summary, external demo/video URLs, optional public cover image, HSK price and existing lock. Drafts can be resumed from `/dashboard` → “Sign in to load drafts and projects” → Manage. Source upload accepts ZIP archives up to 20 MiB, does not extract or execute them, and uses a random immutable key in the private `source-artifacts` bucket. Save/upload operations never expose that key in project metadata. Publication checks ownership, source presence, bucket privacy, factory registration, lock version, native token, manager and price. Published content and pricing are immutable; archive unlists a project while retaining buyer downloads. Revisions use a new publication.

Optional Fuji anchoring invokes the existing `registerContent` function, waits for a receipt and submits its hash to the backend. The backend checks successful execution and a matching registry event before saving proof metadata. It is an actual wallet transaction with a gas charge, initiated only by the creator.

## Buyer Flow

View demo → Connect wallet → Sign in → Buy → Blockchain confirmation → Backend verification → Permanent entitlement → Secure source access.

`/content/:id` exposes demo links before payment. “Buy source code” signs a wallet authentication challenge, checks existing entitlement, obtains a fresh server checkout, shows price/project/network confirmation, switches to chain 133 and invokes the existing PublicLock v15 tuple `purchase` ABI. The `data` argument is `UTF8("devvault:source:" + publicationId)`. There is one purchase recipient, the authenticated buyer. A matching fresh key mint is required. Existing holders whose lock refuses another key need a compatible creator lock; a previous unrelated membership transaction is not accepted as proof of buying this software.

Pending transaction hashes are saved locally by project and wallet. Reloading offers “Resume payment verification” rather than another payment. A reverted receipt clears the pending attempt. A timeout or backend failure retains it for recovery; do not submit a second payment for the same pending attempt. Only a backend confirmed entitlement reveals the source action.

`/purchases` → “Sign in / refresh” loads the permanent buyer library. Archived projects remain downloadable there. `/dashboard` also shows confirmed sales, per-project purchase totals, unique buyers and gross HSK paid. These are payment totals, not net creator revenue after protocol fees.

## Security Model

- Demo public; source private. Public APIs and server-rendered public pages use an allowlist. Legacy `zip_url`, `repository_url`, `premium_content` and `demo_preview_code` are never returned publicly. Development access fixtures contain fictional content only; they cannot retrieve database premium content.
- Database RLS and revoked grants prevent direct Supabase anonymous/authenticated clients from bypassing API checks. The private bucket also has restrictive policies blocking those roles even if a broad storage policy exists elsewhere. Service role keys stay server-side.
- Wallet connection alone is insufficient. A domain/URI-bound, five-minute random challenge is signed by the wallet. Its hash is stored in PostgreSQL and atomically consumed; a matching HTTP-only challenge cookie binds the browser flow. A random session token is stored only as a hash in PostgreSQL, with a 24-hour expiry. Cookies are SameSite Strict and Secure in production. All writes enforce the configured `APP_ORIGIN`. Expired challenge/session rows can be periodically deleted by database maintenance. Wallets must support Ethereum message signing; this initial authentication supports EOA signatures.
- Frontend success cannot grant access. The backend independently fetches transaction, receipt, block and chain ID over HSK RPC, requires two confirmations and a canonical receipt block, verifies successful status, exact sender, target, exact stored wei amount, publication-specific calldata and a matching zero-address-to-buyer Transfer mint from the expected lock. Payments must postdate publication. RPC failures fail closed.
- PostgreSQL unique constraints on `(project_id, buyer_wallet)` and `(chain_id, transaction_hash)` enforce idempotency and transaction replay protection across workers. No temporary membership expiry participates in source authorization. Confirmed entitlements have no expiry.
- Source endpoints authenticate and allow only the creator or a confirmed buyer. Supabase issues a download URL valid for 600 seconds. It is a bearer URL during that interval; the private object path alone grants no access. Responses use `private, no-store`. Purchased archives themselves cannot be made uncopyable after delivery.
- Commerce does not fall back to in-memory persistence. Missing configuration/migrations cause a failure instead of an apparent successful purchase.
- Demo URLs accept only HTTP/HTTPS without embedded credentials. They open as external links with `noopener noreferrer`. No creator HTML, CLI code or uploaded archive executes on the application origin. Future interactive uploaded demos require an isolated origin/runtime and a separate threat review.
- Any legacy public source URLs that were already distributed must be removed or rotated at their original hosting provider by their owner. Removing them from this API cannot revoke copies or third-party public hosting.

Private storage uses the existing provider's [private bucket controls](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [expiring signed download URLs](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).

## Current Testnet

Payments: **HSKChain Testnet, chain ID 133**, native HSK. Constants come from `lib/web3/hsk.ts`; explorer links reuse `getHskExplorerTxUrl()`.

Unlock v14 factory: `0x56c7b33a4e06e79E7611787170DA26339E58b4Eb`.
PublicLock v15 template: `0x04D257Fa68fca523B6709E3A5bcbBA57e8518d5B`.
Payment target: the specific creator-managed PublicLock stored on the publication, checked at publication and checkout. The lock key may expire; the database software entitlement does not.

Optional provenance: **Avalanche Fuji, chain ID 43113**, existing ContentProofRegistry. Neither mainnet nor production readiness is claimed. No new contract is required for this design.

## API

- `POST /api/auth/nonce` `{wallet}` → sign-in message; `POST /api/auth/verify` `{signature}` → session cookie.
- `GET /api/auth/session`; `POST /api/auth/logout`.
- `GET /api/publications` → published metadata only; `?mine=true` requires a creator session and includes their drafts.
- `POST /api/publications` → authenticated draft. Creator identity is derived from session.
- `GET /api/publications/:id` → public published metadata.
- `GET /api/publications/:id/manage` → creator metadata and `hasSource` boolean.
- `POST /api/publications/:id/upload` → multipart `file` ZIP, creator only.
- `POST /api/publications/:id/publish`, `/archive` → creator only.
- `POST /api/publications/:id/proof` `{transactionHash}` → verify existing Fuji registration.
- `POST /api/publications/:id/checkout` → trusted current payment configuration or existing access.
- `POST /api/publications/:id/verify` `{transactionHash}` → independent verification and permanent entitlement.
- `GET /api/publications/:id/access` → session-bound access state.
- `GET /api/publications/:id/source` → authorized ten-minute signed download URL.
- `GET /api/purchases` → buyer library; `?sales=true` → authenticated creator sales.

## Validation

`corepack pnpm typecheck`, `corepack pnpm typecheck:contracts`, `corepack pnpm lint`, `corepack pnpm test:marketplace`, `corepack pnpm test`, `corepack pnpm build`, `git diff --check`.

Marketplace tests mock session, persistence and RPC boundaries. Contract tests remain local Hardhat tests. `scripts/validate-hsk.mjs` remains a separate read-only network validation; automated tests do not send live transactions. Database migration and real-wallet end-to-end validation require a configured test environment.
