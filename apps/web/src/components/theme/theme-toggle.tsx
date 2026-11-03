import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle({ className = '' }: { className?: string }): React.JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-testid="theme-toggle-button"
      aria-label={isDark ? 'Switch to Daylight Mode' : 'Switch to Nocturne Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-800 dark:text-zinc-200 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-colors cursor-pointer text-xs font-mono ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[11px] font-medium">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
        </>
      )}
    </button>
  )
}
