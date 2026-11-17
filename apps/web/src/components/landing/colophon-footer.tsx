import React from 'react'

export function ColophonFooter(): React.JSX.Element {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 bg-[#F8F8F6] dark:bg-[#09090B] px-6 py-8 text-xs font-mono text-zinc-600 dark:text-zinc-400 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-brand font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-200 uppercase">
            SONUS
          </span>
          <span aria-hidden="true">·</span>
          <span>Piano &amp; Guitar Practice Studio</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span>Sheet Music &amp; Fretboard</span>
          <span aria-hidden="true">·</span>
          <span>Bar Timing Feedback</span>
          <span aria-hidden="true">·</span>
          <span>Tempo Loop Drills</span>
        </div>
      </div>
    </footer>
  )
}
