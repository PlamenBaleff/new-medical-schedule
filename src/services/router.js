// Router for page navigation using History API
import HomePage from '../pages/home.js'
import AuthPage from '../pages/auth.js'
import SchedulePage from '../pages/schedule.js'
import DoctorsPage from '../pages/doctors.js'
import SettingsPage from '../pages/settings.js'

const routes = {
  '/': { page: AuthPage, title: 'Вход / Регистрация', navId: 'nav-auth' },
  '/auth': { page: AuthPage, title: 'Вход / Регистрация', navId: 'nav-auth' },
  '/home': { page: HomePage, title: 'Home', navId: 'nav-home' },
  '/schedule': { page: SchedulePage, title: 'Schedule', navId: 'nav-schedule' },
  '/doctors': { page: DoctorsPage, title: 'Doctors', navId: 'nav-doctors' },
  '/settings': { page: SettingsPage, title: 'Settings', navId: 'nav-settings' }
}

const app = document.getElementById('app')

export function initRouter() {
  // Handle popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    navigate(window.location.pathname)
  })
  
  // Handle link clicks
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
      e.preventDefault()
      const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]')
      navigateTo(link.getAttribute('href'))
    }
  })
  
  // Initial navigation
  navigate(window.location.pathname)
}

export function navigateTo(path) {
  window.history.pushState({}, '', path)
  navigate(path)
}

export function navigate(path = window.location.pathname) {
  const route = routes[path] || routes['/auth']
  
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
  if (route.navId) {
    document.getElementById(route.navId)?.classList.add('active')
  }
}
