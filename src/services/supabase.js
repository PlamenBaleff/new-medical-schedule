// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

// Supabase credentials MUST come from Vite env vars.
// In Netlify these are configured in: Site settings → Environment variables.
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const looksLikeSupabaseUrl = (value) => {
  if (!value) return false
  // Accept https://<ref>.supabase.co (with optional trailing slash)
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value)
}

const looksLikeAnonKey = (value) => {
  if (!value) return false
  // Supabase anon keys are JWT-like strings (typically start with eyJ)
  return value.length > 50 && value.startsWith('eyJ')
}

export const SUPABASE_URL = looksLikeSupabaseUrl(rawUrl) ? rawUrl.replace(/\/$/, '') : 'https://placeholder.supabase.co'
export const SUPABASE_ANON_KEY = looksLikeAnonKey(rawAnonKey) ? rawAnonKey : 'placeholder-key'

export const IS_SUPABASE_CONFIGURED = looksLikeSupabaseUrl(rawUrl) && looksLikeAnonKey(rawAnonKey)

export const SUPABASE_CONFIG_PROBLEM = (() => {
  if (IS_SUPABASE_CONFIGURED) return null
  if (!rawUrl) return 'Missing VITE_SUPABASE_URL'
  if (!looksLikeSupabaseUrl(rawUrl)) return 'Invalid VITE_SUPABASE_URL (expected: https://<project-ref>.supabase.co)'
  if (!rawAnonKey) return 'Missing VITE_SUPABASE_ANON_KEY'
  if (!looksLikeAnonKey(rawAnonKey)) return 'Invalid VITE_SUPABASE_ANON_KEY (expected: anon public key starting with eyJ...)'
  return 'Supabase env vars are not configured correctly'
})()

export let SUPABASE_INIT_ERROR = null

if (!IS_SUPABASE_CONFIGURED && import.meta.env.DEV) {
  console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (local) or in your hosting provider env vars.')
}

export let supabase
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} catch (error) {
  SUPABASE_INIT_ERROR = error
  console.error('Supabase client init failed:', error)
  // Keep app running; auth/data calls will be blocked by IS_SUPABASE_READY checks.
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export const IS_SUPABASE_READY = IS_SUPABASE_CONFIGURED && !SUPABASE_INIT_ERROR

// Database Schema Setup Instructions
/*
Create the following tables in your Supabase database:

1. doctors table:
CREATE TABLE doctors (
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

2. patients table:
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

3. appointments table:
CREATE TABLE appointments (
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

Enable Row Level Security (RLS) policies:
- Allow public read access to doctors table
- Allow authenticated users to read/write their own records
*/

// Търсене по email за admins, doctors, patients
export async function getAdminByEmail(email) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, name, is_active, created_at')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDoctorByEmail(email) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPatientByEmail(email) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, email, created_at')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Helper functions for database operations

export async function getDoctors() {
  const { data, error } = await supabase
     .from('doctors')
  .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getDoctor(id) {
  const { data, error } = await supabase
     .from('doctors')
  .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createDoctor(doctorData) {
  const { data, error } = await supabase
     .from('doctors')
     .insert([doctorData])
  .select('*')
  
  if (error) throw error
  return data[0]
}

export async function getPatient(id) {
  const { data, error } = await supabase
     .from('patients')
     .select('id, name, phone, email, created_at')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createPatient(patientData) {
  const { data, error } = await supabase
     .from('patients')
     .insert([patientData])
     .select('id, name, phone, email, created_at')
  
  if (error) throw error
  return data[0]
}

export async function getDoctorAppointments(doctorId, fromDate = null) {
  let query = supabase
     .from('appointments')
     .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at, patients(id, name, phone, email, created_at)')
    .eq('doctor_id', doctorId)
    .order('appointment_date')
    .order('appointment_time')
  
  if (fromDate) {
    query = query.gte('appointment_date', fromDate)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function getPatientAppointments(patientId) {
  const { data, error } = await supabase
     .from('appointments')
  .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at, doctors(*)')
    .eq('patient_id', patientId)
    .order('appointment_date')
    .order('appointment_time')
  
  if (error) throw error
  return data
}

export async function createAppointment(appointmentData) {
  const { data, error } = await supabase
     .from('appointments')
     .insert([appointmentData])
     .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at')
  
  if (error) throw error
  return data[0]
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data, error } = await supabase
     .from('appointments')
     .update({ status })
     .eq('id', appointmentId)
     .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at')
  
  if (error) throw error
  return data[0]
}

export async function deleteAppointment(appointmentId) {
  const { error } = await supabase
     .from('appointments')
     .delete()
     .eq('id', appointmentId)
  
  if (error) throw error
}

// Update functions
export async function updateDoctor(email, doctorData) {
  const { data, error } = await supabase
    .from('doctors')
    .update(doctorData)
    .eq('email', email)
    .select('*')
  
  if (error) throw error
  return data[0]
}

export async function updatePatient(email, patientData) {
  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('email', email)
    .select('id, name, phone, email, created_at')
  
  if (error) throw error
  return data[0]
}
