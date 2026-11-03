import React from 'react'

export function ColophonFooter(): React.JSX.Element {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 bg-[#F8F8F6] dark:bg-[#09090B] px-6 py-8 text-xs font-mono text-zinc-500 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-brand font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-200 uppercase">
            SONUS
          </span>
          <span>·</span>
          <span>Adaptive Musical Practice System</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] tabular-nums">
          <span>22.05 kHz Mono PCM</span>
          <span>·</span>
          <span>Needleman-Wunsch Alignment</span>
          <span>·</span>
          <span>EWMA &amp; CUSUM Habit Detection</span>
        </div>
      </div>
    </footer>
  )
}
