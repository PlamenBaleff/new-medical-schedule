// Router for page navigation
import HomePage from '../pages/home.js'
import AuthPage from '../pages/auth.js'
import SchedulePage from '../pages/schedule.js'
import DoctorsPage from '../pages/doctors.js'
import SettingsPage from '../pages/settings.js'

const routes = {
  auth: { page: AuthPage, title: 'Вход / Регистрация' },
  home: { page: HomePage, title: 'Home' },
  schedule: { page: SchedulePage, title: 'Schedule' },
  doctors: { page: DoctorsPage, title: 'Doctors' },
  settings: { page: SettingsPage, title: 'Settings' }
}

const app = document.getElementById('app')

export function initRouter() {
  // Handle hash changes
  window.addEventListener('hashchange', navigate)
  
  // Navigate to auth by default
  if (!window.location.hash) {
    window.location.hash = '#auth'
  } else {
    navigate()
  }
}

export function navigate() {
  const hash = window.location.hash.slice(1) || 'auth'
  const route = routes[hash]
  
  if (!route) {
    window.location.hash = '#auth'
    return
  }
  
  // Clear app container
  app.innerHTML = ''
  
  // Update page title
  document.title = `${route.title} - Medical Schedule`
  
  // Render the page
  const pageContent = route.page()
  if (pageContent) {
    app.appendChild(pageContent)
  }
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active')
  })
  document.getElementById(`nav-${hash}`)?.classList.add('active')
}
