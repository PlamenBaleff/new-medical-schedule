import { supabase } from './supabase.js'

const PENDING_PROFILE_KEY = 'pending_profile_v1'

export function savePendingProfile(profile) {
  try {
    localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.warn('Unable to save pending profile:', error)
  }
}

export function loadPendingProfile() {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Unable to read pending profile:', error)
    return null
  }
}

export function clearPendingProfile(email) {
  try {
    const pending = loadPendingProfile()
    if (!pending || !email || pending.email === email) {
      localStorage.removeItem(PENDING_PROFILE_KEY)
    }
  } catch (error) {
    console.warn('Unable to clear pending profile:', error)
  }
}

export async function ensureProfileForAuthUser(user) {
  if (!user?.email) return
  const email = user.email
  const pending = loadPendingProfile()

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (doctor) {
    if (pending?.email === email) clearPendingProfile(email)
    return
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (patient) {
    if (pending?.email === email) clearPendingProfile(email)
    return
  }

  if (!pending || pending.email !== email) return

  try {
    if (pending.user_type === 'doctor') {
      await supabase
        .from('doctors')
        .insert([pending.profile])
        .select('id')
    } else if (pending.user_type === 'patient') {
      await supabase
        .from('patients')
        .insert([pending.profile])
        .select('id')
    }
    clearPendingProfile(email)
  } catch (error) {
    console.warn('Pending profile migration failed:', error.message)
  }
}
