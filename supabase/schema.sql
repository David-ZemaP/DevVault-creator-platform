-- DevVault Supabase Baseline Schema (v1.0 Canonical)
-- Single source of truth for the complete application database.

BEGIN;

-- 1. Clean Reset (Drops existing application tables if present)
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS wallet_sessions CASCADE;
DROP TABLE IF EXISTS wallet_challenges CASCADE;
DROP TABLE IF EXISTS source_artifacts CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Users Table
CREATE TABLE users (
  wallet TEXT PRIMARY KEY,
  username TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Publications Table
CREATE TABLE publications (
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
  project_type TEXT NOT NULL DEFAULT 'article', -- 'article' | 'software'
  repository_url TEXT,
  zip_url TEXT,
  demo_url TEXT,
  demo_preview_code TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  price_wei TEXT CHECK (price_wei ~ '^[0-9]+$'),
  demo_video_url TEXT,
  cover_image TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Source Artifacts (Private software bundle metadata)
CREATE TABLE source_artifacts (
  project_id TEXT PRIMARY KEY REFERENCES publications(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Wallet Authentication & Challenges
CREATE TABLE wallet_challenges (
  token_hash TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE wallet_sessions (
  token_hash TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Purchases Ledger
CREATE TABLE purchases (
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

-- 7. Indexes for Query Performance
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_publications_creator_wallet ON publications(creator_wallet);
CREATE INDEX idx_publications_created_at ON publications(created_at DESC);
CREATE INDEX idx_publications_content_hash ON publications(content_hash);
CREATE INDEX idx_purchases_seller ON purchases(seller_wallet, purchased_at DESC);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_wallet, purchased_at DESC);

-- 8. Row Level Security & Service Role Isolation
-- Direct client access via anon/authenticated keys is revoked.
-- All operations are performed server-side using service_role credentials.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON users, publications, source_artifacts, wallet_challenges, wallet_sessions, purchases FROM anon, authenticated;
GRANT ALL ON users, publications, source_artifacts, wallet_challenges, wallet_sessions, purchases TO service_role;

-- 9. Private Storage Bucket for Source Code Artifacts
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('source-artifacts', 'source-artifacts', false, 20971520, ARRAY['application/zip'])
ON CONFLICT(id) DO UPDATE SET public = false, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/zip'];

-- Restrictive storage policies to isolate source zip files from anon and authenticated clients
DROP POLICY IF EXISTS source_private_select ON storage.objects;
CREATE POLICY source_private_select ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated USING(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_insert ON storage.objects;
CREATE POLICY source_private_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_update ON storage.objects;
CREATE POLICY source_private_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING(bucket_id <> 'source-artifacts') WITH CHECK(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_delete ON storage.objects;
CREATE POLICY source_private_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated USING(bucket_id <> 'source-artifacts');

COMMIT;
