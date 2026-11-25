import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'motion/react'
import {
  ArrowUpRight,
  Volume2,
  Play,
  Sliders,
  Disc,
  Repeat,
  Music,
} from 'lucide-react'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import { resolveChordVoicing } from '@/lib/music/chord-voicings'
import { ActiveVoicingDisplay } from '@/components/practice/active-voicing-display'
import type { ExerciseDto } from '@/api/sessions'
import { VolumetricSmokeCanvas } from './volumetric-smoke-canvas'
import { EngravedScoreSheet } from './engraved-score-sheet'
import {
  LANDING_ACT_WAYPOINTS,
  LANDING_SNAP_RATIOS,
  resolveActiveActIndex,
  computePointerParallax,
  computeForegroundParallax,
  resolveScrollTargetTop,
} from './scroll-choreography'

import rehearsalStudioImg from '@/assets/images/rehearsal_studio_sunlit_1794836089749.jpg'
import rehearsalStudioWebp from '@/assets/images/rehearsal_studio_sunlit_1794836089749.webp'
import rehearsalStudioAvif from '@/assets/images/rehearsal_studio_sunlit_1794836089749.avif'

gsap.registerPlugin(ScrollTrigger)

export type CinematicCameraStageProps = {
  onEnterStudio?: (songId?: string) => void
  onOpenTheory?: () => void
  onOpenTuner?: () => void
  onOpenProgress?: () => void
  onOpenCommunity?: () => void
  onSelectPiece?: (title: string, songId?: string) => void
  activePieceTitle?: string
  onScrollToY?: (y: number) => void
  onRegisterJump?: (fn: (ratio: number) => void) => void
}

const PREVIEW_CHORDS = ['C', 'G', 'Am', 'D'] as const

