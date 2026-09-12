-- DevVault-Creator_Platform Supabase Database Schema
-- Persona 4: Backend & Database Architect

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  wallet TEXT PRIMARY KEY,
  username TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Publications Table
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Optimal Performance
CREATE INDEX IF NOT EXISTS idx_publications_creator_wallet ON publications(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publications_content_hash ON publications(content_hash);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Public Read Access
CREATE POLICY "Allow public read on users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on publications"
  ON publications
  FOR SELECT
  USING (true);

-- 6. RLS Policies: Authenticated / Service / API Writes
CREATE POLICY "Allow insert on users"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update on users"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert on publications"
  ON publications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update on publications"
  ON publications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete on publications"
  ON publications
  FOR DELETE
  USING (true);
