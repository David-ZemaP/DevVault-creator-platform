BEGIN;
-- Existing 24-hour sessions predate SIWE and must reauthenticate after this upgrade.
ALTER TABLE wallet_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
DELETE FROM wallet_sessions WHERE created_at IS NULL;
ALTER TABLE wallet_sessions ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE wallet_sessions ALTER COLUMN created_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_sessions_expiry ON wallet_sessions(expires_at);
CREATE INDEX IF NOT EXISTS wallet_challenges_expiry ON wallet_challenges(expires_at);
COMMIT;
