import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import type { FlowingChordItem } from './flowing-notation-stand'
import { midiToPitchName } from './grand-staff-diagram'
import { useTheme } from '@/hooks/use-theme'

export interface PianoWaterfallStandProps {
  progression: FlowingChordItem[]
  currentBeat: number
  tempoBpm: number
  isPlaying: boolean
  beatsPerMeasure?: number
  onKeyClick?: (midi: number) => void
  onSeekBeat?: (beat: number) => void
  className?: string
}

// Full 88-Key Concert Grand Piano Keyboard: A0 (MIDI 21) to C8 (MIDI 108)
// 52 White Keys, 36 Black Keys
export const START_MIDI = 21
export const END_MIDI = 108
const WHITE_NOTE_OCTAVE_SET = new Set([0, 2, 4, 5, 7, 9, 11]) // C, D, E, F, G, A, B

export function pitchNameToMidi(pitchStr: string): number {
  const match = pitchStr.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (!match) return 60
  const letter = match[1]!.toUpperCase()
  const acc = match[2]
  const oct = parseInt(match[3]!, 10)
  const baseMidi: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let midi = (oct + 1) * 12 + (baseMidi[letter] ?? 0)
  if (acc === '#') midi += 1
  if (acc === 'b') midi -= 1
  return midi
}

interface SparkParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  color: string
  twinkle: number
  wobble: number
}

