-- EMERGENCY ROLLBACK: Remove problematic RLS policies and restore minimal working setup
-- Run in Supabase SQL Editor immediately

-- 1) DROP all problematic patient policies
DROP POLICY IF EXISTS "Allow users to read their own patient data" ON public.patients;
DROP POLICY IF EXISTS "Allow patients to update own records" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow admin to read all patients" ON public.patients;
DROP POLICY IF EXISTS "Allow doctors to read patients for own appointments" ON public.patients;
DROP POLICY IF EXISTS "Allow admin to update all patients" ON public.patients;
DROP POLICY IF EXISTS "Allow admin to delete patients" ON public.patients;

-- 2) DROP all problematic appointment policies
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow doctors to read own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow users to update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow admin to read all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow admin to update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow admin to delete appointments" ON public.appointments;

-- 3) RESTORE MINIMAL PATIENT POLICIES (no complex joins)

-- Let patients read their own profile (simple email match, no subqueries)
CREATE POLICY "Allow users to read their own patient data"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.email() = email);

-- Let patients update their own profile
CREATE POLICY "Allow patients to update own records"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Let authenticated users insert patient records
CREATE POLICY "Allow authenticated users to insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin can read all patients
CREATE POLICY "Allow admin to read all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE public.admins.email = auth.email() 
      AND public.admins.is_active = true
  )
);

-- Allow authenticated users to read patient names (for display in appointments)
CREATE POLICY "Allow authenticated to read patient names"
ON public.patients
FOR SELECT
TO authenticated
USING (true);

-- 4) RESTORE MINIMAL APPOINTMENT POLICIES (no nested patient joins)

-- Doctors can read their own appointments (without nested patient info)
CREATE POLICY "Allow doctors to read own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE public.doctors.id = public.appointments.doctor_id
      AND public.doctors.email = auth.email()
  )
);

-- Authenticated users can insert appointments
CREATE POLICY "Allow authenticated users to insert appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin can read all appointments
CREATE POLICY "Allow admin to read all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE public.admins.email = auth.email() 
      AND public.admins.is_active = true
  )
);

-- Users and doctors can update their own appointments
CREATE POLICY "Allow users to update their own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients 
    WHERE public.patients.id = public.appointments.patient_id 
      AND public.patients.email = auth.email()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE public.doctors.id = public.appointments.doctor_id 
      AND public.doctors.email = auth.email()
  )
)
WITH CHECK (true);

-- Admin can delete appointments
CREATE POLICY "Allow admin to delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE public.admins.email = auth.email() 
      AND public.admins.is_active = true
  )
);
