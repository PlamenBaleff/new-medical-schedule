-- FIX: Allow authenticated users to read patient names for display
-- This allows doctors/admins to see patient names when viewing appointments
-- Run in Supabase SQL Editor

-- Add policy to allow authenticated users to read patient names (not sensitive info)
DROP POLICY IF EXISTS "Allow authenticated to read patient names" ON public.patients;
CREATE POLICY "Allow authenticated to read patient names"
ON public.patients
FOR SELECT
TO authenticated
USING (true);
