import React, { useEffect, useState, useRef } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'
import { MastheadNav } from './masthead-nav'
import { CinematicCameraStage } from './cinematic-camera-stage'
import { ColophonFooter } from './colophon-footer'

export type LandingPageProps = {
  onEnterStudio?: (songId?: string) => void
  onOpenTheory?: () => void
  onOpenTuner?: () => void
  onOpenProgress?: () => void
  onOpenCommunity?: () => void
  onSignIn?: () => void
  isSignedIn?: boolean
  userButtonSlot?: React.ReactNode
}

export function LandingPage({
  onEnterStudio,
  onOpenTheory,
  onOpenTuner,
  onOpenProgress,
  onOpenCommunity,
  onSignIn,
  isSignedIn = false,
  userButtonSlot,
}: LandingPageProps): React.JSX.Element {
  const prefersReduced = useReducedMotion()
  const [activeRepertoireTitle, setActiveRepertoireTitle] = useState('Waltz No. 2 in C Minor')
  const [activeSongId, setActiveSongId] = useState<string>('ex_piano_shostakovich_waltz_2')

  const lenisRef = useRef<Lenis | null>(null)
  useEffect(() => {
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.15,
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

  const handleEnter = (songId?: string) => {
    const targetSong = songId || activeSongId
    if (onEnterStudio) {
      onEnterStudio(targetSong)
    } else if (onSignIn) {
      onSignIn()
    }
  }

  return (
    <div
      id="top"
      className="relative min-h-screen w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 transition-colors"
    >
      <MastheadNav
        onEnterStudio={() => handleEnter(activeSongId)}
        onOpenTheory={onOpenTheory}
        onOpenTuner={onOpenTuner}
        onOpenProgress={onOpenProgress}
        onOpenCommunity={onOpenCommunity}
        onSignIn={onSignIn}
        isSignedIn={isSignedIn}
        userButtonSlot={userButtonSlot}
      />

      <CinematicCameraStage
        onEnterStudio={(songId) => handleEnter(songId)}
        onOpenTheory={onOpenTheory}
        onOpenTuner={onOpenTuner}
        onOpenProgress={onOpenProgress}
        onOpenCommunity={onOpenCommunity}
        onSelectPiece={(title, songId) => {
          setActiveRepertoireTitle(title)
          if (songId) setActiveSongId(songId)
        }}
        activePieceTitle={activeRepertoireTitle}
      />

      <ColophonFooter />
    </div>
  )
}
