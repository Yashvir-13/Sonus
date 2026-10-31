import { motion } from 'motion/react'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Current mode: ${theme}. Click to switch.`}
      aria-label="Toggle theme"
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] text-[#242321] dark:text-[#EDE8DF] shadow-xs transition-colors duration-200 hover:border-[#C5A059] dark:hover:border-[#C5A059] active:scale-95 ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          // Moon Icon in burnished antique brass (#C5A059)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C5A059"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 drop-shadow-[0_0_6px_rgba(197,160,89,0.35)]"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          // Sun Icon in burnished antique brass (#C5A059) with pearl ivory (#EDE8DF) center
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C5A059"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 drop-shadow-[0_0_6px_rgba(197,160,89,0.25)]"
          >
            <circle cx="12" cy="12" r="4" fill="#EDE8DF" stroke="#C5A059" strokeWidth="1.5" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </motion.div>
    </button>
  )
}
