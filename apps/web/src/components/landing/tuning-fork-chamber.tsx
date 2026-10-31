import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Volume2, VolumeX, Sparkles } from 'lucide-react'

export function TuningForkChamber(): React.JSX.Element {
  const [isRinging, setIsRinging] = useState(false)
  const [decayProgress, setDecayProgress] = useState(0) // 0 to 100
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const decayTimerRef = useRef<number | null>(null)
  const prefersReduced = useReducedMotion()

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current)
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  const silenceFork = useCallback(() => {
    if (decayTimerRef.current) {
      clearInterval(decayTimerRef.current)
      decayTimerRef.current = null
    }
    if (audioCtxRef.current && masterGainRef.current) {
      try {
        const now = audioCtxRef.current.currentTime
        masterGainRef.current.gain.cancelScheduledValues(now)
        masterGainRef.current.gain.setValueAtTime(0.0001, now)
      } catch {
        // Ignore abort errors
      }
    }
    setIsRinging(false)
    setDecayProgress(0)
  }, [])

  // Strike the brass tuning fork using Web Audio API
  const strikeFork = useCallback(() => {
    silenceFork()

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtxClass()
      }

      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime
      const decayDuration = 7.0 // 7 seconds realistic exponential acoustic decay

      // Master Gain Node
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.3, now)
      masterGain.gain.exponentialRampToValueAtTime(0.00001, now + decayDuration)
      masterGain.connect(ctx.destination)
      masterGainRef.current = masterGain

      // 1. Pure Fundamental Sine Oscillator (A4 = 440.0 Hz)
      const oscFund = ctx.createOscillator()
      oscFund.type = 'sine'
      oscFund.frequency.setValueAtTime(440.0, now)
      oscFund.connect(masterGain)
      oscFund.start(now)
      oscFund.stop(now + decayDuration)

      // 2. High Strike Harmonic Clink (first inharmonic mode ~ 6.27 * 440 = 2758.8 Hz)
      const oscClink = ctx.createOscillator()
      const clinkGain = ctx.createGain()
      oscClink.type = 'sine'
      oscClink.frequency.setValueAtTime(2758.8, now)
      clinkGain.gain.setValueAtTime(0.12, now)
      clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12) // Dampens within 120ms
      oscClink.connect(clinkGain)
      clinkGain.connect(ctx.destination)
      oscClink.start(now)
      oscClink.stop(now + 0.15)

      setIsRinging(true)
      setDecayProgress(100)

      // Animate decay progress bar over duration
      const startTime = performance.now()
      decayTimerRef.current = window.setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000
        const remaining = Math.max(0, 100 - (elapsed / decayDuration) * 100)
        setDecayProgress(remaining)
        if (elapsed >= decayDuration) {
          if (decayTimerRef.current) clearInterval(decayTimerRef.current)
          setIsRinging(false)
        }
      }, 50)
    } catch (err) {
      console.warn('Web Audio tuning fork strike failed:', err)
    }
  }, [silenceFork])

  return (
    <section
      id="tuning-chamber"
      aria-label="Acoustic Tuning Fork Chamber"
      className="relative w-full rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-8 sm:p-12 overflow-hidden shadow-sm scroll-mt-24"
    >
      {/* Background Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(197, 160, 89, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
        {/* Left Column: Pedagogical Context & Scientific Readouts */}
        <div className="max-w-xl space-y-5 text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-mono font-bold">
              §
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C5A059] dark:text-[#DFC07A]">
              ACOUSTIC SENSORY CHAMBER
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#242321] dark:text-[#EDE8DF] tracking-tight">
            The Pitch Standard: <span className="italic text-[#C5A059]">A4 = 440 Hz</span>
          </h2>

          <p className="text-sm sm:text-base text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
            Before measuring intonation, pitch is calibrated to standard concert pitch (A4 = 440 Hz).
            Strike the brass tuning fork to hear a pure reference tone for tuning your acoustic piano or guitar.
          </p>

          {/* Telemetry Readouts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-3 text-center">
              <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase block">
                FREQUENCY
              </span>
              <span className="text-lg font-mono font-bold text-[#242321] dark:text-[#EDE8DF]">
                440.00
              </span>
              <span className="text-[9px] font-mono text-[#C5A059] block">Hz (±0.00¢)</span>
            </div>

            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-3 text-center">
              <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase block">
                PERIOD (T)
              </span>
              <span className="text-lg font-mono font-bold text-[#242321] dark:text-[#EDE8DF]">
                2.27
              </span>
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] block">
                milliseconds
              </span>
            </div>

            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-3 text-center">
              <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase block">
                WAVELENGTH
              </span>
              <span className="text-lg font-mono font-bold text-[#242321] dark:text-[#EDE8DF]">
                78.0
              </span>
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] block">
                cm (in air 20°C)
              </span>
            </div>

            <div className="rounded-xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-3 text-center">
              <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase block">
                DAMPING
              </span>
              <span className="text-lg font-mono font-bold text-[#C5A059]">
                {isRinging ? `${Math.round(decayProgress)}%` : 'REST'}
              </span>
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] block">
                {isRinging ? 'Resonating' : 'Zero Autoplay'}
              </span>
            </div>
          </div>

          {/* Action Strike Button */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              type="button"
              onClick={isRinging ? silenceFork : strikeFork}
              className={`flex items-center gap-3 rounded-xl px-6 py-3.5 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 ${
                isRinging
                  ? 'bg-[#9A2A2A] text-[#FAF8F3] border border-[#9A2A2A] animate-pulse hover:bg-[#802222]'
                  : 'bg-[#C5A059] text-[#141312] border border-[#C5A059] hover:bg-[#DFC07A]'
              }`}
            >
              {isRinging ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>DAMPEN TUNING FORK</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>STRIKE BRASS FORK (A = 440Hz)</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono text-[#736E65] dark:text-[#A39C8F] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>100% User Opt-in Web Audio</span>
            </span>
          </div>
        </div>

        {/* Right Column: Hand-Forged Brass Tuning Fork Vector Illustration with Realistic Vibration */}
        <div className="relative flex flex-col items-center justify-center p-6 bg-[#FCFBF8] dark:bg-[#141312] rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] shadow-inner w-full sm:w-80">
          <div className="text-[10px] font-mono tracking-widest text-[#736E65] dark:text-[#A39C8F] mb-4">
            CONCERT PITCH REFERENCE • A4 440Hz
          </div>

          {/* Tuning Fork Graphic */}
          <div
            role="button"
            tabIndex={0}
            onClick={strikeFork}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                strikeFork()
              }
            }}
            title="Click to strike the tuning fork"
            aria-label="Strike brass tuning fork graphic (A4 = 440 Hz)"
            className="cursor-pointer relative flex flex-col items-center group py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded-xl"
          >
            {/* Tines Container with vibration */}
            <div className="relative flex justify-center gap-8 h-44">
              {/* Left Tine */}
              <motion.div
                animate={
                  isRinging && !prefersReduced
                    ? {
                        x: [-2.5, 2.5, -2, 2, -1, 1, 0],
                        transition: {
                          repeat: Infinity,
                          duration: 0.08,
                          ease: 'easeInOut',
                        },
                      }
                    : { x: 0 }
                }
                className="w-4 rounded-t-full bg-gradient-to-r from-[#A5823D] via-[#C5A059] to-[#DFC07A] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),2px_2px_6px_rgba(0,0,0,0.15)]"
              />

              {/* Right Tine */}
              <motion.div
                animate={
                  isRinging && !prefersReduced
                    ? {
                        x: [2.5, -2.5, 2, -2, 1, -1, 0],
                        transition: {
                          repeat: Infinity,
                          duration: 0.08,
                          ease: 'easeInOut',
                        },
                      }
                    : { x: 0 }
                }
                className="w-4 rounded-t-full bg-gradient-to-r from-[#DFC07A] via-[#C5A059] to-[#A5823D] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),-2px_2px_6px_rgba(0,0,0,0.15)]"
              />
            </div>

            {/* Arch Junction */}
            <div className="w-16 h-8 rounded-b-2xl bg-[#C5A059] -mt-1 shadow-md border-b border-[#8F7239]" />

            {/* Central Stem Handle */}
            <div className="w-4 h-16 bg-gradient-to-r from-[#A5823D] via-[#C5A059] to-[#8F7239] shadow-md" />

            {/* Brass Base Ball */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8F7239] via-[#C5A059] to-[#DFC07A] -mt-1 shadow-lg border border-[#A5823D]" />

            {/* Sound Wave Ripple Effect when ringing */}
            {isRinging && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                className="pointer-events-none absolute top-4 w-32 h-32 rounded-full border border-[#C5A059]/40"
              />
            )}
          </div>

          {/* Interactive Hint */}
          <div className="text-[10px] font-mono text-[#C5A059] mt-3 group-hover:underline">
            {isRinging ? '♫ Resonating (Tap to restrike)' : 'Click fork to audition'}
          </div>
        </div>
      </div>
    </section>
  )
}
