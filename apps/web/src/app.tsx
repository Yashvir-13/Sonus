import { useState } from 'react'
import { AudioTestBench } from '@/components/dev/audio-test-bench'
import { PracticeTestingStudio } from '@/components/dev/practice-testing-studio'

export default function App() {
  const [activeView, setActiveView] = useState<'practice' | 'audio'>('practice')

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 font-serif">
      {/* Studio Banner & View Navigator */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#E2DDD3] bg-[#FAF8F3] dark:border-[#38342E] dark:bg-[#1E1C1A] p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-[#9A2A2A] dark:text-[#D9534F]">
              SONUS CONSERVATORY
            </span>
            <span className="text-[#A09A8F] dark:text-[#6E675C]">•</span>
            <span className="text-xs text-[#736E65] dark:text-[#A39C8F] font-sans">Precision Adaptive Music Practice</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#242321] dark:text-[#EDE8DF] sm:text-3xl">
            Adaptive Music Practice Studio
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] leading-relaxed font-sans">
            Real-time flowing notation stand & guitar tabs, continuous microtonal pitch detection, and full-song interactive practice.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F]">
            <span className="rounded border border-[#D9D3C7] bg-[#FCFBF8] dark:border-[#38342E] dark:bg-[#1A1816] px-2 py-0.5">
              🎼 Continuous Flowing Staves &amp; Tabs
            </span>
            <span className="rounded border border-[#D9D3C7] bg-[#FCFBF8] dark:border-[#38342E] dark:bg-[#1A1816] px-2 py-0.5">
              🎯 Center Caliper Playhead
            </span>
            <span className="rounded border border-[#D9D3C7] bg-[#FCFBF8] dark:border-[#38342E] dark:bg-[#1A1816] px-2 py-0.5">
              ⚡ Real-Time Pitch Tracking &amp; Noise Gate
            </span>
            <span className="rounded border border-[#D9D3C7] bg-[#FCFBF8] dark:border-[#38342E] dark:bg-[#1A1816] px-2 py-0.5">
              📜 Archival Conservatory
            </span>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex self-start md:self-auto rounded-xl border border-[#D9D3C7] bg-[#FCFBF8] dark:border-[#38342E] dark:bg-[#1A1816] p-1 shadow-2xs font-sans">
          <button
            type="button"
            onClick={() => setActiveView('practice')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150 ${
              activeView === 'practice'
                ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-2xs'
                : 'text-[#736E65] hover:bg-[#EFECE6] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:bg-[#2A2723] dark:hover:text-[#EDE8DF]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'practice' ? 'bg-[#9A2A2A] dark:bg-[#D9534F] animate-pulse' : 'bg-[#A09A8F] dark:bg-[#5C564C]'
              }`}
            />
            Practice &amp; Drill Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveView('audio')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150 ${
              activeView === 'audio'
                ? 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-2xs'
                : 'text-[#736E65] hover:bg-[#EFECE6] hover:text-[#242321] dark:text-[#A39C8F] dark:hover:bg-[#2A2723] dark:hover:text-[#EDE8DF]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeView === 'audio' ? 'bg-[#9A2A2A] dark:bg-[#D9534F] animate-pulse' : 'bg-[#A09A8F] dark:bg-[#5C564C]'
              }`}
            />
            Acoustic &amp; FFT Bench
          </button>
        </div>
      </header>

      {/* Main Studio Workspaces */}
      <section aria-label="Testing Studio" className="w-full">
        {activeView === 'practice' && <PracticeTestingStudio />}
        {activeView === 'audio' && <AudioTestBench />}
      </section>
    </main>
  )
}
