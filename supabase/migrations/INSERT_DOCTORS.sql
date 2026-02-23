-- ===================================================
-- ADD NEW 10 DOCTORS WITH COMPLETE BIOGRAPHY DATA
-- ===================================================
-- This script adds 10 new doctors from different specialties
-- The original 3 doctors are also kept in the system

-- NOTE: Copy and paste this into Supabase SQL Editor and execute

-- ===================================================
-- NEW DOCTORS DATA
-- ===================================================

-- 1. Pediatrician (Педиатър)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Елена Николова',
  'Педиатър',
  'elena.nikolova@example.com',
  '+359 2 456 7890',
  'ул. Парамонов 12, С. ет. 5, София 1504',
  '08:00',
  '16:30'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Orthopedic Surgeon (Ортопед)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Атанас Минчев',
  'Ортопед',
  'atanas.minchev@example.com',
  '+359 2 567 8901',
  'ул. Райчо Крумов 20, Варна 9000',
  '09:00',
  '17:30'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Neurologist (Невролог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Валентина Петрова',
  'Невролог',
  'valentina.petrova@example.com',
  '+359 2 678 9012',
  'ул. Даймо Йоцев 7, кв. 12, Бургас 8000',
  '08:30',
  '17:00'
)
ON CONFLICT (email) DO NOTHING;

-- 4. Ophthalmologist (Офталмолог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Младен Стефанов',
  'Офталмолог',
  'mladen.stefanov@example.com',
  '+359 2 789 0123',
  'ул. Трайчо Китанов 18, Пловдив 4000',
  '09:00',
  '17:00'
)
ON CONFLICT (email) DO NOTHING;

-- 5. Endocrinologist (Ендокринолог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Мирослава Захариева',
  'Ендокринолог',
  'miroslava.zaharieva@example.com',
  '+359 2 890 1234',
  'ул. Миланов 3, кв. 8, Варна 9000',
  '08:00',
  '16:00'
)
ON CONFLICT (email) DO NOTHING;

-- 6. Gastroenterologist (Гастроентеролог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Светослав Тодоров',
  'Гастроентеролог',
  'svetoslav.todorov@example.com',
  '+359 2 901 2345',
  'ул. Героев на Искър 22, пл. 1, София 1502',
  '08:30',
  '17:30'
)
ON CONFLICT (email) DO NOTHING;

-- 7. Urologist (Уролог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Розалина Борисова',
  'Уролог',
  'rozalina.borisova@example.com',
  '+359 2 012 3456',
  'ул. Чито Петров 11, Пловдив 4001',
  '09:00',
  '17:00'
)
ON CONFLICT (email) DO NOTHING;

-- 8. Pulmonologist (Пулмолог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Иванка Стойчева',
  'Пулмолог',
  'ivanka.stoycheva@example.com',
  '+359 2 123 0987',
  'ул. Яворов 6, кв. 24, Варна 9002',
  '08:00',
  '16:30'
)
ON CONFLICT (email) DO NOTHING;

-- 9. Psychiatrist (Психиатър)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Никола Павлов',
  'Психиатър',
  'nikola.pavlov@example.com',
  '+359 2 234 1098',
  'ул. Люлин 14, кв. 5, София 1503',
  '09:30',
  '18:00'
)
ON CONFLICT (email) DO NOTHING;

-- 10. Rheumatologist (Ревматолог)
INSERT INTO doctors (name, specialty, email, phone, address, work_hours_from, work_hours_to)
VALUES (
  'Д-р Стефан Василев',
  'Ревматолог',
  'stefan.vasilev@example.com',
  '+359 2 345 2109',
  'ул. Бачо Киро 9, кв. 3, Варна 9001',
  '08:30',
  '17:00'
)
ON CONFLICT (email) DO NOTHING;

-- ===================================================
-- VERIFY INSERTION
-- ===================================================
-- Run this query to verify all doctors were added:
SELECT COUNT(*) as total_doctors, COUNT(DISTINCT specialty) as unique_specialties FROM doctors;

-- To see all doctors with their details:
SELECT name, specialty, email, phone, address, work_hours_from, work_hours_to FROM doctors ORDER BY specialty, name;

-- ===================================================
-- DOCTOR SPECIALTIES ADDED:
-- ===================================================
-- 1. Педиатър (Pediatrician) - Елена Николова
-- 2. Ортопед (Orthopedic Surgeon) - Атанас Минчев
-- 3. Невролог (Neurologist) - Валентина Петрова
-- 4. Офталмолог (Ophthalmologist) - Младен Стефанов
-- 5. Ендокринолог (Endocrinologist) - Мирослава Захариева
-- 6. Гастроентеролог (Gastroenterologist) - Светослав Тодоров
-- 7. Уролог (Urologist) - Розалина Борисова
-- 8. Пулмолог (Pulmonologist) - Иванка Стойчева
-- 9. Психиатър (Psychiatrist) - Никола Павлов
-- 10. Ревматолог (Rheumatologist) - Стефан Василев
--
-- EXISTING DOCTORS (kept unchanged):
-- 1. Кардиолог (Cardiologist) - Иван Петров
-- 2. Дерматолог (Dermatologist) - Мария Димитрова
-- 3. Хирург (Surgeon) - Георги Стоянов
-- ===================================================
