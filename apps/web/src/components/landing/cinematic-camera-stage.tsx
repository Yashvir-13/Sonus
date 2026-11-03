import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { ArrowRight, Sparkles, Shield } from 'lucide-react'

export interface CinematicCameraStageProps {
  onEnterStudio?: () => void
  onSelectPiece?: (title: string) => void
  activePieceTitle?: string
}

export function CinematicCameraStage({
  onEnterStudio,
  onSelectPiece,
  activePieceTitle = 'Chopin Nocturne in E-flat',
}: CinematicCameraStageProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SCENE 1: ARCHITECTURAL WORDMARK & EXPANDING KERNING (0.00 -> 0.38)
  // ─────────────────────────────────────────────────────────────────────────────
  const scene1LetterSpacing = useTransform(scrollYProgress, [0, 0.32], ['-0.03em', '0.45em'])
  const scene1Scale = useTransform(scrollYProgress, [0, 0.32], [1.0, 3.2])
  const scene1Z = useTransform(scrollYProgress, [0, 0.32], [0, 500])
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.20, 0.32], [1, 0.9, 0])
  const scene1Blur = useTransform(
    scrollYProgress,
    [0, 0.22, 0.32],
    ['blur(0px)', 'blur(3px)', 'blur(16px)']
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SCENE 2: FLOATING URTEXT SCORE & CHOPIN EPIGRAPH (0.24 -> 0.68)
  // ─────────────────────────────────────────────────────────────────────────────
  const scene2Z = useTransform(scrollYProgress, [0.24, 0.44, 0.64], [-600, 0, 500])
  const scene2Scale = useTransform(scrollYProgress, [0.24, 0.44, 0.64], [0.6, 1.0, 1.6])
  const scene2Opacity = useTransform(scrollYProgress, [0.24, 0.38, 0.52, 0.64], [0, 1, 1, 0])
  const scene2RotateX = useTransform(scrollYProgress, [0.24, 0.44, 0.64], [18, 0, -14])
  const scene2Blur = useTransform(
    scrollYProgress,
    [0.24, 0.36, 0.52, 0.64],
    ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(14px)']
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SCENE 3: CONSERVATORY ENTRANCE & REPERTOIRE (0.58 -> 1.00)
  // ─────────────────────────────────────────────────────────────────────────────
  const scene3Z = useTransform(scrollYProgress, [0.58, 0.80, 1.0], [-400, 0, 0])
  const scene3Opacity = useTransform(scrollYProgress, [0.58, 0.72, 1.0], [0, 1, 1])
  const scene3Scale = useTransform(scrollYProgress, [0.58, 0.80, 1.0], [0.8, 1.0, 1.0])

  // Scroll Clef indicator moving along vertical staff
  const staffIndicatorY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  if (prefersReduced) {
    // Accessible fallback without 3D transforms
    return (
      <div className="w-full flex flex-col gap-16 py-16 px-4 sm:px-8 max-w-5xl mx-auto text-center font-serif text-[#242321]">
        <h1 className="text-7xl font-bold tracking-tight">SONUS</h1>
        <p className="text-xl max-w-2xl mx-auto font-sans text-[#736E65]">
          The 19th-century conservatory music stand, powered by sub-30ms browser acoustics.
        </p>
        <button
          type="button"
          onClick={onEnterStudio}
          className="self-center px-8 py-3.5 rounded-xl bg-[#242321] text-[#FCFBF8] font-mono text-sm font-bold shadow-md hover:bg-[#3D3A36]"
        >
          Enter Practice Studio
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="cinematic-camera-stage"
      className="relative w-full h-[320vh] bg-[#F7F5F0] dark:bg-[#141312] text-[#242321] dark:text-[#EDE8DF] transition-colors duration-200"
    >
      {/* Sticky 100vh 3D Camera Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center [perspective:1200px] select-none">
        {/* Subtle Archival Margin Hairlines */}
        <div className="absolute inset-x-8 top-12 bottom-12 border border-[#E2DDD3] dark:border-[#38342E] pointer-events-none rounded-2xl opacity-60" />

        {/* Vertical Scroll Telemetry Indicator (Left Margin) */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2 pointer-events-none z-30">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#8A857A]">
            SCROLL
          </span>
          <div className="w-px h-28 bg-[#E2DDD3] dark:bg-[#38342E] relative overflow-hidden">
            <motion.div
              style={{ top: staffIndicatorY }}
              className="absolute left-0 w-full h-6 bg-[#C5A059] shadow-sm -translate-y-1/2"
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#C5A059]">𝄞</span>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SCENE 1: ARCHITECTURAL WORDMARK & KINETIC KERNING
           ───────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            letterSpacing: scene1LetterSpacing,
            scale: scene1Scale,
            z: scene1Z,
            opacity: scene1Opacity,
            filter: scene1Blur,
          }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none will-change-[transform,opacity,letter-spacing]"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#C5A059] mb-4">
            <span>§</span>
            <span>ARCHIVAL MUSIC DESK</span>
            <span>§</span>
          </div>

          <h1
            data-testid="expanding-wordmark"
            className="font-brand font-black text-7xl sm:text-9xl md:text-[13rem] leading-none text-[#242321] uppercase drop-shadow-xs"
          >
            SONUS
          </h1>

          <p className="mt-6 text-xs sm:text-sm font-mono tracking-[0.2em] text-[#736E65] uppercase max-w-xl">
            The Conservatory Practice Stand • Scroll to Enter the Score ↓
          </p>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────
            SCENE 2: FLOATING URTEXT SCORE & CHOPIN EPIGRAPH
           ───────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            z: scene2Z,
            scale: scene2Scale,
            opacity: scene2Opacity,
            rotateX: scene2RotateX,
            filter: scene2Blur,
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none will-change-[transform,opacity]"
        >
          <div className="w-full max-w-3xl p-8 sm:p-12 rounded-3xl bg-[#FAF8F3]/90 border border-[#E2DDD3] shadow-xl backdrop-blur-md flex flex-col items-center text-center relative overflow-hidden">
            {/* Calligraphic Urtext Brace & Staff Vector */}
            <svg
              viewBox="0 0 600 80"
              className="w-full max-w-md h-16 stroke-[#242321] opacity-75 mb-6"
            >
              {/* Grand Staff 5 lines */}
              {[15, 23, 31, 39, 47].map((y) => (
                <line key={`st-${y}`} x1={40} y1={y} x2={560} y2={y} strokeWidth={1} />
              ))}
              {/* Treble Clef Symbol */}
              <text
                x="50"
                y="45"
                fontFamily="serif"
                fontSize="38"
                fill="#242321"
                className="select-none"
              >
                𝄞
              </text>
              {/* Key Signature Accidentals */}
              <text
                x="85"
                y="31"
                fontFamily="serif"
                fontSize="20"
                fill="#242321"
                className="select-none"
              >
                ♭
              </text>
              <text
                x="95"
                y="23"
                fontFamily="serif"
                fontSize="20"
                fill="#242321"
                className="select-none"
              >
                ♭
              </text>
              <text
                x="105"
                y="39"
                fontFamily="serif"
                fontSize="20"
                fill="#242321"
                className="select-none"
              >
                ♭
              </text>
              {/* Floating golden musical notes */}
              <circle cx="210" cy="31" r="5" fill="#9A2A2A" />
              <line x1="215" y1="31" x2="215" y2="10" strokeWidth="1.5" />
              <circle cx="310" cy="23" r="5" fill="#3B6E57" />
              <line x1="315" y1="23" x2="315" y2="6" strokeWidth="1.5" />
              <circle cx="410" cy="39" r="5" fill="#C5A059" />
              <line x1="415" y1="39" x2="415" y2="16" strokeWidth="1.5" />
            </svg>

            <span className="text-xs font-mono font-bold tracking-widest text-[#C5A059] uppercase mb-3">
              § FRÉDÉRIC CHOPIN
            </span>

            <blockquote className="text-xl sm:text-3xl font-serif font-light text-[#242321] dark:text-[#EDE8DF] leading-relaxed max-w-2xl italic">
              “Simplicity is the final achievement. After one has played a vast quantity of notes and more notes, it is simplicity that emerges as the crowning reward of art.”
            </blockquote>

            <div className="mt-6 flex items-center gap-3 text-xs font-mono text-[#8A857A]">
              <span>Needleman-Wunsch Alignment</span>
              <span>•</span>
              <span>Sub-30ms Precision</span>
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────
            SCENE 3: CONSERVATORY ENTRANCE & REPERTOIRE
           ───────────────────────────────────────────────────────────── */}
        <motion.div
          style={{
            z: scene3Z,
            opacity: scene3Opacity,
            scale: scene3Scale,
          }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 z-20"
        >
          <div className="w-full max-w-4xl p-6 sm:p-10 rounded-3xl bg-[#FCFBF8] dark:bg-[#1E1C1A] border border-[#E2DDD3] dark:border-[#38342E] shadow-2xl flex flex-col gap-6 text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F3] dark:bg-[#2A2723] border border-[#E2DDD3] dark:border-[#38342E] text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
                <Sparkles className="size-3.5 text-[#C5A059]" />
                <span>ACOUSTIC MIR TRACKING • NO HARDWARE REQUIRED</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF] tracking-tight">
                Step up to the Practice Stand.
              </h2>

              <p className="text-sm sm:text-base text-[#736E65] dark:text-[#A39C8F] max-w-2xl mx-auto leading-relaxed">
                Your microphone listens as you play. Watch notes scroll continuously with precision caliper sightlines, hand-color illumination, and instant conservatory coaching.
              </p>
            </div>

            {/* Quick Repertoire Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-xs">
              <span className="text-[#8A857A] mr-1">Select Piece:</span>
              {[
                { title: 'Chopin Nocturne in E-flat', inst: 'Piano' },
                { title: 'Satie Gymnopédie No. 1', inst: 'Piano' },
                { title: 'Bach Prelude in C Major', inst: 'Piano' },
                { title: "Knockin' Cadence", inst: 'Guitar' },
              ].map((p) => {
                const isSelected = p.title === activePieceTitle
                return (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => onSelectPiece?.(p.title)}
                    className={`px-3 py-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#242321] text-[#FCFBF8] border-[#242321] font-bold shadow-xs'
                        : 'bg-[#FAF8F3] dark:bg-[#24221F] text-[#736E65] dark:text-[#A39C8F] border-[#E2DDD3] dark:border-[#38342E] hover:border-[#C5A059] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className="opacity-60 ml-1.5 text-[10px]">({p.inst})</span>
                  </button>
                )
              })}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                data-testid="enter-studio-primary-btn"
                onClick={onEnterStudio}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#C5A059] hover:bg-[#D4B36F] text-[#141312] font-mono text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>ENTER PRACTICE STUDIO</span>
                <ArrowRight className="size-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-[#8A857A]">
                <Shield className="size-3.5 text-[#3B6E57]" />
                <span>Zero audio transmitted to cloud • 100% on-device</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
