-- Fix appointment privacy: only admins + the specific doctor can read appointment details.
-- Also adds a safe RPC for everyone to check which slots are booked.
--
-- Run this in Supabase Dashboard → SQL editor.

-- 1) Remove public appointment read
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;

-- 2) Allow doctors to read only their own appointments
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

-- (Admin read policy is assumed to already exist; this is just a safety re-create.)
DROP POLICY IF EXISTS "Allow admin to read all appointments" ON public.appointments;
CREATE POLICY "Allow admin to read all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admins
    WHERE public.admins.email = auth.email()
      AND public.admins.is_active = true
  )
);

-- 2.05) Ensure patients can always read their own profile (login/profile stability)
DROP POLICY IF EXISTS "Allow users to read their own patient data" ON public.patients;
CREATE POLICY "Allow users to read their own patient data"
ON public.patients
FOR SELECT
TO authenticated
USING (lower(public.patients.email) = lower(auth.email()));

-- 2.1) Allow doctors to read patient names only for their own appointments
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

-- 3) Safe RPC to fetch only booked slots (no patient data)
CREATE OR REPLACE FUNCTION public.get_booked_slots(
  p_doctor_id uuid,
  p_start date,
  p_end date
)
RETURNS TABLE (
  appointment_date date,
  appointment_time time
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.appointment_date, a.appointment_time
  FROM public.appointments a
  WHERE a.doctor_id = p_doctor_id
    AND a.appointment_date BETWEEN p_start AND p_end
  ORDER BY a.appointment_date, a.appointment_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, date, date) TO anon, authenticated;
