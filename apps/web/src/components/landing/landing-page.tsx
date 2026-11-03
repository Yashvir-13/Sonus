import React, { useEffect, useState, useRef } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'
import { PaperGrainOverlay } from './paper-grain-overlay'
import { StaffScrollProgress } from './staff-scroll-progress'
import { MastheadNav } from './masthead-nav'
import { CinematicCameraStage } from './cinematic-camera-stage'
import { MechanicsOfTime } from './mechanics-of-time'
import { RepertoireExplorer, type RepertoireItem } from './repertoire-explorer'
import { ColophonFooter } from './colophon-footer'
import { Piano, Guitar, ArrowRight } from 'lucide-react'

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
  const [activeRepertoireTitle, setActiveRepertoireTitle] = useState('Chopin Nocturne in E-flat')

  // Initialize Lenis smooth scroll
  const lenisRef = useRef<Lenis | null>(null)
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
    setActiveRepertoireTitle(piece.title)
    if (onEnterStudio) {
      onEnterStudio()
    }
  }

  const handleEnter = () => {
    if (onEnterStudio) {
      onEnterStudio()
    } else if (onSignIn) {
      onSignIn()
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F7F5F0] dark:bg-[#141312] text-[#242321] dark:text-[#EDE8DF] font-sans selection:bg-[#C5A059]/30 selection:text-[#242321] dark:selection:text-[#EDE8DF] transition-colors duration-200">
      {/* 1. Archival Paper Vellum Grain Overlay */}
      <PaperGrainOverlay />

      {/* 2. 5-Line Musical Staff Scroll Progress Bar with Moving G-Clef */}
      <StaffScrollProgress />

      {/* 3. Archival Masthead Navigation with Clerk UserButton */}
      <MastheadNav
        onEnterStudio={onEnterStudio}
        onSignIn={onSignIn}
        isSignedIn={isSignedIn}
        userButtonSlot={userButtonSlot}
      />

      {/* ─────────────────────────────────────────────────────────────
          CINEMATIC CAMERA STAGE (SCROLL-DRIVEN 3D DOLLY & SPATIAL FLY-THROUGH)
         ───────────────────────────────────────────────────────────── */}
      <CinematicCameraStage
        onEnterStudio={handleEnter}
        onSelectPiece={(title) => setActiveRepertoireTitle(title)}
        activePieceTitle={activeRepertoireTitle}
      />

      {/* ─────────────────────────────────────────────────────────────
          EDITORIAL CRAFTSMANSHIP & REPERTOIRE
         ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-24 px-4 sm:px-6 lg:px-8 py-16">
        {/* Editorial Discipline Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Piano Discipline Card */}
          <div
            onClick={handleEnter}
            className="group cursor-pointer rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-[#C5A059] dark:hover:border-[#C5A059] transition-all shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#3B6E57] dark:text-[#529375]">
                  <Piano className="size-4" />
                  <span>Acoustic &amp; Digital Piano</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#2A2723] text-[#736E65] dark:text-[#A39C8F]">
                  Waterfall &amp; Grand Staff
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF]">
                Dynamic Grand Staff &amp; Synthesia Waterfall Keys
              </h3>

              <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                Switch instantly between traditional Urtext notation with Treble and Bass clefs, or falling note ribbons with illuminated Left-Hand (Terracotta) and Right-Hand (Patina Jade) guidance.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C5A059] group-hover:translate-x-1 transition-transform">
              <span>Open Piano Studio Cockpit</span>
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Guitar Discipline Card */}
          <div
            onClick={handleEnter}
            className="group cursor-pointer rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-[#C5A059] dark:hover:border-[#C5A059] transition-all shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9A2A2A] dark:text-[#C45E5E]">
                  <Guitar className="size-4" />
                  <span>Classical &amp; Steel-String</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#2A2723] text-[#736E65] dark:text-[#A39C8F]">
                  6-String Tabs
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF]">
                Continuous Caliper Sightline &amp; Strum Vectors
              </h3>

              <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
                Sight-read tablatures with forward-scrolling chord measures, directional pick vectors, and woodcut fretboard fingerings with sub-30ms neural pitch alignment.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C5A059] group-hover:translate-x-1 transition-transform">
              <span>Open Guitar Studio Cockpit</span>
              <ArrowRight className="size-4" />
            </div>
          </div>
        </section>

        {/* The Mechanics of Time */}
        <MechanicsOfTime />

        {/* Repertoire Explorer */}
        <RepertoireExplorer
          onSelectPiece={handleSelectRepertoire}
          activePieceTitle={activeRepertoireTitle}
        />
      </main>

      {/* Colophon & Archival Footer */}
      <ColophonFooter />
    </div>
  )
}
