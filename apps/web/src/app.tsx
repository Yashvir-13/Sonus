import { useState } from 'react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'

export default function App() {
  const [showTestBench, setShowTestBench] = useState(true)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-brand text-sm font-bold tracking-[0.05em] text-muted-foreground">
            Sonus
          </p>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl">
            Adaptive Music Practice
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Real-time polyphonic chord analysis, low-latency AudioWorklet detection, and adaptive music coaching.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowTestBench((prev) => !prev)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
              showTestBench
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-card-foreground hover:bg-accent'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${showTestBench ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`}
            />
            {showTestBench ? 'Dev Audio Playground: ON' : 'Enable Dev Audio Bench'}
          </button>
        </div>
      </header>

      {showTestBench ? (
        <section aria-label="Developer Testing Bench">
          <AudioTestBench />
        </section>
      ) : (
        <div className="rounded-[20px] border border-border bg-card p-6 text-card-foreground shadow-none">
          <p className="text-sm text-muted-foreground">
            Clean blueprint foundation ready for feature development. Toggle the Dev Audio Playground above to test chord recognition.
          </p>
        </div>
      )}
    </main>
  )
}
