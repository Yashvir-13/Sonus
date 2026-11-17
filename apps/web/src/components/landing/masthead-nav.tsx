import React from 'react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { ArrowUpRight } from 'lucide-react'

export type MastheadNavProps = {
  onEnterStudio?: () => void
  onOpenTheory?: () => void
  onOpenTuner?: () => void
  onOpenProgress?: () => void
  onOpenCommunity?: () => void
  onSignIn?: () => void
  isSignedIn?: boolean
  userButtonSlot?: React.ReactNode
  onJumpToProgress?: (progress: number) => void
}

export function MastheadNav({
  onEnterStudio,
  onOpenTheory,
  onOpenTuner,
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
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    window.scrollTo({ top: maxScroll * ratio, behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-zinc-200/90 dark:border-zinc-800/80 bg-[#F8F8F6]/92 dark:bg-[#09090B]/92 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-6 transition-colors">
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault()
          scrollToRatio(0)
        }}
        className="font-brand text-sm font-bold tracking-[0.22em] uppercase text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0 flex items-center gap-1.5"
      >
        <span className="text-amber-600 dark:text-amber-500 font-bold" aria-hidden="true">
          §
        </span>
        <span>SONUS</span>
      </a>

      <nav
        aria-label="Primary studio sections"
        className="hidden lg:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        <button
          type="button"
          onClick={() => scrollToRatio(0.22)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
        >
          Practice View
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.45)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
        >
          Bar Feedback
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.68)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
        >
          Drills &amp; Tools
        </button>
        <button
          type="button"
          onClick={() => scrollToRatio(0.92)}
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
        >
          Song Library
        </button>
        {onOpenTheory && (
          <button
            type="button"
            onClick={onOpenTheory}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
          >
            Chords &amp; Scales
          </button>
        )}
        {onOpenTuner && (
          <button
            type="button"
            onClick={onOpenTuner}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
          >
            Tuner
          </button>
        )}
        {onOpenProgress && (
          <button
            type="button"
            onClick={onOpenProgress}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-amber-500/70"
          >
            Progress &amp; Coach
          </button>
        )}
        {onOpenCommunity && (
          <button
            type="button"
            onClick={onOpenCommunity}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-emerald-500/70"
          >
            Peer Benchmarks
          </button>
        )}
      </nav>

      <div className="flex items-center gap-2.5 shrink-0">
        <ThemeToggle />
        {userButtonSlot}
        <button
          type="button"
          onClick={onEnterStudio || onSignIn}
          className="px-3.5 sm:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Enter Practice Studio</span>
          <ArrowUpRight className="size-3.5 shrink-0" />
        </button>
      </div>
    </header>
  )
}
