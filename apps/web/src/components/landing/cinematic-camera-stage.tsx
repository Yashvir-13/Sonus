import React, { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react'
import { ArrowUpRight, Volume2, Play, Activity, Sliders, Disc, TrendingUp, Users, BookOpen } from 'lucide-react'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import type { ExerciseDto } from '@/api/sessions'
import { VolumetricSmokeCanvas } from './volumetric-smoke-canvas'

export type CinematicCameraStageProps = {
  onEnterStudio?: (songId?: string) => void
  onOpenTheory?: () => void
  onOpenTuner?: () => void
  onOpenProgress?: () => void
  onOpenCommunity?: () => void
  onSelectPiece?: (title: string, songId?: string) => void
  activePieceTitle?: string
}

const SECTION_WAYPOINTS = [
  { id: 's1', label: 'Overview', ratio: 0.01 },
  { id: 's2', label: 'Acoustic Detection', ratio: 0.18 },
  { id: 's3', label: 'Mistake Pinpointing', ratio: 0.35 },
  { id: 's4', label: 'Timing Alignment', ratio: 0.49 },
  { id: 's5', label: 'Habit Tracking', ratio: 0.62 },
  { id: 's6', label: 'Practice Tempo Ramp', ratio: 0.77 },
  { id: 's7', label: 'Song Library', ratio: 0.94 },
]

export function CinematicCameraStage({
  onEnterStudio,
  onOpenTheory,
  onOpenTuner,
  onOpenProgress,
  onOpenCommunity,
  onSelectPiece,
  activePieceTitle = 'Waltz No. 2 in C Minor',
}: CinematicCameraStageProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const audioRef = useRef<PracticeAudioEngine | null>(null)

  const [scrollProgressValue, setScrollProgressValue] = useState(0)
  const [activeMovementIdx, setActiveMovementIdx] = useState(0)
  const [selectedInstrument, setSelectedInstrument] = useState<'piano' | 'guitar'>('piano')
  const [selectedSongId, setSelectedSongId] = useState<string>('ex_piano_shostakovich_waltz_2')
  const [lastAuditionedLabel, setLastAuditionedLabel] = useState<string>(
    'Click any sound button above to hear the built-in piano and guitar synthesis'
  )

  useEffect(() => {
    const engine = new PracticeAudioEngine()
    audioRef.current = engine
    return () => {
      engine.dispose()
      audioRef.current = null
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const clamped = Math.max(0, Math.min(1, latest))
    setScrollProgressValue(clamped)
    if (clamped < 0.11) setActiveMovementIdx(0)
    else if (clamped < 0.26) setActiveMovementIdx(1)
    else if (clamped < 0.43) setActiveMovementIdx(2)
    else if (clamped < 0.55) setActiveMovementIdx(3)
    else if (clamped < 0.70) setActiveMovementIdx(4)
    else if (clamped < 0.85) setActiveMovementIdx(5)
    else setActiveMovementIdx(6)
  })

  const jumpToRatio = (ratio: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const containerTop = window.scrollY + rect.top
    const scrollable = containerRef.current.offsetHeight - window.innerHeight
    window.scrollTo({
      top: containerTop + scrollable * ratio,
      behavior: 'smooth',
    })
  }

  const triggerDspAudition = (mode: 'piano' | 'guitar' | 'a440') => {
    if (!audioRef.current) return
    audioRef.current.unlock()
    if (mode === 'piano') {
      audioRef.current.playPianoVoicing([48, 55], [60, 63, 67, 72], 1.6, 0.8)
      setLastAuditionedLabel('Multi-Partial Piano: Cm7 [C3-G3 + C4-Eb4-G4-C5] · Inharmonicity B=0.0004')
    } else if (mode === 'guitar') {
      audioRef.current.playGuitarStrum([40, 47, 52, 55, 59, 64], 'down', true, 1.6)
      setLastAuditionedLabel('Karplus-Strong Guitar: Em [E2-B2-E3-G3-B3-E4] · Delay Loop L = fs/f0')
    } else {
      audioRef.current.playPianoNote(69, 1.4, 0.85)
      setLastAuditionedLabel('Reference Pitch: A4 = 440.00 Hz · ±0.0 cents')
    }
  }

  const filteredSongs = BUILTIN_FULL_SONGS.filter(
    (s) => s.instrument.toLowerCase() === selectedInstrument
  )
  const currentSong: ExerciseDto =
    BUILTIN_FULL_SONGS.find((s) => s.id === selectedSongId) ||
    filteredSongs[0] ||
    BUILTIN_FULL_SONGS[0]

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTINUOUS CAMERA CHOREOGRAPHY ACROSS 800VH (SMOOTH OVERLAPPING WINDOWS)
  // ─────────────────────────────────────────────────────────────────────────────

  // Perspective Floor Grid
  const gridRotateX = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.55, 0.75, 1],
    [68, 45, 70, 28, 56, 64]
  )
  const gridTranslateY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ['0%', '-22%', '-45%']
  )
  const gridScale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 0.75, 1],
    [1.1, 2.0, 1.3, 0.95, 1.12]
  )

  // SECTION 1: Hero Overview — Z-Axis Push Through Wordmark (0.00 -> 0.14)
  const m1Scale = useTransform(scrollYProgress, [0, 0.10, 0.14], [1, 2.2, 4.4])
  const m1LetterSpacing = useTransform(scrollYProgress, [0, 0.12], ['-0.03em', '0.42em'])
  const m1Opacity = useTransform(scrollYProgress, [0, 0.08, 0.13], [1, 0.85, 0])
  const m1Blur = useTransform(scrollYProgress, [0, 0.08, 0.13], ['blur(0px)', 'blur(2px)', 'blur(14px)'])
  const m1Y = useTransform(scrollYProgress, [0, 0.13], ['0vh', '-10vh'])

  // SECTION 2: Acoustic Detection — Macro Zoom Into 30ms Attack (0.09 -> 0.28)
  const m2Scale = useTransform(scrollYProgress, [0.09, 0.16, 0.23, 0.28], [0.55, 1.0, 1.04, 2.1])
  const m2Opacity = useTransform(scrollYProgress, [0.09, 0.14, 0.23, 0.28], [0, 1, 1, 0])
  const m2Blur = useTransform(
    scrollYProgress,
    [0.09, 0.14, 0.23, 0.28],
    ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(12px)']
  )
  const m2RotateY = useTransform(scrollYProgress, [0.09, 0.18, 0.28], [-10, 0, 10])

  // SECTION 3: Mistake Pinpointing — Horizontal Tracking Pan Across Measures (0.24 -> 0.45)
  const m3X = useTransform(scrollYProgress, [0.24, 0.29, 0.40, 0.45], ['55vw', '14vw', '-32vw', '-72vw'])
  const m3ParallaxBgX = useTransform(scrollYProgress, [0.24, 0.45], ['25vw', '-35vw'])
  const m3ParallaxFgX = useTransform(scrollYProgress, [0.24, 0.45], ['65vw', '-85vw'])
  const m3Opacity = useTransform(scrollYProgress, [0.24, 0.28, 0.41, 0.45], [0, 1, 1, 0])
  const m3Scale = useTransform(scrollYProgress, [0.24, 0.34, 0.45], [0.92, 1.0, 0.94])

  // SECTION 4: Timing Alignment — Vertical Plunge Into Needleman-Wunsch Matrix (0.41 -> 0.57)
  const m4Y = useTransform(scrollYProgress, [0.41, 0.46, 0.52, 0.57], ['42vh', '0vh', '0vh', '-38vh'])
  const m4RotateX = useTransform(scrollYProgress, [0.41, 0.48, 0.57], [16, 0, -14])
  const m4Scale = useTransform(scrollYProgress, [0.41, 0.47, 0.53, 0.57], [0.86, 1.0, 1.0, 1.12])
  const m4Opacity = useTransform(scrollYProgress, [0.41, 0.45, 0.53, 0.57], [0, 1, 1, 0])
  const m4Blur = useTransform(
    scrollYProgress,
    [0.41, 0.45, 0.53, 0.57],
    ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)']
  )

  // SECTION 5: Habit Tracking — Smooth Depth Pull-Back & Crossfade (0.53 -> 0.72)
  const m5Scale = useTransform(scrollYProgress, [0.53, 0.59, 0.67, 0.72], [1.18, 1.0, 1.0, 0.90])
  const m5Y = useTransform(scrollYProgress, [0.53, 0.59, 0.67, 0.72], ['22vh', '0vh', '0vh', '-20vh'])
  const m5Opacity = useTransform(scrollYProgress, [0.53, 0.58, 0.67, 0.72], [0, 1, 1, 0])
  const m5Blur = useTransform(
    scrollYProgress,
    [0.53, 0.58, 0.67, 0.72],
    ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(8px)']
  )

  // SECTION 6: Practice Tempo Ramp & Synthesis — Smooth Vertical/Depth Glide (0.68 -> 0.86)
  const m6Y = useTransform(scrollYProgress, [0.68, 0.74, 0.81, 0.86], ['26vh', '0vh', '0vh', '-22vh'])
  const m6Scale = useTransform(scrollYProgress, [0.68, 0.74, 0.81, 0.86], [0.90, 1.0, 1.0, 0.93])
  const m6Opacity = useTransform(scrollYProgress, [0.68, 0.73, 0.81, 0.86], [0, 1, 1, 0])
  const m6Blur = useTransform(
    scrollYProgress,
    [0.68, 0.73, 0.81, 0.86],
    ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(8px)']
  )

  // SECTION 7: Song Library & Live Audition Deck — Smooth Final Arrival (0.82 -> 1.00)
  const m7Scale = useTransform(scrollYProgress, [0.82, 0.89, 1.0], [0.92, 1.0, 1.0])
  const m7Y = useTransform(scrollYProgress, [0.82, 0.89, 1.0], ['22vh', '0vh', '0vh'])
  const m7Opacity = useTransform(scrollYProgress, [0.82, 0.88, 1.0], [0, 1, 1])
  const m7Blur = useTransform(scrollYProgress, [0.82, 0.88, 1.0], ['blur(8px)', 'blur(0px)', 'blur(0px)'])
  const m7PointerEvents = useTransform(scrollYProgress, (v) => (v >= 0.81 ? 'auto' : 'none'))

  if (prefersReduced) {
    return (
      <div
        data-testid="cinematic-camera-stage"
        className="w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 pt-24 pb-20 px-6 max-w-6xl mx-auto space-y-16"
      >
        <div className="space-y-4">
          <h1 data-testid="expanding-wordmark" className="font-brand text-6xl font-bold tracking-tight">
            SONUS
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Real-time polyphonic pitch tracking, Needleman-Wunsch sequence alignment, EWMA motor-habit detection, and closed-loop tempo-ramped drills.
          </p>
          <button
            type="button"
            onClick={() => onEnterStudio?.(selectedSongId)}
            className="px-6 py-3 rounded-lg bg-amber-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider"
          >
            Enter Practice Studio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-testid="mechanics-needleman-wunsch" className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Needleman-Wunsch Alignment</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              Dynamic programming sequence alignment matching played chord onsets against reference measures.
            </p>
          </div>
          <div data-testid="mechanics-karplus-strong" className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Karplus-Strong Plucked String DSP</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              Recirculating delay-line synthesis with low-pass loss filtering for zero-latency guitar reference.
            </p>
          </div>
          <div data-testid="mechanics-piano-partials" className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Dynamic Grand Staff &amp; Synthesia Waterfall Keys</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              Multi-partial acoustic piano synthesis with inharmonicity dispersion and LH/RH voice separation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="cinematic-camera-stage"
      className="relative w-full h-[800vh] bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 select-none transition-colors"
    >
      {/* ─────────────────────────────────────────────────────────────────────
          STICKY 100VH MULTI-AXIS 3D STAGE VIEWPORT
         ───────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center [perspective:1400px]">
        {/* 1. REAL HTML5 CANVAS VOLUMETRIC SMOKE & ATMOSPHERIC LIGHT BEAMS */}
        <VolumetricSmokeCanvas scrollProgress={scrollProgressValue} />

        {/* 2. DYNAMIC 3D PARALLAX FLOOR GRID */}
        <motion.div
          style={{
            rotateX: gridRotateX,
            y: gridTranslateY,
            scale: gridScale,
          }}
          className="pointer-events-none absolute inset-x-[-20%] bottom-[-35%] h-[95vh] z-0 opacity-35 dark:opacity-30 [transform-style:preserve-3d]"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(161,161,170,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(161,161,170,0.18) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at center, black 18%, transparent 75%)',
            }}
          />
        </motion.div>

        {/* 3. CLEAN SECTION WAYPOINT NAVIGATION (LEFT MARGIN — NO CAMERA JARGON) */}
        <div className="fixed left-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-2.5">
          {SECTION_WAYPOINTS.map((wp, idx) => {
            const isCurrent = idx === activeMovementIdx
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => jumpToRatio(wp.ratio)}
                className="group flex items-center gap-2.5 text-left py-1 focus:outline-none cursor-pointer"
              >
                <span
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    isCurrent
                      ? 'w-6 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                      : 'w-2 bg-zinc-400 dark:bg-zinc-700 group-hover:bg-zinc-600 dark:group-hover:bg-zinc-400'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium tracking-wide transition-opacity ${
                    isCurrent
                      ? 'text-zinc-900 dark:text-zinc-100 font-semibold opacity-100'
                      : 'text-zinc-500 dark:text-zinc-500 opacity-60 group-hover:opacity-100'
                  }`}
                >
                  {wp.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 1: HERO OVERVIEW — Z-AXIS PUSH (0.00 -> 0.13)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            scale: m1Scale,
            letterSpacing: m1LetterSpacing,
            opacity: m1Opacity,
            filter: m1Blur,
            y: m1Y,
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none z-10 will-change-[transform,opacity,filter]"
        >
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono tracking-[0.22em] uppercase text-zinc-600 dark:text-zinc-400">
            <span>POLYPHONIC PITCH TRACKING</span>
            <span>·</span>
            <span>CHORD TRANSITION TIMING</span>
            <span>·</span>
            <span>ADAPTIVE PRACTICE ROOM</span>
          </div>

          <h1
            data-testid="expanding-wordmark"
            className="font-brand font-bold text-[5.5rem] sm:text-[9.5rem] md:text-[13rem] leading-[0.86] tracking-tight text-zinc-900 dark:text-zinc-100 uppercase"
          >
            SONUS
          </h1>

          <p className="mt-8 max-w-xl text-sm sm:text-base font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed tracking-normal">
            A dedicated practice room for piano and guitar. Measures your chord transitions in milliseconds, shows which notes you missed, tracks motor habits across sessions, and slows down difficult bars so you can master them cleanly.
          </p>

          <div className="mt-8 pointer-events-auto flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onEnterStudio?.(selectedSongId)}
              className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <span>Enter Practice Studio</span>
              <ArrowUpRight className="size-4" />
            </button>
            {onOpenProgress && (
              <button
                type="button"
                onClick={onOpenProgress}
                className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-amber-500 text-zinc-800 dark:text-zinc-200 font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <TrendingUp className="size-3.5 text-amber-600 dark:text-amber-500" />
                <span>Progress &amp; Smart Drills</span>
              </button>
            )}
            {onOpenCommunity && (
              <button
                type="button"
                onClick={onOpenCommunity}
                className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-amber-500 text-zinc-800 dark:text-zinc-200 font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Peer Benchmarks</span>
              </button>
            )}
          </div>

          {/* Clean Interactive Suite Discovery Strip */}
          <div className="mt-8 pointer-events-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl w-full text-left">
            <button
              type="button"
              onClick={onOpenTheory}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500">
                <BookOpen className="size-3.5 text-amber-500" />
                <span>Chords &amp; Scales</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                12 roots · Diatonic, modes &amp; voicings
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenTuner}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500">
                <Disc className="size-3.5 text-amber-500" />
                <span>Guitar Tuner</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                Microphone pitch lock ±50¢
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenProgress}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500">
                <TrendingUp className="size-3.5 text-amber-500" />
                <span>Practice Coach</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                Longitudinal BKT &amp; SM-2 schedule
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenCommunity}
              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121215]/90 hover:border-emerald-500 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500">
                <Users className="size-3.5 text-emerald-500" />
                <span>Peer Benchmarks</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                Percentile curves across 12k takes
              </p>
            </button>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 2: ACOUSTIC DETECTION — MACRO ZOOM (0.09 -> 0.28)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            scale: m2Scale,
            opacity: m2Opacity,
            filter: m2Blur,
            rotateY: m2RotateY,
          }}
          className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none z-10 will-change-[transform,opacity,filter]"
        >
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold">
                Acoustic Detection
              </div>
              <h2 className="font-brand text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                Listens to your instrument directly in the browser.
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Play an acoustic guitar or upright piano without MIDI cables. The browser captures 22,050 Hz mono audio frames from your microphone, detects chord attack timing, and checks whether every note in the chord rang out clearly.
              </p>
              <div className="pt-3 grid grid-cols-3 gap-3 border-t border-zinc-200 dark:border-zinc-800 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-zinc-500 block text-[10px]">SAMPLE RATE</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">22.05 kHz</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">FRAME WINDOW</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">4096 Samples</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">PITCH ACCURACY</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">±5.0 Cents</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 text-xs font-mono tabular-nums">
                <span className="text-zinc-700 dark:text-zinc-300 font-bold">ACOUSTIC WAVEFORM &amp; CHORD TONES</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">TUNED: 440.00 Hz (A4)</span>
              </div>

              <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
                <line x1={0} y1={90} x2={600} y2={90} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth={1} />
                <line x1={110} y1={10} x2={110} y2={170} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 3" />
                <text x={116} y={24} fill="#D97706" fontSize="10" fontFamily="monospace">
                  CHORD ATTACK t = 0.0ms
                </text>

                <path
                  d="M 0 90 L 95 90 L 110 90 Q 122 12, 134 90 T 158 90 Q 170 22, 182 90 T 206 90 Q 218 32, 230 90 T 254 90 Q 266 42, 278 90 T 302 90 Q 314 50, 326 90 T 350 90 Q 362 58, 374 90 T 398 90 Q 410 64, 422 90 T 446 90 Q 458 70, 470 90 T 494 90 Q 506 75, 518 90 T 542 90 L 600 90"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.2}
                />
              </svg>

              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-12 gap-1.5 text-center font-mono text-[10px] tabular-nums">
                {[
                  { pc: 'C', val: 88, active: true },
                  { pc: 'C#', val: 6, active: false },
                  { pc: 'D', val: 12, active: false },
                  { pc: 'Eb', val: 79, active: true },
                  { pc: 'E', val: 9, active: false },
                  { pc: 'F', val: 14, active: false },
                  { pc: 'F#', val: 5, active: false },
                  { pc: 'G', val: 94, active: true },
                  { pc: 'Ab', val: 11, active: false },
                  { pc: 'A', val: 8, active: false },
                  { pc: 'Bb', val: 72, active: true },
                  { pc: 'B', val: 7, active: false },
                ].map((bin) => (
                  <div key={bin.pc} className="flex flex-col items-center gap-1">
                    <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xs flex items-end p-0.5 border border-zinc-200 dark:border-zinc-800">
                      <div
                        className={`w-full rounded-xs ${
                          bin.active ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        style={{ height: `${bin.val}%` }}
                      />
                    </div>
                    <span className={bin.active ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-zinc-500'}>
                      {bin.pc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 3: MISTAKE PINPOINTING — HORIZONTAL TRACKING PAN (0.24 -> 0.45)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            opacity: m3Opacity,
            scale: m3Scale,
          }}
          className="absolute inset-0 flex flex-col justify-center pointer-events-none z-10 overflow-hidden"
        >
          <motion.div
            style={{ x: m3ParallaxBgX }}
            className="flex items-center gap-48 px-24 text-zinc-300/70 dark:text-zinc-800/50 font-mono text-6xl sm:text-7xl font-bold whitespace-nowrap select-none mb-6"
          >
            <span>MEASURE 1</span>
            <span>MEASURE 2</span>
            <span>MEASURE 3</span>
            <span className="text-red-500/30 dark:text-red-900/50">MEASURE 4 · LATE CHANGE</span>
          </motion.div>

          <motion.div
            style={{ x: m3X }}
            className="flex items-stretch gap-6 px-24 w-max"
          >
            {[
              {
                measure: 'Measure 1',
                chord: 'G Major',
                expected: 'G3 · B3 · D4 · G4',
                detected: 'G3 · B3 · D4 · G4',
                offset: 'On time (-2ms)',
                status: 'CLEAN',
                isFault: false,
                detail: 'Played right on the beat with all four chord tones ringing clearly.',
              },
              {
                measure: 'Measure 2',
                chord: 'D Major',
                expected: 'D3 · F#3 · A3 · D4',
                detected: 'D3 · F#3 · A3 · D4',
                offset: 'On time (+4ms)',
                status: 'CLEAN',
                isFault: false,
                detail: 'Smooth finger transition from G to D. The F#3 major third is clear.',
              },
              {
                measure: 'Measure 3',
                chord: 'A Minor',
                expected: 'A2 · E3 · A3 · C4',
                detected: 'A2 · E3 · A3 · C4',
                offset: 'On time (-6ms)',
                status: 'CLEAN',
                isFault: false,
                detail: 'Natural timing within ±6ms of the beat.',
              },
              {
                measure: 'Measure 4',
                chord: 'C Major',
                expected: 'C3 · E3 · G3 · C4',
                detected: 'C3 · G3 · C4 (Missed E3)',
                offset: '+142ms Late',
                status: 'LATE SHIFT + MISSED 3RD',
                isFault: true,
                detail:
                  'Shifting from A Minor to C Major took an extra 142ms and muted E3 (the major third).',
              },
            ].map((item) => (
              <div
                key={item.measure}
                className={`w-[400px] shrink-0 rounded-xl border p-6 flex flex-col justify-between shadow-lg ${
                  item.isFault
                    ? 'border-red-500/80 bg-red-50/95 dark:bg-red-950/25'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                    <span className="text-zinc-500 dark:text-zinc-400">{item.measure}</span>
                    <span
                      className={`font-bold ${
                        item.isFault ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className="font-brand text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {item.chord}
                    </h3>
                    <span
                      className={`font-mono text-base font-bold tabular-nums ${
                        item.isFault ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.offset}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">SCORE NOTES:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{item.expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">YOU PLAYED:</span>
                      <span
                        className={
                          item.isFault
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {item.detected}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-6 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            style={{ x: m3ParallaxFgX }}
            className="mt-8 px-24 flex items-center gap-8 text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest whitespace-nowrap font-semibold"
          >
            <span>See exactly which chord change hesitated and which finger muted a string</span>
            <span>→</span>
            <span>Am → C Transition (+142ms) · Missed E3</span>
          </motion.div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 4: TIMING ALIGNMENT — NEEDLEMAN-WUNSCH MATRIX (0.41 -> 0.57)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            y: m4Y,
            rotateX: m4RotateX,
            scale: m4Scale,
            opacity: m4Opacity,
            filter: m4Blur,
          }}
          className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none z-10 will-change-[transform,opacity,filter]"
        >
          <div
            data-testid="mechanics-needleman-wunsch"
            className="w-full max-w-5xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold">
                Needleman-Wunsch Sequence Alignment
              </div>
              <h2 className="font-brand text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                One hesitation won’t ruin the rest of your take.
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Standard rhythm games mark every subsequent chord wrong if you pause for a split second. Sonus uses Needleman-Wunsch sequence alignment to match your played chords against the score, isolating a single late change without penalizing the bars that followed.
              </p>
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 dark:text-zinc-400 space-y-1 tabular-nums">
                <div>CHORD MATCH REWARD: +2.0 · PITCH SET SIMILARITY</div>
                <div>TIMING GAP PENALTY: -1.5 · ONSET OFFSET Δt (ms)</div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-5 font-mono text-xs tabular-nums">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                <span>SCORE-TO-PERFORMANCE ALIGNMENT</span>
                <span className="text-amber-600 dark:text-amber-500 font-bold">MATCHED PATH</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2 text-zinc-500 border border-zinc-200 dark:border-zinc-800">BAR \ PLAYED</div>
                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">G (0.00s)</div>
                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">D (3.00s)</div>
                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">Am (5.99s)</div>
                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">C (9.14s)</div>

                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">M1: G</div>
                <div className="p-2 rounded border border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  -2ms ✓
                </div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">0.5</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">-1.0</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">-2.5</div>

                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">M2: D</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">0.5</div>
                <div className="p-2 rounded border border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  +4ms ✓
                </div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">2.5</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">1.0</div>

                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">M3: Am</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">-1.0</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">2.5</div>
                <div className="p-2 rounded border border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  -6ms ✓
                </div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">4.5</div>

                <div className="p-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">M4: C</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">-2.5</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">1.0</div>
                <div className="p-2 text-zinc-400 dark:text-zinc-600 border border-zinc-200/60 dark:border-zinc-900">4.5</div>
                <div className="p-2 rounded border border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  +142ms Lag
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 5: HABIT TRACKING Across Sessions (0.53 -> 0.72)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            scale: m5Scale,
            y: m5Y,
            opacity: m5Opacity,
            filter: m5Blur,
          }}
          className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none z-10 will-change-[transform,opacity,filter]"
        >
          <div className="w-full max-w-6xl space-y-8">
            <div className="max-w-3xl space-y-3">
              <div className="text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold">
                Multi-Session Habit Tracking (EWMA &amp; CUSUM)
              </div>
              <h2 className="font-brand text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                One slip is a fluke. Three in a row is a motor habit.
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sonus tracks your chord transitions across practice sessions using Exponentially Weighted Moving Averages (EWMA) and Page’s CUSUM change-point detection—distinguishing a random slip from a recurring finger bottleneck that needs targeted practice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              {[
                {
                  type: 'Late Chord Shift',
                  title: 'Transition Latency',
                  context: 'Am → C (+142ms avg)',
                  formula: 'EWMA α = 0.35 · BKT P(Mastery)',
                  desc: 'Flags specific chord pairs where your fingers consistently arrive late after the barline.',
                  severity: 'High Priority',
                  accent: 'border-red-500/50',
                },
                {
                  type: 'Muted Chord Tone',
                  title: 'Dropped Third or Root',
                  context: 'C Major : Missed E4 (3rd)',
                  formula: 'Harmonic Role Weight: 3rd = 5.0',
                  desc: 'Highlights when an inner finger accidentally mutes or skips the note that defines the chord quality.',
                  severity: 'High Priority',
                  accent: 'border-amber-500/50',
                },
                {
                  type: 'Rushing the Beat',
                  title: 'Early Downbeat Attack',
                  context: 'Chorus Bars (-38ms early)',
                  formula: 'Subdivision Click Recommended',
                  desc: 'Detects when you gradually speed up ahead of the metronome during familiar passages.',
                  severity: 'Moderate',
                  accent: 'border-zinc-300 dark:border-zinc-700',
                },
                {
                  type: 'Skill Breakthrough',
                  title: 'CUSUM Change-Point',
                  context: 'G → D Locked (±11ms)',
                  formula: 'SM-2 Review Interval: 6 Days',
                  desc: 'Detects the exact session where a difficult transition clicked into muscle memory.',
                  severity: 'Mastered',
                  accent: 'border-emerald-500/50',
                },
              ].map((h) => (
                <div
                  key={h.title}
                  className={`rounded-xl border bg-white/95 dark:bg-[#121215]/95 p-5 shadow-md flex flex-col justify-between gap-4 ${h.accent}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{h.type.toUpperCase()}</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">{h.severity}</span>
                    </div>
                    <h3 className="font-brand text-lg font-bold text-zinc-900 dark:text-zinc-100">{h.title}</h3>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">{h.context}</div>
                    <p className="text-xs font-sans text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                      {h.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
                    {h.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 6: PRACTICE TEMPO RAMP & SOUND ENGINE (0.68 -> 0.86)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            y: m6Y,
            scale: m6Scale,
            opacity: m6Opacity,
            filter: m6Blur,
          }}
          className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none z-10 will-change-[transform,opacity,filter]"
        >
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: 4-Stage Tempo Ramp Remediation Loop */}
            <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-7 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold">
                  Targeted Practice Loops &amp; Tempo Ramping
                </div>
                <h2 className="font-brand text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Isolate the tricky two bars and build your speed step by step.
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Instead of playing the whole song from the top over and over, Sonus loops just the two measures where you hesitated—starting at 70% tempo so your fingers can pre-position cleanly, then stepping up to full tempo as your accuracy locks in.
                </p>
              </div>

              <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                {[
                  { stage: 'STEP 1', label: 'Slow Loop (70%)', bpm: '56 BPM', desc: 'Prepare finger shapes' },
                  { stage: 'STEP 2', label: 'Medium (85%)', bpm: '68 BPM', desc: 'Smooth out the shift' },
                  { stage: 'STEP 3', label: 'Song Tempo (100%)', bpm: '80 BPM', desc: 'Original score speed' },
                  { stage: 'STEP 4', label: 'Mastery (105%)', bpm: '84 BPM', desc: 'Lock in confidence' },
                ].map((st, i) => (
                  <div
                    key={st.stage}
                    className={`p-3.5 rounded-lg border ${
                      i === 0
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B]'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-500 block">{st.stage}</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">{st.bpm}</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">{st.label}</span>
                    <span className="text-[10px] font-sans text-zinc-600 dark:text-zinc-400 mt-2 block">{st.desc}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <span>BEFORE LOOP: Am → C (+142ms late)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">AFTER 6 REPS: +18ms (ON TIME)</span>
              </div>
            </div>

            {/* Right: Physical Modeling Synthesis Specs (Karplus-Strong & Piano Partials) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div
                data-testid="mechanics-karplus-strong"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-6 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-500 font-semibold">
                    <span>KARPLUS-STRONG GUITAR AUDIO</span>
                    <span>6-STRING TAB &amp; FRETBOARD</span>
                  </div>
                  <h3 className="font-brand text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Realistic Acoustic Guitar Reference
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Synthesizes plucked guitar strings in real time so you can hear how each chord voicing and strumming pattern should sound at any tempo without pitch distortion.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span>Side-by-Side Fretboard Guide</span>
                  {onOpenTuner && (
                    <button
                      type="button"
                      onClick={onOpenTuner}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Disc className="size-3" />
                      <span>Tune Guitar ↗</span>
                    </button>
                  )}
                </div>
              </div>

              <div
                data-testid="mechanics-piano-partials"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-6 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>MULTI-PARTIAL PIANO AUDIO</span>
                    <span>FALLING KEYS &amp; GRAND STAFF</span>
                  </div>
                  <h3 className="font-brand text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Dynamic Grand Staff &amp; Synthesia Waterfall Keys
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Practice with falling Left-Hand (Amber) and Right-Hand (Emerald) key ribbons or traditional sheet music, complete with interactive 25-key hand-position diagrams.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span>Wooden Metronome · Instant Speed Ramp</span>
                  {onOpenTheory && (
                    <button
                      type="button"
                      onClick={onOpenTheory}
                      className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen className="size-3" />
                      <span>Chords &amp; Scales ↗</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────────────
            SECTION 7: SONG LIBRARY & LIVE SOUND PREVIEW (0.82 -> 1.00)
           ───────────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            scale: m7Scale,
            y: m7Y,
            opacity: m7Opacity,
            filter: m7Blur,
            pointerEvents: m7PointerEvents,
          }}
          className="absolute inset-0 flex items-center justify-center px-6 z-20 pt-10 will-change-[transform,opacity,filter]"
        >
          <div className="w-full max-w-6xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
            {/* Top Bar: Sound Preview Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold">
                  Song Library &amp; Sound Preview
                </div>
                <h2 className="font-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  Choose a piece to practice or preview the instrument audio.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => triggerDspAudition('piano')}
                  className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Volume2 className="size-3.5 text-amber-500" />
                  <span>Preview Piano Chord</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDspAudition('guitar')}
                  className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Activity className="size-3.5 text-emerald-500" />
                  <span>Preview Guitar Strum</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDspAudition('a440')}
                  className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Disc className="size-3.5 text-amber-500" />
                  <span>A440 Tuning Note</span>
                </button>
              </div>
            </div>

            {/* Live Audio Readout Strip */}
            <div className="px-4 py-2 rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800/90 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
              <div className="flex items-center gap-2 truncate">
                <Sliders className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{lastAuditionedLabel}</span>
              </div>
              <span className="text-[10px] text-zinc-500 hidden sm:inline shrink-0">
                READY FOR PRACTICE
              </span>
            </div>

            {/* Repertoire Selector Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Instrument Filter & Piece List */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInstrument('piano')
                      const firstPiano = BUILTIN_FULL_SONGS.find((s) => s.instrument === 'piano')
                      if (firstPiano) {
                        setSelectedSongId(firstPiano.id)
                        onSelectPiece?.(firstPiano.title, firstPiano.id)
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-md text-center font-bold transition-colors cursor-pointer ${
                      selectedInstrument === 'piano'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    PIANO PIECES
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInstrument('guitar')
                      const firstGuitar = BUILTIN_FULL_SONGS.find((s) => s.instrument === 'guitar')
                      if (firstGuitar) {
                        setSelectedSongId(firstGuitar.id)
                        onSelectPiece?.(firstGuitar.title, firstGuitar.id)
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-md text-center font-bold transition-colors cursor-pointer ${
                      selectedInstrument === 'guitar'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    GUITAR PIECES
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredSongs.map((song) => {
                    const isSelected =
                      song.id === currentSong.id || song.title === activePieceTitle
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => {
                          setSelectedSongId(song.id)
                          onSelectPiece?.(song.title, song.id)
                        }}
                        className={`p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-zinc-100'
                            : 'border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-brand font-bold text-sm truncate">
                            {song.title}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                            {song.progression?.key || 'Standard'} · {song.tempo_bpm} BPM ·{' '}
                            {song.progression?.chords?.length ?? 8} Measures
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-500 font-bold shrink-0">
                          {isSelected ? 'SELECTED' : 'CHOOSE'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right: Selected Piece Specification & Studio Launch */}
              <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-6 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">
                        SELECTED PRACTICE PIECE
                      </span>
                      <h3 className="font-brand text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {currentSong.title}
                      </h3>
                    </div>
                    <div className="text-right font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                      <div className="text-zinc-900 dark:text-zinc-100 font-bold">{currentSong.tempo_bpm} BPM</div>
                      <div>{currentSong.progression?.key || 'C Major'}</div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {currentSong.description ||
                      'Complete progression with hand voicings, chord diagrams, and measure-by-measure timing feedback.'}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      CHORD PROGRESSION BY MEASURE:
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                      {(currentSong.progression?.chords || []).slice(0, 10).map((c, i) => (
                        <span
                          key={`${c.name}-${i}`}
                          className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-800 dark:text-zinc-200"
                        >
                          M{i + 1}: <b>{c.name}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-mono text-zinc-500">
                    Opens in the Practice Room with chord preparation diagrams and loop brackets.
                  </div>
                  <button
                    type="button"
                    data-testid="enter-studio-primary-btn"
                    onClick={() => onEnterStudio?.(currentSong.id)}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.3)] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Practice This Piece</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
