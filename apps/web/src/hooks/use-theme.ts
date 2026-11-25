import { useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const THEME_STORAGE_KEY = 'sonus_theme'
const THEME_CHANGE_EVENT = 'sonus-theme-change'

function resolveIsDark(t: Theme): boolean {
  if (t === 'dark') return true
  if (t === 'light') return false
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return true
}

function applyDocumentTheme(t: Theme) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const root = document.documentElement
  const isDark = resolveIsDark(t)
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
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark'
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

    if (theme === 'system' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => applyDocumentTheme('system')
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    return undefined
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
    const currentlyDark = resolveIsDark(theme)
    setTheme(currentlyDark ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme, isDark: resolveIsDark(theme) }
}
