// Global Theme Manager for NETRA Frontend
let mediaQueryListener = null

export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

export function applyTheme(preference = 'Dark') {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme-pref', preference)

  const resolved = preference === 'System' || preference === 'system'
    ? getSystemTheme()
    : preference.toLowerCase()

  if (resolved === 'light') {
    root.setAttribute('data-theme', 'light')
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')
    root.classList.remove('light')
  }

  // Handle dynamic system theme changes when "System" is selected
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (mediaQueryListener) {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', mediaQueryListener)
      } else if (mq.removeListener) {
        mq.removeListener(mediaQueryListener)
      }
      mediaQueryListener = null
    }

    if (preference === 'System' || preference === 'system') {
      mediaQueryListener = (e) => {
        const newTheme = e.matches ? 'dark' : 'light'
        root.setAttribute('data-theme', newTheme)
        if (newTheme === 'light') {
          root.classList.add('light')
          root.classList.remove('dark')
        } else {
          root.classList.add('dark')
          root.classList.remove('light')
        }
      }
      if (mq.addEventListener) {
        mq.addEventListener('change', mediaQueryListener)
      } else if (mq.addListener) {
        mq.addListener(mediaQueryListener)
      }
    }
  }
}

export function getCurrentThemePreference() {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme-pref')
    if (attr) return attr
  }
  return 'Dark'
}
