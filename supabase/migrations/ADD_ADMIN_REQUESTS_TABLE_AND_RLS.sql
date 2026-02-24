-- ===================================================
-- ADMIN REQUESTS: table + RLS policies
-- ===================================================
-- This migration adds the `admin_requests` workflow used by the app.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Basic constraints (idempotent where possible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_requests_status_check'
  ) THEN
    ALTER TABLE admin_requests
      ADD CONSTRAINT admin_requests_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_requested_at ON admin_requests(requested_at);

ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Doctors can see only their own requests (by email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_requests'
      AND policyname = 'Allow doctors to read own admin requests'
  ) THEN
    CREATE POLICY "Allow doctors to read own admin requests"
    ON admin_requests FOR SELECT
    TO authenticated
    USING (auth.email() = email);
  END IF;
END $$;

-- Doctors can submit their own request only if they have a doctor profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_requests'
      AND policyname = 'Allow doctors to insert own admin request'
  ) THEN
    CREATE POLICY "Allow doctors to insert own admin request"
    ON admin_requests FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.email() = email
      AND status = 'pending'
      AND EXISTS (
        SELECT 1
        FROM doctors d
        WHERE d.id = admin_requests.doctor_id
          AND d.email = auth.email()
      )
    );
  END IF;
END $$;

-- Admins can read all requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_requests'
      AND policyname = 'Allow admin to read all admin requests'
  ) THEN
    CREATE POLICY "Allow admin to read all admin requests"
    ON admin_requests FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admins
        WHERE admins.email = auth.email() AND admins.is_active = true
      )
    );
  END IF;
END $$;

-- Admins can update (approve/reject) requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_requests'
      AND policyname = 'Allow admin to update admin requests'
  ) THEN
    CREATE POLICY "Allow admin to update admin requests"
    ON admin_requests FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admins
        WHERE admins.email = auth.email() AND admins.is_active = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM admins
        WHERE admins.email = auth.email() AND admins.is_active = true
      )
    );
  END IF;
END $$;

-- ===================================================
-- End
-- ===================================================
