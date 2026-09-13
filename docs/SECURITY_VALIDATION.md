# Validation record — 2026-09-12

## Baseline

Branch `feat/secure-source-marketplace`; `git status --short` empty. Starting commit `eda74e6`. Recent history: `eda74e6`, `e1f4f22`, `c449070`, `b893a6d`, `cf1c821`, `04d831a`, `1cb363d`, `11aa1c1`, `1ce2037`, `4b42448`.

Before source edits: application and contract typechecks passed; lint passed with 83 warnings; Hardhat 33 tests passed; marketplace 44 tests passed; webpack production build passed. The initial simultaneous typecheck/build produced TS6053 for regenerated `.next/types` files; sequential rerun passed without source changes. This was check orchestration, not a pre-existing application type error. Next regenerated next-env.d.ts for production paths; dev regenerates its original paths.

Pre-existing gaps found by review: non-SIWE custom sign-in text, 24-hour sessions, no central session synchronization, no CSP or embedded preview, unvalidated HTTP demo URLs, absent acquisition_model migration, and subscription receipt replacement swallowing DB errors. Existing lint warnings remain outside the focused refactor. Baseline build also warned about the MetaMask SDK optional `@react-native-async-storage/async-storage` import and MODULE_TYPELESS_PACKAGE_JSON for Tailwind; neither caused build failure.

## Automated and runtime evidence

- Hardhat: 33 passing; includes 17 registry cases and integrated HSK/dual-chain/storage tests.
- Marketplace/auth/UI/storage: 64 passing, including real ephemeral EOA signatures with mocked persistence, expired/revoked sessions, nonce replay, source permission denials, wallet mismatch, in-flight response rejection and SIWE field validation. Mocked UI orchestration covers signing → submitted → confirming → verifying → confirmed, plus reverted receipts and historical receipt handling.
- Separate Unlock integration: `node --test test/hsk-validation.test.mjs test/membership.test.mjs`: 9 passing, existing compiled integration, no upstream edits.
- `node scripts/validate-hsk.mjs` in the separate integration: historicalProof PASS, purchase block 32998848, chain 133, PublicLock v15, active membership at head 33033827. Read-only; no transaction sent. Initial sandbox DNS ENOTFOUND was resolved by authorized execution outside the sandbox.
- Next development process started on localhost:3000. Initial sandbox listen EPERM was resolved by authorized local startup.
- HTTP: home, Create, My Purchases, public list, public detail and content page returned 200. Session and anonymous source returned 401 UNAUTHENTICATED. No source fields in public project payloads. OpenAPI mentions the private article input field by name; this is schema documentation, not a source-data leak.
- `/api/auth/nonce` returned 503 SERVICE_UNAVAILABLE because development Supabase credentials were absent. Readiness smoke must report this as a failure; no DB connectivity or migration success is claimed.
- Chrome headless rendered home/Create and the real preview component fixture. Sandbox/referrer/denied permissions and the external fallback were inspected. A fixture is not a persisted marketplace project. A separate cross-frame read probe produced no result and is inconclusive; no parent-cookie/provider attack test PASS is claimed. An initial fixture insertion into the hydrated root caused test-harness errors; repeating with a separate document had no runtime exceptions. Browser wallet signing and paid-source access with real persistence remain unverified.

## Limits

No `.env.local`, Supabase environment configuration, Docker, Supabase CLI or psql was available. Database migration/RLS/storage behavior has code review and adapter tests, but needs validation against the user's identified development database. No service credentials were fabricated, no auth bypass was added, no blockchain transaction or deployment was performed.

Production CSP preserves inline hydration and broad HTTPS/WSS connector destinations. Full browser connector compatibility and strict nonce CSP are not claimed. Lifetime purchases are permanent; explicitly selected subscriptions retain expiring membership access. Signed URLs remain valid for ten minutes after logout. Renewal payments are not a full accounting ledger.

Dependency audit removed only `@openzeppelin/contracts`: neither local Solidity contract imports it, and scripts/configuration do not consume it. pnpm regenerated only its importer/package/snapshot entries. The first offline reinstall failed with ERR_PNPM_NO_OFFLINE_META for @next/env; registry access was then requested without disabling supply-chain policies.

Final verification after dependency removal: forced Hardhat compilation and 33 tests PASS; marketplace/auth/UI 64 tests PASS; application and contract typechecks PASS; lint PASS with 81 warnings; production build PASS; diff whitespace check PASS; heuristic secret scan of tracked/unignored text files found no candidate credentials. Frozen-lockfile reinstall PASS after registry access.

Both development and production servers started and responded. Production CSP excludes unsafe-eval and HTTP frames. `corepack pnpm smoke:web` passed eight route checks and failed only `/api/health` with HTTP 503 because Supabase is unconfigured. The bare production `next start` also reported APP_ORIGIN must be configured for nonce issuance; development had APP_ORIGIN supplied and reached the missing-Supabase check. All temporary Next and Chrome processes were stopped. No commit or push was made.

## Supabase development runtime follow-up

After `.env.local` was populated, the real Supabase REST endpoint responded successfully. Its schema cache currently exposes only `publications` and `users`; `wallet_sessions`, `wallet_challenges`, `purchases` and `source_artifacts` returned 404. The current public publication endpoint therefore reads real existing publication data, while `/api/health` returns 503 and `/api/auth/nonce` returns 503 until the marketplace/auth migrations are applied. No rows were inserted, updated or deleted in the shared database.

The Supabase server adapter now accepts only `SUPABASE_SERVICE_ROLE_KEY`; public anon keys are confined to the browser client. A production-like process check found no `SUPABASE_SERVICE_ROLE_KEY` reference in `.next/static`. The provided `.env.local` does not include `APP_ORIGIN`; the SIWE runtime requires `APP_ORIGIN=http://localhost:3000` to be supplied in the process or added by the project owner before login can operate.
