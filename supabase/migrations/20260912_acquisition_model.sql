BEGIN;
-- The existing subscription UI already writes this field; fresh databases lacked it.
ALTER TABLE publications ADD COLUMN IF NOT EXISTS acquisition_model TEXT NOT NULL DEFAULT 'lifetime'
  CHECK (acquisition_model IN ('lifetime', 'subscription'));
COMMIT;
