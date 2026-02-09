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
  phone TEXT,
  address TEXT,
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

-- Privacy: appointment details must be visible only to admins and the specific doctor.
-- Do NOT allow public read access to appointments.

-- Policy: Allow doctors to read their own appointments
CREATE POLICY "Allow doctors to read own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.id = appointments.doctor_id
      AND doctors.email = auth.email()
  )
);

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

-- Insert demo doctors (EXISTING)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES 
  ('Д-р Иван Петров', 'Кардиолог', 'ivan.petrov@example.com', '+359 2 123 4567', 'ул. Брегалница 25, София', '09:00', '17:00'),
  ('Д-р Мария Димитрова', 'Дерматолог', 'maria.dimitrova@example.com', '+359 2 234 5678', 'ул. Васил Левски 15, Пловдив', '08:00', '16:00'),
  ('Д-р Георги Стоянов', 'Хирург', 'georgi.stoyanov@example.com', '+359 2 345 6789', 'ул. Лайош Кошут 8, Варна', '10:00', '18:00'),
  
  -- NEW DOCTORS (10 different specialties)
  ('Д-р Елена Николова', 'Педиатър', 'elena.nikolova@example.com', '+359 2 456 7890', 'ул. Парамонов 12, София', '08:00', '16:30'),
  ('Д-р Атанас Минчев', 'Ортопед', 'atanas.minchev@example.com', '+359 2 567 8901', 'ул. Райчо Крумов 20, Варна', '09:00', '17:30'),
  ('Д-р Валентина Петрова', 'Невролог', 'valentina.petrova@example.com', '+359 2 678 9012', 'ул. Даймо Йоцев 7, Бургас', '08:30', '17:00'),
  ('Д-р Младен Стефанов', 'Офталмолог', 'mladen.stefanov@example.com', '+359 2 789 0123', 'ул. Трайчо Китанов 18, Пловдив', '09:00', '17:00'),
  ('Д-р Мирослава Захариева', 'Ендокринолог', 'miroslava.zaharieva@example.com', '+359 2 890 1234', 'ул. Миланов 3, Варна', '08:00', '16:00'),
  ('Д-р Светослав Тодоров', 'Гастроентеролог', 'svetoslav.todorov@example.com', '+359 2 901 2345', 'ул. Героев на Искър 22, София', '08:30', '17:30'),
  ('Д-р Розалина Борисова', 'Уролог', 'rozalina.borisova@example.com', '+359 2 012 3456', 'ул. Чито Петров 11, Пловдив', '09:00', '17:00'),
  ('Д-р Иванка Стойчева', 'Пулмолог', 'ivanka.stoycheva@example.com', '+359 2 123 0987', 'ул. Яворов 6, Варна', '08:00', '16:30'),
  ('Д-р Никола Павлов', 'Психиатър', 'nikola.pavlov@example.com', '+359 2 234 1098', 'ул. Люлин 14, София', '09:30', '18:00')
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
