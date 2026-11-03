import React from 'react'
import { Clock, Waves, Cpu, Sparkles } from 'lucide-react'

export function MechanicsOfTime(): React.JSX.Element {
  return (
    <section
      id="mechanics-of-time"
      aria-label="The Mechanics of Time"
      className="w-full scroll-mt-24 flex flex-col gap-10 rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-8 sm:p-12 shadow-sm font-sans"
    >
      {/* Chapter 2 Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-mono font-bold">
            §
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C5A059] dark:text-[#DFC07A]">
            CHAPTER II • THE MECHANICS OF TIME &amp; ACOUSTICS
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF] tracking-tight">
          How Sonus listens, models, and aligns
        </h2>

        <p className="text-sm sm:text-base text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
          Behind the archival music stand lies deterministic acoustic modeling and bioinformatic sequence alignment.
          Three foundational engineering principles power continuous real-time practice.
        </p>
      </div>

      {/* 3 High-Craft Editorial Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Needleman-Wunsch Dynamic Time Warping */}
        <div
          data-testid="mechanics-needleman-wunsch"
          className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-7 shadow-2xs group hover:border-[#C5A059]/60 transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Clock className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                DTW ALGORITHM
              </span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-[#242321] dark:text-[#EDE8DF]">
                Needleman-Wunsch Score Alignment
              </h3>
              <span className="text-[11px] font-mono text-[#C5A059] block mt-0.5">
                Dynamic Time Warping Matrix
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Human musicians don't play like clockwork robots. We breathe, hesitate, and introduce expressive rubato.
              Sonus solves sequence alignment using modified dynamic time warping, matching audio onset frames to Urtext measures without ever derailing the sightline.
            </p>

            {/* Matrix Visualizer */}
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] p-3 font-mono text-[10px]">
              <div className="flex items-center justify-between text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-1.5 mb-2">
                <span>SCORE VS AUDIO ONSET</span>
                <span className="text-[#3B6E57] dark:text-[#689F84] font-bold">OPTIMAL PATH</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                <div className="p-1 rounded bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40">M1: 0ms</div>
                <div className="p-1 rounded bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40">M2: -4ms</div>
                <div className="p-1 rounded bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40">M3: +6ms</div>
                <div className="p-1 rounded bg-[#9A2A2A]/20 text-[#9A2A2A] font-bold border border-[#9A2A2A]/40">Lag +32ms</div>
                <div className="p-1 rounded bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40">Realigned</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] border-t border-[#E2DDD3] dark:border-[#38342E] pt-3 mt-4">
            Sub-30ms Dynamic Latency Window
          </div>
        </div>

        {/* CARD 2: Karplus-Strong Physical String Synthesis */}
        <div
          data-testid="mechanics-karplus-strong"
          className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-7 shadow-2xs group hover:border-[#C5A059]/60 transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Waves className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                PHYSICAL MODELING
              </span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-[#242321] dark:text-[#EDE8DF]">
                Karplus-Strong String Synthesis
              </h3>
              <span className="text-[11px] font-mono text-[#C5A059] block mt-0.5">
                Delay Line &amp; Loss Filter Loop
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Authentic guitar backing guide synthesis runs on client-side DSP without multi-megabyte soundbanks.
              A short burst of white noise passes through a delay line buffer of length $L = f_s / f_0$, recirculating through an averaging low-pass filter to simulate true acoustic plucked string resonance.
            </p>

            {/* Delay Loop Schematic */}
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] p-3 font-mono text-[10px]">
              <div className="flex items-center justify-between text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-1.5 mb-2">
                <span>BUFFER LOOP: L = fs / f0</span>
                <span className="text-[#C5A059] font-bold">LOW-PASS LOSS</span>
              </div>
              <div className="flex items-center justify-between text-center gap-1">
                <div className="flex-1 p-1 rounded bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E]">Noise Burst</div>
                <span className="text-[#C5A059]">→</span>
                <div className="flex-1 p-1 rounded bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E]">z⁻ᴸ Delay</div>
                <span className="text-[#C5A059]">→</span>
                <div className="flex-1 p-1 rounded bg-[#3B6E57]/20 text-[#3B6E57] dark:text-[#689F84] border border-[#3B6E57]/40">Damping</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] border-t border-[#E2DDD3] dark:border-[#38342E] pt-3 mt-4">
            Zero Web Audio Lag • Pluck Transient Clarity
          </div>
        </div>

        {/* CARD 3: Piano Multi-Partial Additive Acoustics */}
        <div
          data-testid="mechanics-piano-partials"
          className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-7 shadow-2xs group hover:border-[#C5A059]/60 transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                <Cpu className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2.5 py-0.5 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
                ADDITIVE HARMONICS
              </span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-[#242321] dark:text-[#EDE8DF]">
                Piano Multi-Partials &amp; Inharmonicity
              </h3>
              <span className="text-[11px] font-mono text-[#C5A059] block mt-0.5">
                Stiffness Dispersion: fn = n·f0·√(1+B·n²)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Piano strings have non-zero physical stiffness, causing higher overtones to ring slightly sharper than pure integers.
              Sonus models authentic inharmonicity coefficients ($B$), splitting rich Left-Hand fundamentals (Terracotta) from soaring Right-Hand partials (Patina Jade).
            </p>

            {/* Inharmonic Ladder */}
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1A1816] p-3 font-mono text-[10px]">
              <div className="flex items-center justify-between text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-1.5 mb-2">
                <span>INHARMONIC SPECTRUM</span>
                <span className="text-[#9A2A2A] dark:text-[#E57373] font-bold">LH</span>
                <span className="text-[#3B6E57] dark:text-[#689F84] font-bold">RH</span>
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className="px-1.5 py-0.5 rounded bg-[#9A2A2A]/20 text-[#9A2A2A] dark:text-[#E57373] font-bold">f₀: 130Hz</span>
                <span className="px-1.5 py-0.5 rounded bg-[#9A2A2A]/10 text-[#524D44] dark:text-[#A39C8F]">2f₀: 261Hz</span>
                <span className="px-1.5 py-0.5 rounded bg-[#3B6E57]/15 text-[#3B6E57] dark:text-[#689F84]">3f₀: 393Hz</span>
                <span className="px-1.5 py-0.5 rounded bg-[#3B6E57]/20 text-[#3B6E57] dark:text-[#689F84] font-bold">4f₀: 526Hz</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] border-t border-[#E2DDD3] dark:border-[#38342E] pt-3 mt-4 flex items-center justify-between">
            <span>Nyquist Anti-Aliasing Clamped</span>
            <Sparkles className="h-3 w-3 text-[#C5A059]" />
          </div>
        </div>
      </div>
    </section>
  )
}
