// Main entry point for the application
import { initRouter } from './services/router.js'
import { initAuth } from './services/auth.js'

// Load theme preference
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light'
  document.documentElement.setAttribute('data-theme', savedTheme)
}

// Initialize the application
async function init() {
  try {
    // Load theme first
    loadTheme()
    
    // Initialize authentication
    await initAuth()
    
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
