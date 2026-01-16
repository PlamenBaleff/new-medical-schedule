// Authentication service
import { supabase } from './supabase.js'

let currentUser = null

export async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
  } catch (error) {
    console.error('Auth initialization error:', error)
  }
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  currentUser = data.user
  return data.user
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  currentUser = null
}

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) throw error
  return data.user
}

export function getCurrentUser() {
  return currentUser
}

export function isAuthenticated() {
  return currentUser !== null
}