export function CinematicCameraStage({
  onEnterStudio,
  onOpenTheory,
  onOpenTuner,
  onOpenProgress,
  onOpenCommunity,
  onSelectPiece,
  activePieceTitle = 'Waltz No. 2 in C Minor',
  onScrollToY,
  onRegisterJump,
}: CinematicCameraStageProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraRigRef = useRef<HTMLDivElement>(null)
  const roomCameraRef = useRef<HTMLDivElement>(null)
  const act3ScoreRef = useRef<HTMLDivElement>(null)
  const worldMetronomePinRef = useRef<HTMLDivElement>(null)
  const spotlightVignetteRef = useRef<HTMLDivElement>(null)
  const floorGridRef = useRef<HTMLDivElement>(null)
  const foregroundStageRef = useRef<HTMLDivElement>(null)

  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const act1Ref = useRef<HTMLDivElement>(null)
  const act2Ref = useRef<HTMLDivElement>(null)
  const act2HeadlineRef = useRef<HTMLHeadingElement>(null)
  const act3Ref = useRef<HTMLDivElement>(null)
  const act3HeadlineRef = useRef<HTMLHeadingElement>(null)
  const act4Ref = useRef<HTMLDivElement>(null)
  const act4HeadlineRef = useRef<HTMLHeadingElement>(null)
  const act5Ref = useRef<HTMLDivElement>(null)

  const prefersReduced = useReducedMotion()
  const audioRef = useRef<PracticeAudioEngine | null>(null)

  const [scrollProgressValue, setScrollProgressValue] = useState(0)
  const [activeMovementIdx, setActiveMovementIdx] = useState(0)
  const [previewInstrument, setPreviewInstrument] = useState<'piano' | 'guitar'>('piano')
  const [previewChordName, setPreviewChordName] = useState<(typeof PREVIEW_CHORDS)[number]>('C')
  const [selectedInstrument, setSelectedInstrument] = useState<'piano' | 'guitar'>('piano')
  const [selectedSongId, setSelectedSongId] = useState<string>('ex_piano_shostakovich_waltz_2')
  const [lastAuditionedLabel, setLastAuditionedLabel] = useState<string>(
    'Select any preview button to hear piano or guitar chords'
  )
  const [roomLoaded, setRoomLoaded] = useState(true)

  useEffect(() => {
    const engine = new PracticeAudioEngine()
    audioRef.current = engine
    return () => {
      engine.dispose()
      audioRef.current = null
    }
  }, [])

  const activeVoicing = useMemo(() => resolveChordVoicing(previewChordName), [previewChordName])
  const nextChordIdx = (PREVIEW_CHORDS.indexOf(previewChordName) + 1) % PREVIEW_CHORDS.length
  const nextChordName = PREVIEW_CHORDS[nextChordIdx]

  const jumpToRatio = useCallback(
    (ratio: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const containerTop = window.scrollY + rect.top
      const targetY = resolveScrollTargetTop(
        containerTop,
        containerRef.current.offsetHeight,
        window.innerHeight,
        ratio
      )
      if (onScrollToY) {
        onScrollToY(targetY)
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    },
    [onScrollToY]
  )

  useEffect(() => {
    onRegisterJump?.(jumpToRatio)
  }, [onRegisterJump, jumpToRatio])

  useLayoutEffect(() => {
    if (prefersReduced || !containerRef.current) return

    const ctx = gsap.context(() => {
      // Initial baseline transforms for Acts 1-5
      gsap.set(act1Ref.current, { opacity: 1, scale: 1, y: 0, z: 0 })
      gsap.set(act2Ref.current, { opacity: 0, y: 20, z: -90 })
      gsap.set(act2HeadlineRef.current, { y: 22, opacity: 0 })
      gsap.set(act3Ref.current, { opacity: 0, y: 20, z: -80 })
      gsap.set(act3HeadlineRef.current, { y: 22, opacity: 0 })
      gsap.set(act4Ref.current, { opacity: 0, y: 20, z: -80 })
      gsap.set(act4HeadlineRef.current, { y: 22, opacity: 0 })
      gsap.set(act5Ref.current, { opacity: 0, scale: 0.96, y: 28 })

      gsap.set(act3ScoreRef.current, { opacity: 0, scale: 0.94, y: 18 })
      gsap.set(worldMetronomePinRef.current, { opacity: 0 })

      const wp1 = LANDING_ACT_WAYPOINTS[0]!.camera
      const wp2 = LANDING_ACT_WAYPOINTS[1]!.camera
      const wp3 = LANDING_ACT_WAYPOINTS[2]!.camera
      const wp4 = LANDING_ACT_WAYPOINTS[3]!.camera
      const wp5 = LANDING_ACT_WAYPOINTS[4]!.camera

      gsap.set(roomCameraRef.current, {
        scale: wp1.scale,
        xPercent: wp1.xPercent,
        yPercent: wp1.yPercent,
        transformOrigin: '50% 50%',
      })
      gsap.set(spotlightVignetteRef.current, { opacity: wp1.spotlightOpacity })
      gsap.set(floorGridRef.current, { rotationX: 68, yPercent: 0, scale: 1.08 })
      if (cameraRigRef.current) {
        gsap.set(cameraRigRef.current, {
          rotationX: 0,
          rotationY: 0,
          x: 0,
          y: 0,
          transformPerspective: 1600,
        })
      }
      if (foregroundStageRef.current) {
        gsap.set(foregroundStageRef.current, { x: 0, y: 0 })
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.45,
          snap: {
            snapTo: [...LANDING_SNAP_RATIOS],
            directional: false,
            duration: { min: 0.2, max: 0.45 },
            delay: 0.18,
            ease: 'power2.inOut',
          },
          onUpdate: (self) => {
            const p = self.progress
            setScrollProgressValue(p)
            const nextIdx = resolveActiveActIndex(p)
            setActiveMovementIdx((prev) => (prev === nextIdx ? prev : nextIdx))
          },
        },
      })

      // Anchor timeline duration at strictly 1.0
      tl.set({}, {}, 1.0)

      // Unified 5-Act Camera Choreography over locked 16:9 room:
      // 0.00 -> 0.22: Dolly onto piano keyboard & acoustic guitar
      // 0.22 -> 0.45: Deep zoom straight onto illuminated sheet music on piano desk
      // 0.45 -> 0.68: Pull back & pan right onto guitar, sunlit window & pyramid metronome
      // 0.68 -> 0.92: Wide pull-back to full rehearsal studio
      tl.to(
        roomCameraRef.current,
        {
          scale: wp2.scale,
          xPercent: wp2.xPercent,
          yPercent: wp2.yPercent,
          ease: 'power2.inOut',
          duration: 0.22,
        },
        0
      )
        .to(
          roomCameraRef.current,
          {
            scale: wp3.scale,
            xPercent: wp3.xPercent,
            yPercent: wp3.yPercent,
            ease: 'power2.inOut',
            duration: 0.23,
          },
          0.22
        )
        .to(
          roomCameraRef.current,
          {
            scale: wp4.scale,
            xPercent: wp4.xPercent,
            yPercent: wp4.yPercent,
            ease: 'power2.inOut',
            duration: 0.23,
          },
          0.45
        )
        .to(
          roomCameraRef.current,
          {
            scale: wp5.scale,
            xPercent: wp5.xPercent,
            yPercent: wp5.yPercent,
            ease: 'power2.inOut',
            duration: 0.24,
          },
          0.68
        )

      // Crisp Engraved Score opens smoothly over the piano desk as Act 3 arrives
      tl.to(
        act3ScoreRef.current,
        { opacity: 1, scale: 1, y: 0, duration: 0.1, ease: 'power2.out' },
        0.35
      ).to(
        act3ScoreRef.current,
        { opacity: 0, scale: 0.96, y: -12, duration: 0.08, ease: 'power1.in' },
        0.51
      )

      // World-space metronome tempo ring sharpens during Act 4 pan onto right corner
      tl.to(worldMetronomePinRef.current, { opacity: 0.96, duration: 0.14, ease: 'power2.out' }, 0.56)
        .to(worldMetronomePinRef.current, { opacity: 0, duration: 0.1, ease: 'power1.in' }, 0.76)

      // Spotlight & Vignette focus intensifies smoothly on Act 3 sheet music zoom
      tl.to(spotlightVignetteRef.current, { opacity: wp2.spotlightOpacity, duration: 0.22 }, 0)
        .to(spotlightVignetteRef.current, { opacity: wp3.spotlightOpacity, duration: 0.23 }, 0.22)
        .to(spotlightVignetteRef.current, { opacity: wp4.spotlightOpacity, duration: 0.23 }, 0.45)
        .to(spotlightVignetteRef.current, { opacity: wp5.spotlightOpacity, duration: 0.24 }, 0.68)

      // Midground 3D horizon grid depth motion
      tl.to(
        floorGridRef.current,
        { rotationX: 48, yPercent: -18, scale: 1.32, ease: 'none', duration: 0.45 },
        0
      ).to(
        floorGridRef.current,
        { rotationX: 64, yPercent: -34, scale: 1.04, ease: 'none', duration: 0.55 },
        0.45
      )

      // ACT 1 EXIT (0.01 -> 0.11) with restrained kinetic wordmark expansion
      tl.to(
        wordmarkRef.current,
        { letterSpacing: '0.16em', ease: 'power1.in', duration: 0.1 },
        0.01
      ).to(
        act1Ref.current,
        {
          scale: 1.32,
          y: -28,
          opacity: 0,
          ease: 'power2.in',
          duration: 0.1,
        },
        0.01
      )

      // Breathing open room window (0.11 -> 0.14), then ACT 2 enters cleanly (peak 0.22)
      tl.to(
        act2Ref.current,
        { opacity: 1, y: 0, z: 0, ease: 'power2.out', duration: 0.08 },
        0.13
      )
        .to(
          act2HeadlineRef.current,
          { y: 0, opacity: 1, ease: 'power3.out', duration: 0.08 },
          0.14
        )
        .to(
          act2Ref.current,
          { opacity: 0, y: -18, z: 60, ease: 'power2.in', duration: 0.07 },
          0.27
        )

      // Breathing room glide (0.34 -> 0.36), then ACT 3 enters cleanly (peak 0.45)
      tl.to(
        act3Ref.current,
        { opacity: 1, y: 0, z: 0, ease: 'power2.out', duration: 0.08 },
        0.36
      )
        .to(
          act3HeadlineRef.current,
          { y: 0, opacity: 1, ease: 'power3.out', duration: 0.08 },
          0.37
        )
        .to(
          act3Ref.current,
          { opacity: 0, y: -16, ease: 'power2.in', duration: 0.07 },
          0.51
        )

      // Breathing room glide (0.58 -> 0.60), then ACT 4 enters cleanly (peak 0.68)
      tl.to(
        act4Ref.current,
        { opacity: 1, y: 0, z: 0, ease: 'power2.out', duration: 0.08 },
        0.6
      )
        .to(
          act4HeadlineRef.current,
          { y: 0, opacity: 1, ease: 'power3.out', duration: 0.08 },
          0.61
        )
        .to(
          act4Ref.current,
          { opacity: 0, y: -18, ease: 'power2.in', duration: 0.07 },
          0.74
        )

      // ACT 5: Calm Song Library & Sound Preview Dock (0.83 -> 1.00)
      tl.to(
        act5Ref.current,
        { opacity: 1, scale: 1, y: 0, ease: 'power2.out', duration: 0.09 },
        0.83
      )

      // Retained multi-layer 3D cursor parallax for desktop fine pointers
      const finePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: fine)').matches
      if (finePointer && cameraRigRef.current) {
        const setRotX = gsap.quickTo(cameraRigRef.current, 'rotationX', {
          duration: 0.7,
          ease: 'power2.out',
        })
        const setRotY = gsap.quickTo(cameraRigRef.current, 'rotationY', {
          duration: 0.7,
          ease: 'power2.out',
        })
        const setBgX = gsap.quickTo(cameraRigRef.current, 'x', {
          duration: 0.8,
          ease: 'power2.out',
        })
        const setBgY = gsap.quickTo(cameraRigRef.current, 'y', {
          duration: 0.8,
          ease: 'power2.out',
        })
        const setFgX = foregroundStageRef.current
          ? gsap.quickTo(foregroundStageRef.current, 'x', {
              duration: 0.65,
              ease: 'power2.out',
            })
          : null
        const setFgY = foregroundStageRef.current
          ? gsap.quickTo(foregroundStageRef.current, 'y', {
              duration: 0.65,
              ease: 'power2.out',
            })
          : null

        const handleMouseMove = (e: MouseEvent) => {
          const parallax = computePointerParallax(
            e.clientX,
            e.clientY,
            window.innerWidth,
            window.innerHeight
          )
          const fg = computeForegroundParallax(
            e.clientX,
            e.clientY,
            window.innerWidth,
            window.innerHeight
          )
          setRotX(parallax.rotateX)
          setRotY(parallax.rotateY)
          setBgX(parallax.shiftX)
          setBgY(parallax.shiftY)
          setFgX?.(fg.fgShiftX)
          setFgY?.(fg.fgShiftY)
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => {
          window.removeEventListener('mousemove', handleMouseMove)
        }
      }
      return undefined
    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [prefersReduced])

  const triggerPreviewChord = () => {
    if (!audioRef.current) return
    audioRef.current.unlock()
    if (previewInstrument === 'piano') {
      audioRef.current.playPianoVoicing(
        activeVoicing.pianoVoicing.lhPitches,
        activeVoicing.pianoVoicing.rhPitches,
        1.4,
        0.8
      )
    } else {
      audioRef.current.playGuitarStrum(activeVoicing.expectedPitches, 'down', true, 1.4)
    }
  }

  const triggerPianoKey = (midi: number) => {
    if (!audioRef.current) return
    audioRef.current.unlock()
    audioRef.current.playPianoNote(midi, 0.9, 0.8)
  }

  const triggerAudioPreview = (mode: 'piano' | 'guitar' | 'a440') => {
    if (!audioRef.current) return
    audioRef.current.unlock()
    if (mode === 'piano') {
      audioRef.current.playPianoVoicing([48, 55], [60, 63, 67, 72], 1.6, 0.8)
      setLastAuditionedLabel('Piano Preview: C Minor 7th (C3–G3 · C4–Eb4–G4–C5)')
    } else if (mode === 'guitar') {
      audioRef.current.playGuitarStrum([40, 47, 52, 55, 59, 64], 'down', true, 1.6)
      setLastAuditionedLabel('Guitar Preview: E Minor Open Strum (E2–B2–E3–G3–B3–E4)')
    } else {
      audioRef.current.playPianoNote(69, 1.4, 0.85)
      setLastAuditionedLabel('Tuning Reference: A4 (440 Hz)')
    }
  }

  const filteredSongs = BUILTIN_FULL_SONGS.filter(
    (s) => s.instrument.toLowerCase() === selectedInstrument
  )
  const currentSong: ExerciseDto =
    BUILTIN_FULL_SONGS.find((s) => s.id === selectedSongId) ||
    filteredSongs[0] ||
    BUILTIN_FULL_SONGS[0]

  if (prefersReduced) {
    return (
      <div
        data-testid="cinematic-camera-stage"
        data-act="0"
        className="w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 pt-24 pb-20 px-6 max-w-6xl mx-auto space-y-12"
      >
        <div className="space-y-4">
          <div className="text-xs font-mono tracking-wider text-amber-600 dark:text-amber-500">
            Piano &amp; Guitar Practice Studio
          </div>
          <h1
            data-testid="expanding-wordmark"
            className="font-brand text-6xl font-bold tracking-tight"
          >
            SONUS
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Practice piano and guitar with flowing sheet music, interactive chord diagrams, live
            pitch listening, bar-by-bar timing feedback, and tempo loop drills.
          </p>
          <button
            type="button"
            onClick={() => onEnterStudio?.(selectedSongId)}
            className="px-6 py-3 rounded-lg bg-amber-500 text-zinc-950 font-mono text-xs font-semibold tracking-wide cursor-pointer"
          >
            Enter Practice Studio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Sheet Music &amp; Fretboard</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              Grand staff and falling keys with Left-Hand Bass and Right-Hand Treble separation,
              plus 6-string guitar diagrams with finger positions.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Bar Feedback &amp; 2-Bar Loops</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              See exact early or late timing in milliseconds and missed notes per measure, then
              isolate tough chord changes in a slow-to-target loop.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <h2 className="font-brand font-bold text-lg">Tuner, Chords &amp; Progress</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              Includes a 6-string guitar tuner, 12-root chords and scales library, session history,
              and peer leaderboard standing.
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
      data-act={activeMovementIdx}
      className="relative w-full h-[450vh] bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 select-none transition-colors"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center [perspective:1600px]">
        {/* Outer Pointer Camera Rig (Cursor Tilt & Parallax Shift) */}
        <div
          ref={cameraRigRef}
          className="pointer-events-none absolute inset-[-6%] [transform-style:preserve-3d] z-0"
        >
          {/* Inner Single-Room Camera Target (Scroll Dolly, Zoom & Pan) */}
          <div
            ref={roomCameraRef}
            data-testid="studio-room-camera"
            className="absolute inset-0 will-change-transform bg-[#EAE4D8] dark:bg-[#09090B]"
          >
            {/* Locked 16:9 World-Space Container so Room Photo & Pinned Notations align pixel-for-pixel */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-video min-w-full min-h-full">
              <picture className="block w-full h-full">
                <source srcSet={rehearsalStudioAvif} type="image/avif" />
                <source srcSet={rehearsalStudioWebp} type="image/webp" />
                <img
                  src={rehearsalStudioImg}
                  alt="Sunlit rehearsal room with grand piano, open sheet music stand, acoustic guitar, tall window, and wooden metronome"
                  width={1376}
                  height={768}
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => setRoomLoaded(true)}
                  onError={() => setRoomLoaded(false)}
                  className={`w-full h-full object-cover object-center brightness-[1.03] contrast-[1.04] saturate-[1.06] dark:grayscale dark:contrast-[1.24] dark:brightness-[0.44] transition-opacity duration-500 ${
                    roomLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </picture>

              {/* Balanced Directional Reading Margin: Subtle warm fade along left/bottom edges only; center piano, guitar & window sunlight remain clear */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-[#F8F8F6]/78 via-[#F8F8F6]/32 to-transparent dark:from-[#09090B]/80 dark:via-[#09090B]/22 dark:to-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#F8F8F6]/44 via-transparent to-[#F8F8F6]/20 dark:from-[#09090B]/74 dark:via-transparent dark:to-[#09090B]/52"
              />

              {/* WORLD-SPACE PIN: Crisp Indicator Ring over the Wooden Metronome */}
              <div
                ref={worldMetronomePinRef}
                data-testid="world-metronome-pin"
                style={{
                  left: '92.4%',
                  top: '57.2%',
                }}
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
              >
                <div className="size-3 rounded-full border border-amber-500/90 bg-amber-400/20 shadow-xs" />
              </div>
            </div>
          </div>

          {/* Crisp Radial Spotlight Focus */}
          <div
            ref={spotlightVignetteRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_54%_45%,transparent_34%,rgba(248,248,246,0.26)_84%)] dark:bg-[radial-gradient(ellipse_at_54%_45%,transparent_24%,rgba(9,9,11,0.72)_78%)]"
          />

          {/* Volumetric Dust & Light Beams */}
          <VolumetricSmokeCanvas
            scrollProgress={scrollProgressValue}
            className="opacity-55 dark:opacity-85"
          />

          {/* Dynamic 3D Perspective Floor Horizon */}
          <div
            ref={floorGridRef}
            className="pointer-events-none absolute inset-x-[-20%] bottom-[-32%] h-[88vh] opacity-20 dark:opacity-22 [transform-style:preserve-3d]"
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(120,113,108,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,113,108,0.16) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse at center, black 18%, transparent 74%)',
              }}
            />
          </div>
        </div>

        {/* Left Margin Quiet 5-Act Waypoint Rail (Unboxed Editorial Spine) */}
        <nav
          aria-label="Story acts"
          className="fixed left-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3"
        >
          {LANDING_ACT_WAYPOINTS.map((wp, idx) => {
            const isCurrent = idx === activeMovementIdx
            return (
              <button
                key={wp.id}
                type="button"
                data-testid={`waypoint-${wp.id}`}
                onClick={() => jumpToRatio(wp.ratio)}
                className="group flex items-center gap-2.5 text-left py-1 focus-visible:outline-2 focus-visible:outline-amber-500 rounded cursor-pointer"
              >
                <span
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    isCurrent
                      ? 'w-6 bg-amber-500'
                      : 'w-2 bg-zinc-500/60 dark:bg-zinc-600 group-hover:bg-zinc-800 dark:group-hover:bg-zinc-400'
                  }`}
                />
                <span
                  className={`text-xs font-medium tracking-wide transition-opacity whitespace-nowrap ${
                    isCurrent
                      ? 'text-zinc-950 dark:text-zinc-100 font-semibold opacity-100'
                      : 'text-zinc-800 dark:text-zinc-400 opacity-85 dark:opacity-70 group-hover:opacity-100'
                  }`}
                >
                  {wp.actNumber}. {wp.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Foreground Multi-Speed Depth Layer */}
        <div
          ref={foregroundStageRef}
          className="relative w-full h-full z-10 pointer-events-none"
        >
          {/* ─────────────────────────────────────────────────────────────────────
              ACT 1: WIDE STUDIO OVERVIEW — OPEN NEGATIVE SPACE HERO (0.00 -> 0.11)
             ───────────────────────────────────────────────────────────────────── */}
          <div
            ref={act1Ref}
            data-testid="landing-act-1"
            className={`absolute inset-0 flex flex-col justify-between px-6 sm:px-10 xl:pl-52 xl:pr-12 pt-20 pb-10 sm:pb-14 will-change-[transform,opacity] ${
              activeMovementIdx === 0 ? 'pointer-events-auto z-20' : 'pointer-events-none z-10'
            }`}
          >
            {/* Upper-Left Borderless Editorial Title — Leaves Piano, Guitar & Window Sunlight Open */}
            <div className="max-w-2xl space-y-3 text-left">
              <div className="text-xs font-mono text-zinc-800 dark:text-zinc-300">
                Piano &amp; Guitar Practice Studio · Live Pitch Feedback
              </div>
              <h1
                ref={wordmarkRef}
                data-testid="expanding-wordmark"
                className="font-brand font-bold text-6xl sm:text-8xl md:text-[7.5rem] leading-[0.88] tracking-tight text-zinc-900 dark:text-zinc-100 uppercase"
              >
                SONUS
              </h1>
              <p className="text-sm sm:text-base font-sans text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-md">
                Follow flowing chords with hand preparation, check timing bar by bar, and loop tough
                transitions up to full speed.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onEnterStudio?.(selectedSongId)}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold tracking-wide flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Enter Practice Studio</span>
                  <ArrowUpRight className="size-4 shrink-0" />
                </button>

                {onOpenProgress && (
                  <button
                    type="button"
                    onClick={onOpenProgress}
                    className="px-4 py-2.5 rounded-lg border border-zinc-400/60 dark:border-zinc-700 bg-[#F8F8F6]/70 dark:bg-[#09090B]/70 backdrop-blur-sm hover:border-amber-500 text-zinc-900 dark:text-zinc-100 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Progress &amp; Coach
                  </button>
                )}

                {onOpenCommunity && (
                  <button
                    type="button"
                    onClick={onOpenCommunity}
                    className="px-4 py-2.5 rounded-lg border border-zinc-400/60 dark:border-zinc-700 bg-[#F8F8F6]/70 dark:bg-[#09090B]/70 backdrop-blur-sm hover:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-mono text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Peer Benchmarks
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Quiet Unboxed Text Links — Zero Box Clutter */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-800 dark:text-zinc-300">
              {onOpenTheory && (
                <button
                  type="button"
                  onClick={onOpenTheory}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline cursor-pointer"
                >
                  Chords &amp; Scales (12 Roots) ↗
                </button>
              )}
              {onOpenTuner && (
                <button
                  type="button"
                  onClick={onOpenTuner}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline cursor-pointer"
                >
                  Guitar Tuner ↗
                </button>
              )}
              <button
                type="button"
                onClick={() => jumpToRatio(0.22)}
                className="text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Scroll to move through room ↓
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              ACT 2: PIANO KEYS & GUITAR — BORDERLESS COPY + CORNER PREVIEW (0.13 -> 0.34)
             ───────────────────────────────────────────────────────────────────── */}
          <div
            ref={act2Ref}
            data-testid="landing-act-2"
            className={`absolute inset-0 flex flex-col justify-between px-6 sm:px-10 xl:pl-52 xl:pr-10 pt-20 pb-8 sm:pb-12 will-change-[transform,opacity] ${
              activeMovementIdx === 1 ? 'pointer-events-auto z-20' : 'pointer-events-none z-10'
            }`}
          >
            {/* Top-Left Borderless Narrative with Masked Kinetic Reveal */}
            <div className="max-w-sm space-y-2.5 text-left">
              <div className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">
                02. Practice View
              </div>
              <div className="overflow-hidden">
                <h2
                  ref={act2HeadlineRef}
                  className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 leading-tight text-balance"
                >
                  See every fingering and hand shape before the bar arrives.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 leading-relaxed font-medium dark:font-normal">
                Switch between Grand Staff &amp; Keyboard or 6-String Guitar diagrams right beside
                your preparation cue.
              </p>
            </div>

            {/* Bottom-Right Compact Translucent Corner Switcher — Keeps Center Piano & Guitar Open */}
            <div className="self-end w-full max-w-[340px]">
              <div
                data-testid="act2-voicing-preview"
                className="rounded-xl border border-zinc-300/70 dark:border-zinc-700/70 bg-[#F8F8F6]/78 dark:bg-[#09090B]/76 backdrop-blur-md p-3.5 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex rounded-md bg-white/70 dark:bg-zinc-900/80 p-0.5 border border-zinc-300/60 dark:border-zinc-700/60 font-mono text-[11px]">
                    <button
                      type="button"
                      data-testid="act2-instrument-piano"
                      onClick={() => setPreviewInstrument('piano')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        previewInstrument === 'piano'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Piano
                    </button>
                    <button
                      type="button"
                      data-testid="act2-instrument-guitar"
                      onClick={() => setPreviewInstrument('guitar')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        previewInstrument === 'guitar'
                          ? 'bg-amber-500 text-zinc-950'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Guitar
                    </button>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {PREVIEW_CHORDS.map((chord) => (
                      <button
                        key={chord}
                        type="button"
                        onClick={() => setPreviewChordName(chord)}
                        className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          previewChordName === chord
                            ? 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold'
                            : 'border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-0.5 flex items-center justify-center min-h-[155px]">
                  <ActiveVoicingDisplay
                    instrument={previewInstrument}
                    chordName={activeVoicing.chordName}
                    guitarTab={activeVoicing.guitarTab}
                    pianoVoicing={activeVoicing.pianoVoicing}
                    activePitches={
                      previewInstrument === 'piano'
                        ? [
                            ...activeVoicing.pianoVoicing.lhPitches,
                            ...activeVoicing.pianoVoicing.rhPitches,
                          ]
                        : activeVoicing.expectedPitches
                    }
                    defaultViewMode="keyboard"
                    showModeSelector={true}
                    onKeyClick={triggerPianoKey}
                  />
                </div>

                <div className="pt-2 border-t border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {previewChordName} → Next: {nextChordName}
                  </span>
                  <button
                    type="button"
                    data-testid="act2-hear-chord-btn"
                    onClick={triggerPreviewChord}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Volume2 className="size-3" />
                    <span>Hear</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              ACT 3: CRISP VECTOR SHEET MUSIC OVER PIANO DESK (0.36 -> 0.58)
             ───────────────────────────────────────────────────────────────────── */}
          <div
            ref={act3Ref}
            data-testid="landing-act-3"
            className={`absolute inset-0 flex flex-col-reverse lg:flex-row items-start lg:items-end justify-center lg:justify-between gap-5 lg:gap-10 px-6 sm:px-10 xl:pl-52 xl:pr-12 pt-20 pb-8 sm:pb-14 will-change-[transform,opacity] ${
              activeMovementIdx === 2 ? 'pointer-events-auto z-20' : 'pointer-events-none z-10'
            }`}
          >
            {/* Lower-Left Borderless Editorial Caption — Clear Separation From Engraved Score */}
            <div
              data-testid="act3-bar-feedback"
              className="max-w-md space-y-3 text-left shrink-0"
            >
              <div className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">
                03. Bar-by-Bar Timing Feedback
              </div>
              <div className="overflow-hidden">
                <h2
                  ref={act3HeadlineRef}
                  className="font-brand text-2xl sm:text-4xl font-bold text-zinc-950 dark:text-zinc-100 tracking-tight leading-tight text-balance"
                >
                  Spot the exact bar and missed tone right on the score.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 leading-relaxed font-medium dark:font-normal">
                Record a take to see early or late changes in milliseconds per bar—then loop those
                two bars at slow speed until every chord lands cleanly.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="act3-loop-drill-btn"
                  onClick={() => onEnterStudio?.('ex_guitar_knockin')}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Repeat className="size-3.5" />
                  <span>Practice Loop in Studio</span>
                </button>
                <span className="text-xs font-mono text-zinc-900 dark:text-zinc-300 font-medium dark:font-normal">
                  Focus: Am → C (Bar 3–4)
                </span>
              </div>
            </div>

            {/* Right / Piano-Desk Crisp Vector Two-Page Engraved Grand Staff Score */}
            <div
              ref={act3ScoreRef}
              className="w-full lg:w-[54%] flex justify-start lg:justify-end self-center lg:self-center"
            >
              <EngravedScoreSheet />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              ACT 4: GUITAR, SUNLIT WINDOW & METRONOME — OPEN BORDERLESS (0.60 -> 0.81)
             ───────────────────────────────────────────────────────────────────── */}
          <div
            ref={act4Ref}
            data-testid="landing-act-4"
            className={`absolute inset-0 flex flex-col justify-center px-6 sm:px-10 xl:pl-52 xl:pr-12 pt-14 will-change-[transform,opacity] ${
              activeMovementIdx === 3 ? 'pointer-events-auto z-20' : 'pointer-events-none z-10'
            }`}
          >
            {/* Mid-Left Open Narrative — Right Frame Holds Guitar, Sunbeams & Metronome */}
            <div data-testid="act4-tempo-ladder" className="max-w-md space-y-4 text-left">
              <div className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">
                04. Tempo Drills &amp; Studio Tools
              </div>
              <div className="overflow-hidden">
                <h2
                  ref={act4HeadlineRef}
                  className="font-brand text-2xl sm:text-4xl font-bold text-zinc-950 dark:text-zinc-100 tracking-tight leading-tight text-balance"
                >
                  Step cleanly from slow speed up to full tempo.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 leading-relaxed font-medium dark:font-normal">
                Practice along with the studio metronome at 70% before advancing through 85%, 100%,
                and 105% mastery speed.
              </p>

              {/* Inline Tempo Steps — Zero Heavy Boxes */}
              <div className="pt-2 border-t border-zinc-400/40 dark:border-zinc-700/60 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
                <span>
                  <b className="text-amber-700 dark:text-amber-400">70%</b> 56 BPM
                </span>
                <span>
                  <b>85%</b> 68 BPM
                </span>
                <span>
                  <b>100%</b> 80 BPM
                </span>
                <span>
                  <b>105%</b> 84 BPM
                </span>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-5 text-xs font-mono">
                {onOpenTuner && (
                  <button
                    type="button"
                    onClick={onOpenTuner}
                    className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <Disc className="size-3.5" />
                    <span>Open Guitar Tuner ↗</span>
                  </button>
                )}
                {onOpenTheory && (
                  <button
                    type="button"
                    onClick={onOpenTheory}
                    className="text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Explore Chords &amp; Scales ↗
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              ACT 5: SONG LIBRARY & SOUND PREVIEW FINALE (0.83 -> 1.00)
             ───────────────────────────────────────────────────────────────────── */}
          <div
            ref={act5Ref}
            data-testid="landing-act-5"
            className={`absolute inset-0 flex items-end justify-center px-4 sm:px-6 xl:pl-52 xl:pr-10 2xl:px-12 pb-6 sm:pb-10 pt-16 will-change-[transform,opacity] ${
              activeMovementIdx === 4 ? 'pointer-events-auto z-20' : 'pointer-events-none z-10'
            }`}
          >
            <div className="w-full max-w-6xl rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/92 dark:bg-[#121215]/92 backdrop-blur-md p-4 sm:p-6 flex flex-col gap-3.5 max-h-[76vh] overflow-y-auto shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-amber-600 dark:text-amber-500 font-semibold">
                    05. Song Library &amp; Sound Preview
                  </div>
                  <h2 className="font-brand text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 text-balance">
                    Choose a piece to practice or preview instrument audio.
                  </h2>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 font-mono text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerAudioPreview('piano')}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Volume2 className="size-3.5 text-amber-500 shrink-0" />
                    <span>Preview Piano Chord</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerAudioPreview('guitar')}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Music className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Preview Guitar Strum</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerAudioPreview('a440')}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-[#F8F8F6] dark:bg-[#18181C] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Disc className="size-3.5 text-amber-500 shrink-0" />
                    <span>A440 Tuning Note</span>
                  </button>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                <div className="flex items-center gap-2 truncate">
                  <Sliders className="size-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{lastAuditionedLabel}</span>
                </div>
                <span className="text-[11px] text-zinc-500 hidden sm:inline shrink-0">
                  Browser Audio Ready
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-5 flex flex-col gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInstrument('piano')
                        const isAlreadyPiano = BUILTIN_FULL_SONGS.some(
                          (s) => s.id === selectedSongId && s.instrument.toLowerCase() === 'piano'
                        )
                        if (!isAlreadyPiano) {
                          const firstPiano = BUILTIN_FULL_SONGS.find((s) => s.instrument.toLowerCase() === 'piano')
                          if (firstPiano) {
                            setSelectedSongId(firstPiano.id)
                            onSelectPiece?.(firstPiano.title, firstPiano.id)
                          }
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-md text-center font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        selectedInstrument === 'piano'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      Piano Pieces
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInstrument('guitar')
                        const isAlreadyGuitar = BUILTIN_FULL_SONGS.some(
                          (s) => s.id === selectedSongId && s.instrument.toLowerCase() === 'guitar'
                        )
                        if (!isAlreadyGuitar) {
                          const preferredGuitar =
                            BUILTIN_FULL_SONGS.find((s) => s.id === 'ex_guitar_knockin') ||
                            BUILTIN_FULL_SONGS.find((s) => s.instrument.toLowerCase() === 'guitar')
                          if (preferredGuitar) {
                            setSelectedSongId(preferredGuitar.id)
                            onSelectPiece?.(preferredGuitar.title, preferredGuitar.id)
                          }
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-md text-center font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        selectedInstrument === 'guitar'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      Guitar Pieces
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[165px] overflow-y-auto pr-1">
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
                          className={`p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-zinc-100'
                              : 'border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-brand font-bold text-sm truncate">{song.title}</div>
                            <div className="text-[11px] font-mono text-zinc-500 mt-0.5 tabular-nums">
                              {song.progression?.key || 'Standard'} · {song.tempo_bpm} BPM ·{' '}
                              {song.progression?.chords?.length ?? 8} Measures
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-amber-600 dark:text-amber-500 font-bold shrink-0">
                            {isSelected ? 'Selected' : 'Choose'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                      <div>
                        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-500 font-semibold">
                          Selected Practice Piece
                        </span>
                        <h3 className="font-brand text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {currentSong.title}
                        </h3>
                      </div>
                      <div className="text-right font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                        <div className="text-zinc-900 dark:text-zinc-100 font-bold">
                          {currentSong.tempo_bpm} BPM
                        </div>
                        <div>{currentSong.progression?.key || 'C Major'}</div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {currentSong.description ||
                        'Complete progression with hand voicings, chord diagrams, and measure-by-measure timing feedback.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 font-mono text-xs tabular-nums">
                      {(currentSong.progression?.chords || []).slice(0, 8).map((c, i) => (
                        <span
                          key={`${c.name}-${i}`}
                          className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-800 dark:text-zinc-200"
                        >
                          M{i + 1}: <b>{c.name}</b>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs font-mono text-zinc-500">
                      Opens with preparation diagrams &amp; measure loop brackets.
                    </div>
                    <button
                      type="button"
                      data-testid="enter-studio-primary-btn"
                      onClick={() => onEnterStudio?.(currentSong.id)}
                      className="w-full sm:w-auto px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="size-3.5 fill-current shrink-0" />
                      <span>Practice This Piece</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
