import React from 'react'
import { Activity, Sliders, Disc, Music } from 'lucide-react'

export function DiagnosticsBento(): React.JSX.Element {
  return (
    <section
      id="diagnostics"
      aria-label="Practice Diagnostics"
      className="w-full scroll-mt-24 flex flex-col gap-8 rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-8 sm:p-12 shadow-sm"
    >
      {/* Section Header */}
      <div className="space-y-2 max-w-2xl">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C5A059] dark:text-[#DFC07A]">
          PRACTICE DIAGNOSTICS
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF] tracking-tight">
          What Sonus actually diagnoses
        </h2>
        <p className="text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
          No vague summaries or AI buzzwords. Objective, musical feedback on your timing, pitch, and chord voicings.
        </p>
      </div>

      {/* Bento Grid (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* CARD 1: Timing & Dynamic Alignment (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-8 shadow-2xs group hover:border-[#C5A059]/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Activity className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                TIMING ALIGNMENT
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#242321] dark:text-[#EDE8DF]">
              Follows your tempo without getting lost
            </h3>
            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              If you pause, hesitate, or play with expressive rubato, simple metronomes break.
              Sonus dynamically aligns your performance against the score so you never lose your place.
            </p>

            {/* Timing Matrix Visualization */}
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] p-3.5 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] dark:border-[#38342E] pb-2 text-[#736E65] dark:text-[#A39C8F]">
                <span>SAMPLE MEASURES: [1, 2, 3, 4]</span>
                <span className="text-[#3B6E57] dark:text-[#689F84] font-bold">ALIGNED WITH SCORE</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2.5 text-center">
                <div className="rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#E2DDD3] dark:border-[#38342E] p-2">
                  <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">M1: G Maj</div>
                  <div className="text-[#3B6E57] dark:text-[#689F84] text-[9px] mt-0.5">+4ms sync</div>
                </div>
                <div className="rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#E2DDD3] dark:border-[#38342E] p-2">
                  <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">M2: D Maj</div>
                  <div className="text-[#3B6E57] dark:text-[#689F84] text-[9px] mt-0.5">-2ms sync</div>
                </div>
                <div className="rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#E2DDD3] dark:border-[#38342E] p-2">
                  <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">M3: E Min</div>
                  <div className="text-[#9A2A2A] dark:text-[#D9534F] text-[9px] mt-0.5">+140ms lag</div>
                </div>
                <div className="rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#E2DDD3] dark:border-[#38342E] p-2">
                  <div className="font-bold text-[#242321] dark:text-[#EDE8DF]">M4: C Maj</div>
                  <div className="text-[#3B6E57] dark:text-[#689F84] text-[9px] mt-0.5">+6ms sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Habit Detection (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-8 shadow-2xs group hover:border-[#C5A059]/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Sliders className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                HABIT TRACKING
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#242321] dark:text-[#EDE8DF]">
              Separates slips from bad habits
            </h3>
            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Anyone can miss a note once. Sonus tracks patterns across multiple takes to flag chronic rushing,
              dragging, or difficult chord transitions.
            </p>

            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] p-3 text-[10px] font-mono">
              <div className="flex items-center justify-between text-[#736E65] dark:text-[#A39C8F] pb-1.5">
                <span>TRANSITION LATENCY</span>
                <span className="text-[#9A2A2A] dark:text-[#D9534F] font-bold">FLAGGED TAKE 3</span>
              </div>
              <div className="text-[#242321] dark:text-[#EDE8DF] text-[11px] pt-1 border-t border-[#E2DDD3] dark:border-[#38342E]">
                Identified: Recurring lag (+140ms) on Am → C transition
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Acoustic Noise Gate (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-8 shadow-2xs group hover:border-[#C5A059]/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Disc className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                ACOUSTIC FILTERING
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#242321] dark:text-[#EDE8DF]">
              Noise gate &amp; chord recognition
            </h3>
            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              An intelligent noise gate filters room reverberation and background noise so your instrument’s
              true pitch comes through cleanly.
            </p>

            <div className="flex items-center gap-3 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] pt-1">
              <span className="rounded bg-[#EFECE6] dark:bg-[#24221F] px-2 py-1 border border-[#D9D3C7] dark:border-[#38342E]">
                Gate: -34 dB
              </span>
              <span className="rounded bg-[#EFECE6] dark:bg-[#24221F] px-2 py-1 border border-[#D9D3C7] dark:border-[#38342E]">
                Sub-30ms Latency
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: Zero Page-Turns (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-8 shadow-2xs group hover:border-[#C5A059]/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Music className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                FLOWING SCORE
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#242321] dark:text-[#EDE8DF]">
              Continuous notation with zero page-turns
            </h3>
            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Standard paper and PDF scores force awkward page-turns in the middle of difficult musical passages.
              Sonus scrolls smoothly horizontally with a calibrated caliper playhead so your hands never have to leave the keys.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#736E65] dark:text-[#A39C8F]">
              <span className="rounded border border-[#D9D3C7] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] px-2.5 py-1">
                🎼 Grand Staff &amp; 6-String Tabs
              </span>
              <span className="rounded border border-[#D9D3C7] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] px-2.5 py-1">
                🎯 Caliper Hit Line
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
