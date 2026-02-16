-- Remove policy added for doctor access to patient data
-- Run this in Supabase Dashboard  SQL editor

DROP POLICY IF EXISTS "Allow doctors to read patients for own appointments" ON public.patients;
