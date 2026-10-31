import React, { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'
import { PaperGrainOverlay } from './paper-grain-overlay'
import { StaffScrollProgress } from './staff-scroll-progress'
import { MastheadNav } from './masthead-nav'
import { KineticRevealText } from './kinetic-reveal-text'
import { MagneticCaliperButton } from './magnetic-caliper-button'
import { FlowingPracticeStand } from '@/components/practice/flowing-practice-stand'
import { HowItWorksGuide } from './how-it-works-guide'
import { DiagnosticsBento } from './diagnostics-bento'
import { RepertoireExplorer, type RepertoireItem } from './repertoire-explorer'
import { TuningForkChamber } from './tuning-fork-chamber'
import { ColophonFooter } from './colophon-footer'
import { resolveChordVoicing, type VoicingDefinition } from '@/lib/music/chord-voicings'
import { ArrowRight, Volume2 } from 'lucide-react'

export type LandingPageProps = {
  onEnterStudio?: () => void
  onSignIn?: () => void
  isSignedIn?: boolean
  userButtonSlot?: React.ReactNode
}

export function LandingPage({
  onEnterStudio,
  onSignIn,
  isSignedIn = false,
  userButtonSlot,
}: LandingPageProps): React.JSX.Element {
  const prefersReduced = useReducedMotion()

  // Selected piece for hero stand
  const [heroPieceTitle, setHeroPieceTitle] = useState('Chopin Nocturne in E-flat')
  const [heroKeySignature, setHeroKeySignature] = useState('Eb Major')
  const [heroInstrument, setHeroInstrument] = useState<'guitar' | 'piano'>('piano')
  const [heroProgression, setHeroProgression] = useState<VoicingDefinition[]>([
    resolveChordVoicing('Eb'),
    resolveChordVoicing('Cm'),
    resolveChordVoicing('Fm'),
    resolveChordVoicing('Bb7'),
  ])

  // Initialize Lenis smooth scroll
  const lenisRef = React.useRef<Lenis | null>(null)
  useEffect(() => {
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [prefersReduced])

  const handleSelectRepertoire = (piece: RepertoireItem) => {
    setHeroPieceTitle(piece.title)
    setHeroKeySignature(piece.key)
    setHeroInstrument(piece.instrument)
    const voicings = piece.chords.map((c) => resolveChordVoicing(c))
    setHeroProgression(voicings)

    // Smooth scroll up to hero stand with proper offset
    const el = document.getElementById('hero-stand')
    if (lenisRef.current && el) {
      lenisRef.current.scrollTo(el, { offset: -90 })
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F7F5F0] dark:bg-[#141312] text-[#242321] dark:text-[#EDE8DF] font-sans selection:bg-[#C5A059]/30 selection:text-[#242321] dark:selection:text-[#EDE8DF] transition-colors duration-200">
      {/* 1. Archival Paper Vellum Grain Overlay */}
      <PaperGrainOverlay />

      {/* 2. 5-Line Musical Staff Scroll Progress Bar with Moving G-Clef */}
      <StaffScrollProgress />

      {/* 3. Archival Masthead Navigation */}
      <MastheadNav
        onEnterStudio={onEnterStudio}
        onSignIn={onSignIn}
        isSignedIn={isSignedIn}
        userButtonSlot={userButtonSlot}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* ─────────────────────────────────────────────────────────────
            HERO SECTION: EPIGRAPH, KINETIC REVEAL, & LIVE NOTATION STAND
           ───────────────────────────────────────────────────────────── */}
        <section aria-label="Sonus Hero" className="flex flex-col gap-8 pt-2">
          {/* Top Chopin Epigraph */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs font-sans text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-3.5">
            <span className="font-bold text-[#C5A059] flex items-center gap-1.5 font-mono">
              <span>§</span>
              <span>FRÉDÉRIC CHOPIN</span>
            </span>
            <span className="hidden sm:inline text-[#D9D3C7] dark:text-[#38342E]">•</span>
            <span className="italic font-serif text-xs sm:text-sm text-[#524D44] dark:text-[#C4BEB1]">
              “Simplicity is the final achievement. After one has played a vast quantity of notes and more notes, it is simplicity that emerges as the crowning reward of art.”
            </span>
          </div>

          {/* Main Kinetic Headline & Mission */}
          <div className="max-w-4xl space-y-4">
            <KineticRevealText
              text="Practice piano and guitar with real-time feedback."
              as="h1"
              className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#242321] dark:text-[#EDE8DF] leading-[1.12]"
              italicLastWord={true}
            />

            <p className="max-w-2xl text-sm sm:text-base text-[#736E65] dark:text-[#A39C8F] font-sans leading-relaxed">
              Your laptop or phone microphone listens as you play. Watch notes and tablature scroll in real time with millisecond timing accuracy. No extra hardware or cables required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <MagneticCaliperButton
                onClick={onSignIn || onEnterStudio}
                variant="primary"
              >
                <span>Start practicing free</span>
                <ArrowRight className="h-4 w-4" />
              </MagneticCaliperButton>

              <MagneticCaliperButton
                onClick={() => {
                  const el = document.getElementById('tuning-chamber')
                  if (lenisRef.current && el) {
                    lenisRef.current.scrollTo(el, { offset: -90 })
                  } else {
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                variant="secondary"
              >
                <Volume2 className="h-4 w-4 text-[#C5A059]" />
                <span>Audition A440 Fork</span>
              </MagneticCaliperButton>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              ZERO-DUPLICATION LIVE NOTATION STAND COMPONENT
              Direct reuse of FlowingPracticeStand in mode="hero"
             ───────────────────────────────────────────────────────── */}
          <div
            id="hero-stand"
            className="flex flex-col gap-3 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-4 sm:p-6 shadow-sm transition-colors duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DDD3] dark:border-[#38342E] pb-3 text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3B6E57] dark:bg-[#689F84] animate-pulse" />
                <span className="font-bold text-[#242321] dark:text-[#EDE8DF]">
                  LIVE NOTATION STAND PREVIEW
                </span>
                <span className="text-[#D9D3C7] dark:text-[#38342E]">•</span>
                <span>Sub-30ms local pitch detection</span>
              </div>
              <div className="text-[11px] text-[#A09A8F]">
                Switch instrument or pick from repertoire below
              </div>
            </div>

            <FlowingPracticeStand
              mode="hero"
              instrument={heroInstrument}
              onInstrumentChange={setHeroInstrument}
              tempoBpm={76}
              pieceTitle={heroPieceTitle}
              keySignature={heroKeySignature}
              progression={heroProgression}
            />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            HOW IT WORKS: 3 PLAIN STEPS
           ───────────────────────────────────────────────────────────── */}
        <HowItWorksGuide />

        {/* ─────────────────────────────────────────────────────────────
            PRACTICE DIAGNOSTICS BENTO
           ───────────────────────────────────────────────────────────── */}
        <DiagnosticsBento />

        {/* ─────────────────────────────────────────────────────────────
            REPERTOIRE EXPLORER
           ───────────────────────────────────────────────────────────── */}
        <RepertoireExplorer
          onSelectPiece={handleSelectRepertoire}
          activePieceTitle={heroPieceTitle}
        />

        {/* ─────────────────────────────────────────────────────────────
            ACOUSTIC TUNING CHAMBER (A4 = 440 HZ)
           ───────────────────────────────────────────────────────────── */}
        <TuningForkChamber />
      </main>

      {/* ─────────────────────────────────────────────────────────────
          COLOPHON & FOOTER
         ───────────────────────────────────────────────────────────── */}
      <ColophonFooter />
    </div>
  )
}
