BEGIN;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED'));
ALTER TABLE publications ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE publications ADD COLUMN IF NOT EXISTS price_wei TEXT CHECK (price_wei ~ '^[0-9]+$');
ALTER TABLE publications ADD COLUMN IF NOT EXISTS demo_video_url TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS cover_image TEXT;
-- Existing software requires a private upload and explicit publication. Preserve article visibility.
UPDATE publications SET status = 'PUBLISHED' WHERE project_type = 'article' AND NOT is_hidden AND published_at IS NULL;
-- Public database credentials must not bypass the server projection/authentication.
REVOKE ALL ON publications, users FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS source_artifacts (
  project_id TEXT PRIMARY KEY REFERENCES publications(id),
  object_key TEXT NOT NULL UNIQUE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS wallet_challenges (
  token_hash TEXT PRIMARY KEY, wallet TEXT NOT NULL, message TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS wallet_sessions (
  token_hash TEXT PRIMARY KEY, wallet TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
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
  UNIQUE(project_id, buyer_wallet), UNIQUE(chain_id, transaction_hash)
);
CREATE INDEX IF NOT EXISTS purchases_seller ON purchases(seller_wallet, purchased_at DESC);
ALTER TABLE source_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON source_artifacts, wallet_challenges, wallet_sessions, purchases FROM anon, authenticated;
GRANT ALL ON source_artifacts, wallet_challenges, wallet_sessions, purchases TO service_role;
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('source-artifacts', 'source-artifacts', false, 20971520, ARRAY['application/zip'])
ON CONFLICT(id) DO UPDATE SET public = false, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/zip'];
-- Restrictive policies also deny access if another permissive storage policy exists.
DROP POLICY IF EXISTS source_private_select ON storage.objects;
CREATE POLICY source_private_select ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated USING(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_insert ON storage.objects;
CREATE POLICY source_private_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_update ON storage.objects;
CREATE POLICY source_private_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING(bucket_id <> 'source-artifacts') WITH CHECK(bucket_id <> 'source-artifacts');

DROP POLICY IF EXISTS source_private_delete ON storage.objects;
CREATE POLICY source_private_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated USING(bucket_id <> 'source-artifacts');
COMMIT;
