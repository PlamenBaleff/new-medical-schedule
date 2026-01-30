-- ===================================================
-- MEDICAL SCHEDULE DATABASE SETUP
-- ===================================================
-- Copy and paste each section into Supabase SQL Editor
-- Execute them one by one

-- ===================================================
-- 1. DROP EXISTING TABLES (if needed)
-- ===================================================
-- Uncomment if you want to reset the database
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS doctors CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;


-- ===================================================
-- 2. CREATE DOCTORS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  email TEXT UNIQUE NOT NULL,
  work_hours_from TIME DEFAULT '08:00',
  work_hours_to TIME DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);


-- ===================================================
-- 3. CREATE PATIENTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);


-- ===================================================
-- 4. CREATE APPOINTMENTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  complaints TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);


-- ===================================================
-- 5. CREATE ADMINS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Administrator',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);


-- ===================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================================

-- DOCTORS TABLE RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to doctors
CREATE POLICY "Allow public read access to doctors"
ON doctors FOR SELECT
TO public
USING (true);

-- Policy: Allow doctors to update their own records
CREATE POLICY "Allow doctors to update own records"
ON doctors FOR UPDATE
TO authenticated
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Policy: Allow authenticated users to insert doctors
CREATE POLICY "Allow authenticated users to insert doctors"
ON doctors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow admin to read all doctors
CREATE POLICY "Allow admin to read all doctors"
ON doctors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to update all doctors
CREATE POLICY "Allow admin to update all doctors"
ON doctors FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to delete doctors
CREATE POLICY "Allow admin to delete doctors"
ON doctors FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);


-- PATIENTS TABLE RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own patient data
CREATE POLICY "Allow users to read their own patient data"
ON patients FOR SELECT
TO authenticated
USING (auth.email() = email);

-- Policy: Allow patients to update their own records
CREATE POLICY "Allow patients to update own records"
ON patients FOR UPDATE
TO authenticated
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Policy: Allow authenticated users to insert patients
CREATE POLICY "Allow authenticated users to insert patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow admin to read all patients
CREATE POLICY "Allow admin to read all patients"
ON patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to update all patients
CREATE POLICY "Allow admin to update all patients"
ON patients FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to delete patients
CREATE POLICY "Allow admin to delete patients"
ON patients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);


-- APPOINTMENTS TABLE RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to appointments
CREATE POLICY "Allow public read access to appointments"
ON appointments FOR SELECT
TO public
USING (true);

-- Policy: Allow authenticated users to insert appointments
CREATE POLICY "Allow authenticated users to insert appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to update their own appointments
CREATE POLICY "Allow users to update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients WHERE patients.id = appointments.patient_id AND patients.email = auth.email()
  )
  OR
  EXISTS (
    SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.email = auth.email()
  )
);

-- Policy: Allow admin to read all appointments
CREATE POLICY "Allow admin to read all appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to update all appointments
CREATE POLICY "Allow admin to update all appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);

-- Policy: Allow admin to delete appointments
CREATE POLICY "Allow admin to delete appointments"
ON appointments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.email() AND admins.is_active = true
  )
);


-- ADMINS TABLE RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admin to read admin records
CREATE POLICY "Allow admin to read admin records"
ON admins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.email = auth.email() AND a.is_active = true
  )
);

-- Policy: Only allow admin to update admin records
CREATE POLICY "Allow admin to update admin records"
ON admins FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.email = auth.email() AND a.is_active = true
  )
);


-- ===================================================
-- 7. INSERT DEMO DATA (OPTIONAL)
-- ===================================================

-- Insert demo doctors
INSERT INTO doctors (name, specialty, email, work_hours_from, work_hours_to)
VALUES 
  ('Д-р Иван Петров', 'Кардиолог', 'ivan.petrov@example.com', '09:00', '17:00'),
  ('Д-р Мария Димитрова', 'Дерматолог', 'maria.dimitrova@example.com', '08:00', '16:00'),
  ('Д-р Георги Стоянов', 'Хирург', 'georgi.stoyanov@example.com', '10:00', '18:00')
ON CONFLICT (email) DO NOTHING;

-- ===================================================
-- 8. INSERT ADMIN USER
-- ===================================================
-- NOTE: You must create the admin user first in Supabase Auth
-- Then run this command to add admin rights
INSERT INTO admins (email, name, is_active)
VALUES ('ufopjb@abv.bg', 'Administrator', true)
ON CONFLICT (email) DO NOTHING;

-- ===================================================
-- END OF DATABASE SETUP
-- ===================================================
