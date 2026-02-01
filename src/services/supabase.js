// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

// TODO: Add your Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmYWhlcWxjeXJ1a2VoeG9kdGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTg3MTcsImV4cCI6MjA4NTI3NDcxN30.bUlR8_4uQmrXz1pEGLdoP-n25x2MhDIY_P4VJpCa4pQ";

// Debug logging
console.log('=== SUPABASE DEBUG ===')
console.log('VITE_SUPABASE_URL:', SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET')
console.log('=====================')

// Check if Supabase is configured
const isConfigured = SUPABASE_URL !== 'https://placeholder.supabase.co' && 
                     SUPABASE_ANON_KEY !== 'placeholder-key'

if (!isConfigured) {
  console.warn('⚠️ Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
  console.warn('📖 See DATABASE_SETUP.md for instructions.')
} else {
  console.log('✅ Supabase is configured correctly')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
