import React, { useEffect, useState, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'motion/react'
import { CinematicCameraStage } from './cinematic-camera-stage'
import { ColophonFooter } from './colophon-footer'

gsap.registerPlugin(ScrollTrigger)

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
  isSignedIn: _isSignedIn = false,
  userButtonSlot: _userButtonSlot,
}: LandingPageProps): React.JSX.Element {
  const prefersReduced = useReducedMotion()
  const [activeRepertoireTitle, setActiveRepertoireTitle] = useState('Waltz No. 2 in C Minor')
  const [activeSongId, setActiveSongId] = useState<string>('ex_piano_shostakovich_waltz_2')

  const lenisRef = useRef<Lenis | null>(null)
  const stageJumpRef = useRef<((ratio: number) => void) | null>(null)

  useEffect(() => {
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    const onLenisScroll = () => {
      ScrollTrigger.update()
    }
    lenis.on('scroll', onLenisScroll)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.off('scroll', onLenisScroll)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [prefersReduced])

  const scrollToPixelY = useCallback((targetY: number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { duration: 0.5, lock: true })
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }, [])

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
        onScrollToY={scrollToPixelY}
        onRegisterJump={(fn) => {
          stageJumpRef.current = fn
        }}
      />

      <ColophonFooter />
    </div>
  )
}
