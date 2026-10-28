import { useState } from 'react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeTestingStudio } from '@/components/dev/practice-testing-studio'

export default function App() {
  const [activeView, setActiveView] = useState<'practice' | 'audio'>('practice')

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Studio Banner & View Navigator */}
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-brand text-xs font-bold tracking-[0.15em] uppercase text-emerald-500 dark:text-emerald-400">
              Conservatory Engine
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Version 0.1.0</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Adaptive Music Practice
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Real-time polyphonic chord alignment, statistical motor-habit modeling, Bayesian Knowledge Tracing, and grounded AI coaching.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5">
              ⚡ &lt;30ms Latency
            </span>
            <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5">
              🧠 BKT & SM-2
            </span>
            <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5">
              🎼 Jaccard DP Alignment
            </span>
            <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5">
              🎯 Multi-Armed Bandit
            </span>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex self-start md:self-auto rounded-xl border border-border bg-background/90 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView('practice')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150 ${
              activeView === 'practice'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'practice' ? 'bg-emerald-300 animate-pulse' : 'bg-muted-foreground/50'
              }`}
            />
            Practice & Drill Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveView('audio')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150 ${
              activeView === 'audio'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'audio' ? 'bg-emerald-300 animate-pulse' : 'bg-muted-foreground/50'
              }`}
            />
            Acoustic & FFT Bench
          </button>
        </div>
      </header>

      {/* Main Studio Workspaces */}
      <section aria-label="Testing Studio" className="w-full">
        {activeView === 'practice' ? (
          <PracticeTestingStudio />
        ) : (
          <AudioTestBench />
        )}
      </section>
    </main>
  )
}
