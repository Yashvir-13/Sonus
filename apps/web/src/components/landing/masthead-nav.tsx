import React from 'react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { ArrowRight } from 'lucide-react'

export type MastheadNavProps = {
  onEnterStudio?: () => void
  onSignIn?: () => void
  isSignedIn?: boolean
  userButtonSlot?: React.ReactNode
}

export function MastheadNav({
  onEnterStudio,
  onSignIn,
  isSignedIn = false,
  userButtonSlot,
}: MastheadNavProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2DDD3]/70 dark:border-[#38342E]/70 bg-[#FAF8F3]/90 dark:bg-[#141312]/90 backdrop-blur-md px-6 py-3.5 transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#C5A059] font-serif font-black text-lg shadow-2xs">
            §
          </div>
          <div>
            <span className="font-serif text-lg font-black tracking-wider text-[#242321] dark:text-[#EDE8DF]">
              SONUS
            </span>
            <p className="text-[11px] text-[#736E65] dark:text-[#A39C8F] font-sans hidden sm:block">
              Adaptive Music Practice
            </p>
          </div>
        </div>

        {/* Center Nav Anchors */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-sans text-[#736E65] dark:text-[#A39C8F]">
          <a
            href="#how-it-works"
            className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors"
          >
            How it works
          </a>
          <a
            href="#diagnostics"
            className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors"
          >
            What it fixes
          </a>
          <a
            href="#repertoire"
            className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors"
          >
            Songs
          </a>
          <a
            href="#tuning-chamber"
            className="hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors"
          >
            A440 Tuning
          </a>
        </nav>

        {/* Right Controls: Theme Toggle & Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {userButtonSlot ? (
            <div className="flex items-center gap-3">
              {onEnterStudio && (
                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1E1C1A] px-4 py-2 text-xs font-sans font-semibold text-[#242321] dark:text-[#EDE8DF] hover:border-[#C5A059] transition-all shadow-2xs"
                >
                  Enter Studio
                </button>
              )}
              {userButtonSlot}
            </div>
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={onEnterStudio}
              className="flex items-center gap-2 rounded-xl bg-[#242321] text-[#FAF8F3] dark:bg-[#2A2723] dark:text-[#EDE8DF] border border-[#242321] dark:border-[#C5A059]/60 px-4 py-2 text-xs font-sans font-semibold hover:bg-[#3D3A36] dark:hover:bg-[#38342E] transition-all shadow-sm"
            >
              <span>Open Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSignIn}
                className="rounded-xl px-3.5 py-2 text-xs font-sans font-semibold text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF] transition-colors"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onSignIn || onEnterStudio}
                className="flex items-center gap-2 rounded-xl bg-[#242321] text-[#FAF8F3] dark:bg-[#2A2723] dark:text-[#EDE8DF] border border-[#242321] dark:border-[#C5A059]/60 px-4 py-2 text-xs font-sans font-semibold hover:bg-[#3D3A36] dark:hover:bg-[#38342E] transition-all shadow-sm"
              >
                <span>Start Practicing</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
