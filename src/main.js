// Main entry point for the application
import { initRouter } from './services/router.js'
import { initAuth } from './services/auth.js'
import { supabase, getDoctorByEmail, getPatientByEmail, IS_SUPABASE_READY } from './services/supabase.js'
import { loadAndApplyThemeForUser, saveThemeForUser } from './services/theme.js'

function applyDefaultThemeEarly() {
  // Apply last-saved theme immediately (fallback to default inside theme service)
  loadAndApplyThemeForUser(null)
}

async function syncThemeFromSupabaseProfile(sessionUser) {
  if (!sessionUser || !IS_SUPABASE_READY) return

  // 1) Prefer Supabase Auth user_metadata (cross-device, no DB dependency)
  const metaTheme = sessionUser?.user_metadata?.theme
  if (metaTheme) {
    saveThemeForUser(sessionUser, metaTheme)
    return
  }

  // 2) Fallback to profile tables (legacy/optional)
  const email = sessionUser.email
  if (!email) return

  try {
    const doctor = await getDoctorByEmail(email)
    const theme = doctor?.theme
    if (theme) {
      saveThemeForUser(sessionUser, theme)
      return
    }
  } catch {
    // ignore
  }

  try {
    const patient = await getPatientByEmail(email)
    const theme = patient?.theme
    if (theme) {
      saveThemeForUser(sessionUser, theme)
    }
  } catch {
    // ignore
  }
}

// Initialize the application
async function init() {
  try {
    // Apply default theme immediately (prevents unstyled flash)
    applyDefaultThemeEarly()
    
    // Initialize authentication
    await initAuth()

    // Load and apply theme for the current session user (per-profile)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      loadAndApplyThemeForUser(session?.user || null)
      // Cross-device sync (best-effort): prefer theme saved in Supabase profile
      syncThemeFromSupabaseProfile(session?.user || null)
    } catch {
      loadAndApplyThemeForUser(null)
    }

    // Keep theme in sync when user logs in/out
    supabase.auth.onAuthStateChange((_event, session) => {
      loadAndApplyThemeForUser(session?.user || null)
      syncThemeFromSupabaseProfile(session?.user || null)
    })
    
    // Initialize router for page navigation
    initRouter()
    
    console.log('Application initialized successfully')
  } catch (error) {
    console.error('Failed to initialize application:', error)
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
