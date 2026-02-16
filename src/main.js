// Main entry point for the application
import { initRouter } from './services/router.js'
import { initAuth } from './services/auth.js'
import { supabase } from './services/supabase.js'
import { loadAndApplyThemeForUser, THEME_DEFAULT } from './services/theme.js'

function applyDefaultThemeEarly() {
  document.documentElement.setAttribute('data-theme', THEME_DEFAULT)
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
    } catch {
      loadAndApplyThemeForUser(null)
    }

    // Keep theme in sync when user logs in/out
    supabase.auth.onAuthStateChange((_event, session) => {
      loadAndApplyThemeForUser(session?.user || null)
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
