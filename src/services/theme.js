export const THEME_DEFAULT = 'light'

const THEME_LEGACY_GLOBAL_KEY = 'theme'
const THEME_LAST_KEY = 'theme:last'

function canUseLocalStorage() {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function cookieGet(key) {
  try {
    const encodedKey = encodeURIComponent(key) + '='
    const parts = (document.cookie || '').split(';')
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.startsWith(encodedKey)) {
        return decodeURIComponent(trimmed.slice(encodedKey.length))
      }
    }
    return null
  } catch {
    return null
  }
}

function cookieSet(key, value) {
  try {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:'
    const attrs = [`path=/`, `max-age=${60 * 60 * 24 * 365}`, `samesite=lax`]
    if (secure) attrs.push('secure')
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; ${attrs.join('; ')}`
  } catch {
    // ignore
  }
}

function cookieRemove(key) {
  try {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:'
    const attrs = [`path=/`, `max-age=0`, `samesite=lax`]
    if (secure) attrs.push('secure')
    document.cookie = `${encodeURIComponent(key)}=; ${attrs.join('; ')}`
  } catch {
    // ignore
  }
}

function storageGet(key) {
  if (canUseLocalStorage()) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) return value
    } catch {
      // fall back to cookie
    }
  }
  return cookieGet(key)
}

function storageSet(key, value) {
  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(key, value)
      return
    } catch {
      // fall back to cookie
    }
  }
  cookieSet(key, value)
}

function storageRemove(key) {
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
  cookieRemove(key)
}

function sanitizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function getThemeStorageKey(userId) {
  return `theme:user:${userId}`
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', sanitizeTheme(theme))
}

export function getLastSavedTheme() {
  const value = storageGet(THEME_LAST_KEY) || storageGet(THEME_LEGACY_GLOBAL_KEY)
  if (!value) return null
  return sanitizeTheme(value)
}

function setLastSavedTheme(theme) {
  storageSet(THEME_LAST_KEY, sanitizeTheme(theme))
}

function migrateLegacyGlobalThemeToUser(userId) {
  if (!userId) return

  const legacy = storageGet(THEME_LEGACY_GLOBAL_KEY)
  if (!legacy) return

  const key = getThemeStorageKey(userId)
  const existing = storageGet(key)
  if (existing) {
    storageRemove(THEME_LEGACY_GLOBAL_KEY)
    return
  }

  storageSet(key, sanitizeTheme(legacy))
  storageRemove(THEME_LEGACY_GLOBAL_KEY)
}

export function getSavedThemeForUser(user) {
  const userId = user?.id
  if (!userId) return null

  migrateLegacyGlobalThemeToUser(userId)

  const key = getThemeStorageKey(userId)
  const value = storageGet(key)
  if (!value) return null
  return sanitizeTheme(value)
}

export function saveThemeForUser(user, theme) {
  const userId = user?.id
  const safeTheme = sanitizeTheme(theme)

  applyTheme(safeTheme)
  setLastSavedTheme(safeTheme)

  if (!userId) return
  const key = getThemeStorageKey(userId)
  storageSet(key, safeTheme)
}

export function loadAndApplyThemeForUser(user) {
  const saved = getSavedThemeForUser(user)
  const last = getLastSavedTheme()
  const theme = saved || last || THEME_DEFAULT
  applyTheme(theme)
  return theme
}
