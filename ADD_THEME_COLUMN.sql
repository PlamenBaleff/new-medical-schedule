-- Adds cross-device theme persistence fields
-- Run this once in Supabase SQL Editor (safe to re-run)

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Optional: backfill nulls (if any) to default
UPDATE doctors SET theme = 'light' WHERE theme IS NULL;
UPDATE patients SET theme = 'light' WHERE theme IS NULL;