export function PianoWaterfallStand({
  progression,
  currentBeat,
  tempoBpm: _tempoBpm,
  isPlaying,
  beatsPerMeasure = 4,
  onKeyClick,
  onSeekBeat: _onSeekBeat,
  className = '',
}: PianoWaterfallStandProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<SparkParticle[]>([])
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Geometry: 52 White keys in standard 1040 width coordinate space
  // White Key: 20px wide, 110px high (Aspect ratio 1:5.5 - authentic concert grand proportions)
  // Black Key: 12px wide, 70px high
  const TOTAL_WIDTH = 1040
  const WATERFALL_HEIGHT = 210
  const WHITE_KEY_HEIGHT = 110
  const BLACK_KEY_HEIGHT = 70
  const TOTAL_HEIGHT = WATERFALL_HEIGHT + WHITE_KEY_HEIGHT // 320
  const STRIKE_LINE_Y = WATERFALL_HEIGHT - 6 // 204
  const WHITE_KEY_WIDTH = 20
  const BLACK_KEY_WIDTH = 12
  const PX_PER_BEAT = 75

  const keyMap = useMemo(() => {
    const keys: Array<{
      midi: number
      isWhite: boolean
      name: string
      x: number
      width: number
    }> = []

    let whiteCount = 0
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const noteInOct = midi % 12
      const isWhite = WHITE_NOTE_OCTAVE_SET.has(noteInOct)
      if (isWhite) {
        keys.push({
          midi,
          isWhite: true,
          name: midiToPitchName(midi),
          x: whiteCount * WHITE_KEY_WIDTH,
          width: WHITE_KEY_WIDTH,
        })
        whiteCount++
      }
    }

    whiteCount = 0
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const noteInOct = midi % 12
      const isBlack = !WHITE_NOTE_OCTAVE_SET.has(noteInOct)
      if (isBlack) {
        keys.push({
          midi,
          isWhite: false,
          name: midiToPitchName(midi),
          x: whiteCount * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          width: BLACK_KEY_WIDTH,
        })
      } else {
        whiteCount++
      }
    }

    return keys
  }, [])

  const keyCoordByMidi = useMemo(() => {
    const map = new Map<number, { x: number; width: number; isWhite: boolean }>()
    keyMap.forEach((k) => map.set(k.midi, { x: k.x, width: k.width, isWhite: k.isWhite }))
    return map
  }, [keyMap])

  // Map notes from the score to falling capsules
  const waterfallNotes = useMemo(() => {
    const notes: Array<{
      id: string
      midi: number
      startBeat: number
      durationBeats: number
      hand: 'lh' | 'rh'
      chordName: string
    }> = []

    let currentAccumBeat = 0
    progression.forEach((chord, chordIdx) => {
      const chordDuration = chord.duration_beats ?? beatsPerMeasure

      if (chord.melodyNotes && chord.melodyNotes.length > 0) {
        chord.melodyNotes.forEach((note, nIdx) => {
          const midi = pitchNameToMidi(note.pitch)
          if (midi >= START_MIDI && midi <= END_MIDI) {
            const hand: 'lh' | 'rh' = note.clef === 'bass' ? 'lh' : 'rh'
            notes.push({
              id: `${hand}-${chordIdx}-${midi}-${nIdx}`,
              midi,
              startBeat: currentAccumBeat + (note.beatOffset ?? 0),
              durationBeats: Math.max(0.4, (note.duration ?? 1) * 0.85),
              hand,
              chordName: chord.chordName,
            })
          }
        })
      } else {
        const lhPitches = chord.pianoVoicing?.lhPitches ?? []
        const rhPitches = chord.pianoVoicing?.rhPitches ?? []

        lhPitches.forEach((p, pIdx) => {
          if (p >= START_MIDI && p <= END_MIDI) {
            notes.push({
              id: `lh-${chordIdx}-${p}-${pIdx}`,
              midi: p,
              startBeat: currentAccumBeat,
              durationBeats: chordDuration * 0.85,
              hand: 'lh',
              chordName: chord.chordName,
            })
          }
        })

        rhPitches.forEach((p, pIdx) => {
          if (p >= START_MIDI && p <= END_MIDI) {
            notes.push({
              id: `rh-${chordIdx}-${p}-${pIdx}`,
              midi: p,
              startBeat: currentAccumBeat,
              durationBeats: chordDuration * 0.85,
              hand: 'rh',
              chordName: chord.chordName,
            })
          }
        })
      }

      currentAccumBeat += chordDuration
    })

    return notes
  }, [progression, beatsPerMeasure])

  // Active keys intersecting the laser strike line
  const activeKeysAtStrike = useMemo(() => {
    const activeMap = new Map<number, 'lh' | 'rh'>()
    waterfallNotes.forEach((n) => {
      if (currentBeat >= n.startBeat && currentBeat <= n.startBeat + n.durationBeats) {
        if (!activeMap.has(n.midi) || n.hand === 'rh') {
          activeMap.set(n.midi, n.hand)
        }
      }
    })
    return activeMap
  }, [waterfallNotes, currentBeat])

  // Spawn particle burst for a key
  const spawnSparks = useCallback((cx: number, cy: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) / 1.5 + Math.PI / 6 // upward fan
      const speed = Math.random() * 4.5 + 1.5
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.sin(angle) * speed,
        size: Math.random() * 2.8 + 1.0,
        life: 1.0,
        maxLife: Math.random() * 40 + 25,
        color: Math.random() > 0.3 ? color : '#FFFFFF',
        twinkle: Math.random() * 15 + 5,
        wobble: Math.random() * 0.15 + 0.05,
      })
    }
  }, [])

  const handleKeyClickInternal = (midi: number) => {
    const coord = keyCoordByMidi.get(midi)
    if (coord && canvasRef.current) {
      const scaleX = canvasRef.current.width / TOTAL_WIDTH
      const scaleY = canvasRef.current.height / TOTAL_HEIGHT
      const cx = (coord.x + coord.width / 2) * scaleX
      const cy = STRIKE_LINE_Y * scaleY
      spawnSparks(cx, cy, '#FACC15', 20)
    }
    onKeyClick?.(midi)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 60 FPS HTML5 CANVAS ENGINE:
  // 1. Dual-Directional Volumetric Light Beams (Upward Column & Downward Spotlight)
  // 2. Continuous Particle Spark Fountain
  // 3. Laser Strike Lens Flare Hotspots
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const activeArray = Array.from(activeKeysAtStrike.entries())

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const scaleX = width / TOTAL_WIDTH
      const scaleY = height / TOTAL_HEIGHT
      const strikeY = STRIKE_LINE_Y * scaleY

      // 1. VOLUMETRIC SPOTLIGHT BEAMS (Dual-Directional: Skywards + Onto Keys)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      activeArray.forEach(([midi, hand]) => {
        const coord = keyCoordByMidi.get(midi)
        if (!coord) return
        const cx = (coord.x + coord.width / 2) * scaleX
        const isLh = hand === 'lh'
        const baseColorRgb = isLh ? '236, 72, 153' : '250, 204, 21'
        const hexColor = isLh ? '#EC4899' : '#FACC15'

        // A. Continuous spark emission at strike line
        if (Math.random() < 0.6) {
          spawnSparks(cx, strikeY, hexColor, 2)
        }

        // B. Upward Atmospheric Column (Skyward Beams)
        const beamW = Math.max(16, coord.width * scaleX * 1.5)
        const upGrad = ctx.createLinearGradient(cx, strikeY, cx, 0)
        upGrad.addColorStop(0, `rgba(${baseColorRgb}, 0.75)`)
        upGrad.addColorStop(0.3, `rgba(${baseColorRgb}, 0.35)`)
        upGrad.addColorStop(0.7, `rgba(${baseColorRgb}, 0.12)`)
        upGrad.addColorStop(1, `rgba(${baseColorRgb}, 0.0)`)

        ctx.fillStyle = upGrad
        ctx.beginPath()
        ctx.moveTo(cx - beamW * 0.5, strikeY)
        ctx.lineTo(cx + beamW * 0.5, strikeY)
        ctx.lineTo(cx + beamW * 0.35, 0)
        ctx.lineTo(cx - beamW * 0.35, 0)
        ctx.closePath()
        ctx.fill()

        // C. Downward Key Spotlight Cone (Illuminates the Piano Keys Below!)
        const downGrad = ctx.createLinearGradient(cx, strikeY, cx, height)
        downGrad.addColorStop(0, `rgba(255, 255, 255, 0.95)`) // strike point flash
        downGrad.addColorStop(0.12, `rgba(${baseColorRgb}, 0.65)`)
        downGrad.addColorStop(0.65, `rgba(${baseColorRgb}, 0.35)`)
        downGrad.addColorStop(1, `rgba(${baseColorRgb}, 0.08)`)

        const coneBottomW = coord.width * scaleX * 1.8
        ctx.fillStyle = downGrad
        ctx.beginPath()
        ctx.moveTo(cx - coord.width * scaleX * 0.5, strikeY)
        ctx.lineTo(cx + coord.width * scaleX * 0.5, strikeY)
        ctx.lineTo(cx + coneBottomW * 0.5, height)
        ctx.lineTo(cx - coneBottomW * 0.5, height)
        ctx.closePath()
        ctx.fill()

        // D. High-Intensity Lens Flare Hotspot at the Strike Collision
        const flare = ctx.createRadialGradient(cx, strikeY, 1, cx, strikeY, 32 * scaleX)
        flare.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
        flare.addColorStop(0.2, `rgba(${baseColorRgb}, 0.9)`)
        flare.addColorStop(0.6, `rgba(${baseColorRgb}, 0.25)`)
        flare.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = flare
        ctx.beginPath()
        ctx.arc(cx, strikeY, 32 * scaleX, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. DYNAMIC SPARK PARTICLES UPDATE & DRAW
      const remainingParticles: SparkParticle[] = []
      particlesRef.current.forEach((p) => {
        p.x += p.vx + Math.sin(p.life * p.wobble) * 0.3
        p.y += p.vy
        p.vy += 0.08 // mild gravity
        p.vx *= 0.985 // drag
        p.life -= 1 / p.maxLife

        if (p.life > 0 && p.y > 0 && p.y < height) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.6 + p.life * 0.4), 0, Math.PI * 2)
          ctx.fillStyle = p.color
          const alpha = Math.max(0, p.life) * (0.8 + 0.2 * Math.sin(p.life * p.twinkle))
          ctx.globalAlpha = alpha
          ctx.shadowBlur = 8
          ctx.shadowColor = p.color
          ctx.fill()
          remainingParticles.push(p)
        }
      })
      particlesRef.current = remainingParticles.slice(-300) // generous particle pool
      ctx.restore()

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [activeKeysAtStrike, isPlaying, keyCoordByMidi, spawnSparks])

  // Resize canvas according to container
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <div
      data-testid="piano-waterfall-stand"
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#F8F8F6] dark:bg-[#09090B] transition-colors ${className}`}
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-between overflow-hidden relative px-2 sm:px-4 py-2">
        {/* ─────────────────────────────────────────────────────────────
            AUTHENTIC ACOUSTIC CONCERT GRAND PIANO CONSOLE
           ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full flex-1 flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-300 dark:border-zinc-800/90 shadow-2xl bg-[#121216] transition-all">
          {/* Top Brass Inlay Line */}
          <div className="w-full h-1 bg-gradient-to-r from-amber-700/80 via-amber-400 to-amber-700/80 shrink-0" />

          {/* Unified Stage: Waterfall Canvas Track + Piano Keybed */}
          <div
            ref={containerRef}
            data-testid="waterfall-canvas-track"
            className="relative w-full flex-1 overflow-hidden bg-gradient-to-b from-[#0F0F14] via-[#0A0A0E] to-[#070709] flex flex-col justify-between"
            style={{ minHeight: '300px' }}
          >
            {/* 60 FPS Canvas: Volumetric Light Beams, Spotlights, and Spark Fountain */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />

            {/* SVG Layer: Falling Ribbons, Laser Strike Line, Felt Rail, and 88 Keys */}
            <svg
              viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
              preserveAspectRatio="none"
              className="w-full h-full select-none z-10"
            >
              <defs>
                {/* Neon Glow Filters */}
                <filter id="neon-glow-lh" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#EC4899" floodOpacity="0.9" />
                </filter>
                <filter id="neon-glow-rh" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FACC15" floodOpacity="0.9" />
                </filter>
                <filter id="laser-glow" x="-20%" y="-200%" width="140%" height="500%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Lane guides across all 52 white keys */}
              {keyMap
                .filter((k) => k.isWhite)
                .map((k) => (
                  <line
                    key={`lane-${k.midi}`}
                    x1={k.x}
                    y1={0}
                    x2={k.x}
                    y2={WATERFALL_HEIGHT}
                    stroke="#181822"
                    strokeWidth={0.8}
                    strokeDasharray="4 6"
                    opacity={0.35}
                  />
                ))}

              {/* Falling Note Ribbons (Neon Rounded Capsules) */}
              {waterfallNotes.map((note) => {
                const coord = keyCoordByMidi.get(note.midi)
                if (!coord) return null

                const noteHeight = Math.max(18, note.durationBeats * PX_PER_BEAT)
                const beatsUntilHit = note.startBeat - currentBeat
                const noteBottomY = STRIKE_LINE_Y - beatsUntilHit * PX_PER_BEAT
                const noteTopY = noteBottomY - noteHeight

                if (noteBottomY < -60 || noteTopY > WATERFALL_HEIGHT + 30) return null

                const isLh = note.hand === 'lh'
                const fillColor = isLh ? '#EC4899' : '#FACC15'
                const strokeColor = isLh ? '#F472B6' : '#FEF08A'
                const glowFilter = isLh ? 'url(#neon-glow-lh)' : 'url(#neon-glow-rh)'

                const ribbonWidth = coord.isWhite ? coord.width * 0.78 : coord.width * 0.85
                const ribbonX = coord.x + (coord.width - ribbonWidth) / 2

                return (
                  <g key={note.id} className="transition-transform duration-75">
                    {/* Glowing Capsule Body */}
                    <rect
                      x={ribbonX}
                      y={noteTopY}
                      width={ribbonWidth}
                      height={noteHeight}
                      rx={Math.min(6, ribbonWidth / 2)}
                      ry={Math.min(6, ribbonWidth / 2)}
                      fill={fillColor}
                      fillOpacity={0.75}
                      stroke={strokeColor}
                      strokeWidth={1.8}
                      filter={glowFilter}
                    />
                    {/* Specular Inner Highlight Line */}
                    <rect
                      x={ribbonX + 2}
                      y={noteTopY + 3}
                      width={ribbonWidth - 4}
                      height={Math.max(6, noteHeight - 6)}
                      rx={2}
                      fill="#FFFFFF"
                      fillOpacity={0.35}
                    />
                    {/* Bottom Strike Block */}
                    <rect
                      x={ribbonX}
                      y={noteBottomY - 7}
                      width={ribbonWidth}
                      height={7}
                      rx={2}
                      fill="#FFFFFF"
                      fillOpacity={0.9}
                    />
                  </g>
                )
              })}

              {/* Laser Strike Baseline across keybed */}
              <g data-testid="waterfall-strike-zone">
                <line
                  x1={0}
                  y1={STRIKE_LINE_Y}
                  x2={TOTAL_WIDTH}
                  y2={STRIKE_LINE_Y}
                  stroke="#EC4899"
                  strokeWidth={7}
                  strokeOpacity={0.4}
                  filter="url(#laser-glow)"
                />
                <line
                  x1={0}
                  y1={STRIKE_LINE_Y}
                  x2={TOTAL_WIDTH}
                  y2={STRIKE_LINE_Y}
                  stroke="#FACC15"
                  strokeWidth={2.5}
                  strokeOpacity={0.85}
                />
                <line
                  x1={0}
                  y1={STRIKE_LINE_Y}
                  x2={TOTAL_WIDTH}
                  y2={STRIKE_LINE_Y}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  strokeOpacity={0.95}
                />

                {/* Laser Calibration Ticks */}
                {Array.from({ length: 53 }).map((_, i) => (
                  <line
                    key={`tick-${i}`}
                    x1={i * 20}
                    y1={STRIKE_LINE_Y - (i % 7 === 0 ? 5 : 2.5)}
                    x2={i * 20}
                    y2={STRIKE_LINE_Y + (i % 7 === 0 ? 5 : 2.5)}
                    stroke="#FACC15"
                    strokeWidth={0.75}
                    strokeOpacity={0.65}
                  />
                ))}

                {/* Strike Line Badge */}
                <rect
                  x={12}
                  y={STRIKE_LINE_Y - 9}
                  width={112}
                  height={18}
                  rx={3}
                  fill="#0B0B0E"
                  stroke="#FACC15"
                  strokeWidth={1}
                />
                <text
                  x={68}
                  y={STRIKE_LINE_Y + 3.5}
                  textAnchor="middle"
                  fill="#FACC15"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="0.14em"
                  className="select-none pointer-events-none uppercase"
                >
                  STRIKE LINE
                </text>
              </g>

              {/* Grand Piano Crimson Felt Rail */}
              <rect
                x={0}
                y={WATERFALL_HEIGHT - 2}
                width={TOTAL_WIDTH}
                height={4}
                fill="#831843"
                stroke="#500724"
                strokeWidth={0.5}
              />

              {/* ─────────────────────────────────────────────────────────────
                  FULL 88-KEY CONCERT PIANO (52 White Keys + 36 Black Keys)
                 ───────────────────────────────────────────────────────────── */}
              {/* Pass 1: White Keys */}
              <g data-testid="waterfall-white-keys">
                {keyMap
                  .filter((k) => k.isWhite)
                  .map((k) => {
                    const activeHand = activeKeysAtStrike.get(k.midi)
                    const isActive = Boolean(activeHand)
                    const activeFill = activeHand === 'lh' ? '#EC4899' : '#FACC15'
                    const isMiddleC = k.midi === 60
                    const keyY = WATERFALL_HEIGHT + (isActive ? 2 : 0)
                    const keyH = WHITE_KEY_HEIGHT - (isActive ? 2 : 0)

                    return (
                      <g key={`wk-${k.midi}`}>
                        <rect
                          data-testid={`waterfall-key-${k.midi}`}
                          x={k.x + 0.5}
                          y={keyY}
                          width={k.width - 1}
                          height={keyH}
                          rx={2.5}
                          ry={2.5}
                          fill={isActive ? activeFill : isDark ? '#E4E4E7' : '#FFFFFF'}
                          stroke={
                            isActive
                              ? activeHand === 'lh'
                                ? '#F472B6'
                                : '#FEF08A'
                              : isDark
                              ? '#27272A'
                              : '#CBD5E1'
                          }
                          strokeWidth={isActive ? 2 : 0.8}
                          onClick={() => handleKeyClickInternal(k.midi)}
                          className="cursor-pointer transition-all duration-75"
                        />
                        {/* Ivory Bottom Chamfer */}
                        <line
                          x1={k.x + 1}
                          y1={WATERFALL_HEIGHT + WHITE_KEY_HEIGHT - 3}
                          x2={k.x + k.width - 2}
                          y2={WATERFALL_HEIGHT + WHITE_KEY_HEIGHT - 3}
                          stroke={isActive ? '#FFFFFF' : '#A1A1AA'}
                          strokeWidth={1.5}
                          opacity={0.4}
                        />
                        {/* Middle C Marker */}
                        {isMiddleC && (
                          <circle
                            cx={k.x + k.width / 2}
                            cy={WATERFALL_HEIGHT + WHITE_KEY_HEIGHT - 14}
                            r={2.5}
                            fill={isActive ? '#09090B' : '#F59E0B'}
                          />
                        )}
                        {/* Struck Key Indicator Dot */}
                        {isActive && (
                          <circle
                            cx={k.x + (k.width - 1) / 2}
                            cy={WATERFALL_HEIGHT + WHITE_KEY_HEIGHT - 20}
                            r={3}
                            fill="#09090B"
                          />
                        )}
                      </g>
                    )
                  })}
              </g>

              {/* Pass 2: Black Keys */}
              <g data-testid="waterfall-black-keys">
                {keyMap
                  .filter((k) => !k.isWhite)
                  .map((k) => {
                    const activeHand = activeKeysAtStrike.get(k.midi)
                    const isActive = Boolean(activeHand)
                    const activeFill = activeHand === 'lh' ? '#EC4899' : '#FACC15'
                    const keyY = WATERFALL_HEIGHT + (isActive ? 1.5 : 0)

                    return (
                      <g key={`bk-${k.midi}`}>
                        <rect
                          data-testid={`waterfall-key-${k.midi}`}
                          x={k.x}
                          y={keyY}
                          width={k.width}
                          height={BLACK_KEY_HEIGHT}
                          rx={2}
                          ry={2}
                          fill={isActive ? activeFill : isDark ? '#18181B' : '#121215'}
                          stroke={
                            isActive
                              ? activeHand === 'lh'
                                ? '#F472B6'
                                : '#FEF08A'
                              : isDark
                              ? '#3F3F46'
                              : '#27272A'
                          }
                          strokeWidth={isActive ? 2 : 0.8}
                          onClick={() => handleKeyClickInternal(k.midi)}
                          className="cursor-pointer transition-all duration-75"
                        />
                        {/* Black Key Specular Bevel */}
                        <line
                          x1={k.x + 1.5}
                          y1={keyY + 3}
                          x2={k.x + 1.5}
                          y2={keyY + BLACK_KEY_HEIGHT - 3}
                          stroke={isActive ? '#FFFFFF' : '#3F3F46'}
                          strokeWidth={1}
                          opacity={0.6}
                        />
                      </g>
                    )
                  })}
              </g>
            </svg>
          </div>
        </div>

        {/* Console Footprint Strip: Hand Palette & Range Badge */}
        <div className="w-full mt-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121215] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Left Hand (Neon Rose)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#FACC15] shadow-[0_0_8px_#FACC15]" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Right Hand (Electric Gold)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>88-Key Concert Grand</span>
            <span>•</span>
            <span>A0 to C8 (Middle C at C4)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
