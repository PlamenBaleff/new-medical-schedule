export const THEME_DEFAULT = 'light'

function sanitizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function getThemeStorageKey(userId) {
  return `theme:user:${userId}`
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', sanitizeTheme(theme))
}

function migrateLegacyGlobalThemeToUser(userId) {
  if (!userId) return

  const legacy = localStorage.getItem('theme')
  if (!legacy) return

  const key = getThemeStorageKey(userId)
  const existing = localStorage.getItem(key)
  if (existing) {
    localStorage.removeItem('theme')
    return
  }

  localStorage.setItem(key, sanitizeTheme(legacy))
  localStorage.removeItem('theme')
}

export function getSavedThemeForUser(user) {
  const userId = user?.id
  if (!userId) return null

  migrateLegacyGlobalThemeToUser(userId)

  const key = getThemeStorageKey(userId)
  const value = localStorage.getItem(key)
  if (!value) return null
  return sanitizeTheme(value)
}

export function saveThemeForUser(user, theme) {
  const userId = user?.id
  const safeTheme = sanitizeTheme(theme)

  applyTheme(safeTheme)

  if (!userId) return
  const key = getThemeStorageKey(userId)
  localStorage.setItem(key, safeTheme)
}

export function loadAndApplyThemeForUser(user) {
  const saved = getSavedThemeForUser(user)
  const theme = saved || THEME_DEFAULT
  applyTheme(theme)
  return theme
}
