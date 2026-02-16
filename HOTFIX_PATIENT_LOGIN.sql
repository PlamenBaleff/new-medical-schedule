-- HOTFIX: restore minimum policies required for patient login/profile and doctor schedule visibility
-- Run in Supabase SQL Editor

-- Patients: user can read own profile
DROP POLICY IF EXISTS "Allow users to read their own patient data" ON public.patients;
CREATE POLICY "Allow users to read their own patient data"
ON public.patients
FOR SELECT
TO authenticated
USING (lower(public.patients.email) = lower(auth.email()));

-- Patients: allow authenticated inserts (registration/profile creation)
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON public.patients;
CREATE POLICY "Allow authenticated users to insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Patients: allow user update own profile
DROP POLICY IF EXISTS "Allow patients to update own records" ON public.patients;
CREATE POLICY "Allow patients to update own records"
ON public.patients
FOR UPDATE
TO authenticated
USING (lower(public.patients.email) = lower(auth.email()))
WITH CHECK (lower(public.patients.email) = lower(auth.email()));

-- Doctors can read patients only for their own appointments
DROP POLICY IF EXISTS "Allow doctors to read patients for own appointments" ON public.patients;
CREATE POLICY "Allow doctors to read patients for own appointments"
ON public.patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = public.patients.id
      AND lower(d.email) = lower(auth.email())
  )
);

-- Appointments: doctor can read own appointments
DROP POLICY IF EXISTS "Allow doctors to read own appointments" ON public.appointments;
CREATE POLICY "Allow doctors to read own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE public.doctors.id = public.appointments.doctor_id
      AND lower(public.doctors.email) = lower(auth.email())
  )
);

-- Appointments: admin can read all appointments
DROP POLICY IF EXISTS "Allow admin to read all appointments" ON public.appointments;
CREATE POLICY "Allow admin to read all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admins
    WHERE lower(public.admins.email) = lower(auth.email())
      AND public.admins.is_active = true
  )
);
