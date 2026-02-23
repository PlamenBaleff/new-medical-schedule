-- ===================================================
-- DOCTOR AVATARS (PROFILE PHOTOS) SETUP
-- ===================================================
-- Run this in Supabase SQL Editor.
-- Creates/updates:
-- - doctors.avatar_path + doctors.avatar_updated_at
-- - Storage bucket: doctor-avatars (public)
-- - RLS policies for storage.objects:
--   * Everyone can read avatars
--   * Only the owner (auth.uid) can insert/update/delete their own files

-- If you see:
--   ERROR: 42501: must be owner of table objects
-- it means your SQL session doesn't have ownership privileges over `storage.objects`.
-- In that case:
--   - Run ONLY sections (1) and (2) here
--   - Create the Storage policies via Dashboard:
--       Storage → doctor-avatars → Policies → New policy
--     (copy the policy expressions from section (3) below)

-- 1) Add columns to doctors table (safe to run multiple times)
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS avatar_path text;

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

-- 2) Ensure Storage bucket exists and is public
-- Note: this requires the Storage schema to be available in your Supabase project.
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-avatars', 'doctor-avatars', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    name = EXCLUDED.name;

-- 3) RLS policies for storage.objects

-- NOTE: Supabase Storage typically already has RLS enabled on `storage.objects`.
-- Some projects restrict altering/owning this table via SQL Editor.
-- We wrap the policy creation in a DO block so the script doesn't fail hard.

DO $do$
BEGIN
  -- Drop old policies (if re-running)
  EXECUTE 'DROP POLICY IF EXISTS "Public read doctor avatars" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Insert own doctor avatar" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Update own doctor avatar" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Delete own doctor avatar" ON storage.objects';

  -- Everyone (including anon) can read avatars
  EXECUTE $pol$
    CREATE POLICY "Public read doctor avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'doctor-avatars')
  $pol$;

  -- Only the authenticated owner can upload into their own folder: {auth.uid()}/...
  EXECUTE $pol$
    CREATE POLICY "Insert own doctor avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'doctor-avatars'
      AND owner = auth.uid()
      AND name LIKE (auth.uid()::text || '/%')
    )
  $pol$;

  -- Only the owner can update their own objects
  EXECUTE $pol$
    CREATE POLICY "Update own doctor avatar"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'doctor-avatars'
      AND owner = auth.uid()
      AND name LIKE (auth.uid()::text || '/%')
    )
    WITH CHECK (
      bucket_id = 'doctor-avatars'
      AND owner = auth.uid()
      AND name LIKE (auth.uid()::text || '/%')
    )
  $pol$;

  -- Only the owner can delete their own objects
  EXECUTE $pol$
    CREATE POLICY "Delete own doctor avatar"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'doctor-avatars'
      AND owner = auth.uid()
      AND name LIKE (auth.uid()::text || '/%')
    )
  $pol$;

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No privileges to manage storage.objects policies in SQL. Create policies via Dashboard: Storage → doctor-avatars → Policies.';
END;
$do$;
