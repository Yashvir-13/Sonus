import { useState } from 'react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeTestingStudio } from '@/components/dev/practice-testing-studio'

export default function App() {
  const [activeView, setActiveView] = useState<'practice' | 'audio'>('practice')

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-brand text-sm font-bold tracking-[0.05em] text-muted-foreground">
            Sonus
          </p>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl">
            Adaptive Music Practice
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Real-time polyphonic chord alignment, statistical habit modeling, grounded AI coaching, and dynamic remedial drill generation.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex rounded-full border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView('practice')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
              activeView === 'practice'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'practice' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            Practice & Drill Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveView('audio')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
              activeView === 'audio'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'audio' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            Acoustic & FFT Bench
          </button>
        </div>
      </header>

      {/* Main Studio Workspaces */}
      <section aria-label="Testing Studio">
        {activeView === 'practice' ? (
          <PracticeTestingStudio />
        ) : (
          <AudioTestBench />
        )}
      </section>
    </main>
  )
}
