-- Full idempotent migration — run this in the Supabase SQL editor to apply all
-- DevVault marketplace schema changes. Safe to re-run on an existing database.
BEGIN;

-- ────────────────────────────────────────────────────────────────
-- BASE TABLES (created by schema.sql if not already present)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  wallet TEXT PRIMARY KEY,
  username TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  creator_wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preview TEXT NOT NULL,
  premium_content TEXT,
  content_hash TEXT NOT NULL,
  lock_address TEXT,
  proof_id TEXT,
  avalanche_tx TEXT,
  version INT NOT NULL DEFAULT 1,
  project_type TEXT NOT NULL DEFAULT 'article',
  repository_url TEXT,
  zip_url TEXT,
  demo_url TEXT,
  demo_preview_code TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- MARKETPLACE COLUMNS (20260912_marketplace.sql)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE publications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT'
  CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED'));
ALTER TABLE publications ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE publications ADD COLUMN IF NOT EXISTS price_wei TEXT CHECK (price_wei ~ '^[0-9]+$');
ALTER TABLE publications ADD COLUMN IF NOT EXISTS demo_video_url TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- ACQUISITION MODEL (20260912_acquisition_model.sql)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS acquisition_model TEXT NOT NULL DEFAULT 'lifetime'
  CHECK (acquisition_model IN ('lifetime', 'subscription'));

-- ────────────────────────────────────────────────────────────────
-- AUTH TABLES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_challenges (
  token_hash TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_sessions (
  token_hash TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auth sessions migration (20260912_auth_sessions.sql)
ALTER TABLE wallet_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
UPDATE wallet_sessions SET created_at = NOW() WHERE created_at IS NULL;
ALTER TABLE wallet_sessions ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE wallet_sessions ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS wallet_sessions_expiry ON wallet_sessions(expires_at);
CREATE INDEX IF NOT EXISTS wallet_challenges_expiry ON wallet_challenges(expires_at);

-- ────────────────────────────────────────────────────────────────
-- SOURCE ARTIFACTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_artifacts (
  project_id TEXT PRIMARY KEY REFERENCES publications(id),
  object_key TEXT NOT NULL UNIQUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- PURCHASES / ENTITLEMENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES publications(id),
  buyer_wallet TEXT NOT NULL CHECK (buyer_wallet = lower(buyer_wallet)),
  seller_wallet TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'HSKChain Testnet',
  chain_id INTEGER NOT NULL CHECK (chain_id = 133),
  transaction_hash TEXT NOT NULL CHECK (transaction_hash = lower(transaction_hash)),
  payment_contract TEXT NOT NULL,
  amount TEXT NOT NULL CHECK (amount ~ '^[0-9]+$'),
  currency TEXT NOT NULL DEFAULT 'HSK',
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status = 'CONFIRMED'),
  confirmed_block BIGINT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, buyer_wallet),
  UNIQUE(chain_id, transaction_hash)
);

CREATE INDEX IF NOT EXISTS purchases_seller ON purchases(seller_wallet, purchased_at DESC);

-- ────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_publications_creator_wallet ON publications(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- RLS — lock down all tables so only service_role can read/write
-- ────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Revoke direct access from client roles; service_role always bypasses RLS.
REVOKE ALL ON users, publications FROM anon, authenticated;
REVOKE ALL ON source_artifacts, wallet_challenges, wallet_sessions, purchases FROM anon, authenticated;
GRANT ALL ON source_artifacts, wallet_challenges, wallet_sessions, purchases TO service_role;
GRANT ALL ON users, publications TO service_role;

-- ────────────────────────────────────────────────────────────────
-- STORAGE BUCKET
-- ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('source-artifacts', 'source-artifacts', false, 20971520, ARRAY['application/zip'])
ON CONFLICT(id) DO UPDATE SET public = false, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/zip'];

-- Restrictive policies deny bucket access from client roles.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'source_private_select') THEN
    EXECUTE 'CREATE POLICY source_private_select ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated USING(bucket_id <> ''source-artifacts'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'source_private_insert') THEN
    EXECUTE 'CREATE POLICY source_private_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK(bucket_id <> ''source-artifacts'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'source_private_update') THEN
    EXECUTE 'CREATE POLICY source_private_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING(bucket_id <> ''source-artifacts'') WITH CHECK(bucket_id <> ''source-artifacts'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'source_private_delete') THEN
    EXECUTE 'CREATE POLICY source_private_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated USING(bucket_id <> ''source-artifacts'')';
  END IF;
END $$;

COMMIT;
