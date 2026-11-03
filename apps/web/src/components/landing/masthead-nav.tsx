import React from 'react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { ArrowUpRight, TrendingUp, Users } from 'lucide-react'

export type MastheadNavProps = {
  onEnterStudio?: () => void
  onOpenProgress?: () => void
  onOpenCommunity?: () => void
  onSignIn?: () => void
  isSignedIn?: boolean
  userButtonSlot?: React.ReactNode
  onJumpToProgress?: (progress: number) => void
}

export function MastheadNav({
  onEnterStudio,
  onOpenProgress,
  onOpenCommunity,
  onSignIn,
  isSignedIn: _isSignedIn = false,
  userButtonSlot,
  onJumpToProgress,
}: MastheadNavProps): React.JSX.Element {
  const scrollToRatio = (ratio: number) => {
    if (onJumpToProgress) {
      onJumpToProgress(ratio)
      return
    }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: maxScroll * ratio, behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-zinc-200/90 dark:border-zinc-800/80 bg-[#F8F8F6]/85 dark:bg-[#09090B]/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault()
          scrollToRatio(0)
        }}
        className="font-brand text-sm font-bold tracking-[0.22em] uppercase text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0"
      >
        SONUS
      </a>

      {/* Zone 2: Clean Musician-Focused Section Links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => scrollToRatio(0.18)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          Acoustic Detection
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.35)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          Mistake Pinpointing
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.62)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          Habit Tracking
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.92)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          Song Library
        </button>
      </nav>

      {/* Zone 3: App Destinations, Theme Toggle & Practice Studio CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {onOpenProgress && (
          <button
            type="button"
            onClick={onOpenProgress}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:border-amber-500/60 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <TrendingUp className="size-3.5 text-amber-600 dark:text-amber-500" />
            <span>Progress &amp; Coach</span>
          </button>
        )}

        {onOpenCommunity && (
          <button
            type="button"
            onClick={onOpenCommunity}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:border-amber-500/60 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Peer Benchmarks</span>
          </button>
        )}

        <ThemeToggle />
        {userButtonSlot}

        <button
          type="button"
          onClick={onEnterStudio || onSignIn}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <span>Enter Practice Studio</span>
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </header>
  )
}
