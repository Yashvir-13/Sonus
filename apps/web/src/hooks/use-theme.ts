import { useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const THEME_STORAGE_KEY = 'sonus_theme'
const THEME_CHANGE_EVENT = 'sonus-theme-change'

function applyDocumentTheme(t: Theme) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const root = document.documentElement
  let isDark = t === 'dark'
  if (t === 'system' && typeof window.matchMedia === 'function') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  if (isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      return saved === 'light' || saved === 'dark' ? saved : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    applyDocumentTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  useEffect(() => {
    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<Theme>
      if (custom.detail && custom.detail !== theme) {
        setThemeState(custom.detail)
      }
    }
    window.addEventListener(THEME_CHANGE_EVENT, handleSync)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleSync)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    applyDocumentTheme(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // Ignore storage errors
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: newTheme }))
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
