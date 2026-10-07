import { useState, useId } from 'react'
import { useSpatialNavigation } from '@/components/spatial'
import {
  LIVING_MANUSCRIPT_COLORS,
  MUSICAL_GLYPHS,
} from '@/design-system/tokens'
import { CONSTELLATION_HISTORY_SPEC } from '@/design-system/screens'

export interface PracticeSessionNode {
  id: string
  pieceTitle: string
  composer: string
  date: string
  tempoBpm: number // X axis: 60 - 160
  accuracyPercent: number // Y axis: 60 - 100
  durationMinutes: number // Node radius: 4 - 14px
  pitchPurity: number // %
  timingPrecision: number // ms
  editorNote?: string
}

export interface ConstellationHistoryScreenProps {
  onReturnToStand?: () => void
  className?: string
}

/**
 * Extended practice session takes dataset for rich constellation rendering
 */
const SESSIONS_DATA: PracticeSessionNode[] = [
  ...CONSTELLATION_HISTORY_SPEC.sampleSessions,
  {
    id: 'take-06',
    pieceTitle: 'BWV 1004 Allemande',
    composer: 'J.S. Bach',
    date: 'Anno MMXXVI · Oct 6, 11:20',
    tempoBpm: 84,
    accuracyPercent: 96.5,
    durationMinutes: 28,
    pitchPurity: 97.0,
    timingPrecision: 10,
    editorNote:
      'Harmonic poise restored at 84 BPM. Leading tones centered within ±2.5 cents.',
  },
  {
    id: 'take-07',
    pieceTitle: 'Telemann Fantasia 1',
    composer: 'G.P. Telemann',
    date: 'Anno MMXXVI · Oct 4, 15:40',
    tempoBpm: 100,
    accuracyPercent: 91.2,
    durationMinutes: 20,
    pitchPurity: 92.5,
    timingPrecision: 15,
    editorNote:
      'Presto section clean; occasional rushing (+6ms) across string crossings in bar 22.',
  },
  {
    id: 'take-08',
    pieceTitle: 'Paganini Caprice 24',
    composer: 'N. Paganini',
    date: 'Anno MMXXVI · Oct 1, 19:15',
    tempoBpm: 124,
    accuracyPercent: 74.0,
    durationMinutes: 12,
    pitchPurity: 75.3,
    timingPrecision: 28,
    editorNote:
      'Severe breakdown horizon at 124 BPM. Left hand shift collapses intonation by -22 cents.',
  },
]

export function ConstellationHistoryScreen({
  onReturnToStand,
  className = '',
}: ConstellationHistoryScreenProps) {
  const { panTo } = useSpatialNavigation()
  const filterId = useId()
  const [selectedPiece, setSelectedPiece] = useState<string>('all')
  const [activeSessionId, setActiveSessionId] = useState<string>(
    SESSIONS_DATA[0].id,
  )
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)

  const handleReturn = () => {
    if (onReturnToStand) {
      onReturnToStand()
    } else {
      panTo('practice')
    }
  }

  // Active displayed session for the marginalia tooltip
  const displayedSessionId = hoveredSessionId ?? activeSessionId
  const activeSession =
    SESSIONS_DATA.find((s) => s.id === displayedSessionId) ?? SESSIONS_DATA[0]

  // Distinct piece titles for filtering
  const distinctPieces = Array.from(
    new Set(SESSIONS_DATA.map((s) => s.pieceTitle)),
  )

  // Coordinate mapping functions from SPEC
  const { canvasDimensions } = CONSTELLATION_HISTORY_SPEC
  const mapX = (bpm: number) => {
    const min = canvasDimensions.minTempoBpm
    const max = canvasDimensions.maxTempoBpm
    const clamped = Math.max(min, Math.min(max, bpm))
    return (
      canvasDimensions.paddingX +
      ((clamped - min) / (max - min)) * canvasDimensions.usableWidth
    )
  }

  const mapY = (acc: number) => {
    const min = canvasDimensions.minAccuracyPercent
    const max = canvasDimensions.maxAccuracyPercent
    const clamped = Math.max(min, Math.min(max, acc))
    // Inverted Y: 100% is top (paddingY = 60), 60% is bottom (540)
    return (
      canvasDimensions.height -
      canvasDimensions.paddingY -
      ((clamped - min) / (max - min)) * canvasDimensions.usableHeight
    )
  }

  const mapRadius = (mins: number) => {
    const clamped = Math.max(5, Math.min(45, mins))
    return 4 + ((clamped - 5) / (45 - 5)) * 10
  }

  // Group sessions by piece for constellation filaments
  const sessionsByPiece = distinctPieces.reduce<
    Record<string, PracticeSessionNode[]>
  >((acc, piece) => {
    acc[piece] = SESSIONS_DATA.filter((s) => s.pieceTitle === piece).sort(
      (a, b) => a.tempoBpm - b.tempoBpm,
    )
    return acc
  }, {})

  // BPM grid lines (60 to 160 step 20)
  const bpmTicks = [60, 80, 100, 120, 140, 160]
  // Accuracy grid lines (60% to 100% step 10%)
  const accuracyTicks = [60, 70, 80, 90, 100]

  // Breakdown horizon coordinate at 86 BPM
  const breakdownHorizonX = mapX(86)

  return (
    <div
      className={`w-full min-h-screen bg-[#F4F1EA] text-[#2C2A29] p-4 md:p-8 flex flex-col justify-between select-none ${className}`}
      data-testid="constellation-history-screen"
    >
      {/* 1. Folio Header & Telemetry Ledger Banner */}
      <header className="w-full border-b border-[#2C2A29] pb-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#7E7570] tracking-widest uppercase">
              <span>Folio III</span>
              <span>·</span>
              <span>Chronica Sessionum</span>
              <span>·</span>
              <span className="font-serif italic text-[#2C2A29]">
                Harmonices Mundi
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight text-[#2C2A29] mt-0.5">
              The Constellation History
            </h1>
            <p className="font-serif italic text-xs md:text-sm text-[#7E7570] mt-0.5">
              Celestial scatter chart mapping tempo velocity against pitch
              intonation purity across deliberate practice takes.
            </p>
          </div>

          {/* Return Anchor & Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturn}
              className="flex items-center gap-2 border border-[#2C2A29] bg-[#F4F1EA] px-4 py-2 font-serif text-xs md:text-sm font-semibold hover:border-[#9A2A2A] hover:bg-[#E9E4DA] hover:text-[#9A2A2A] transition-colors shadow-none cursor-pointer"
              aria-label="Return to Practice Stand"
            >
              <span className="font-mono text-base">
                {MUSICAL_GLYPHS.fermata}
              </span>
              <span>Return to Practice Stand →</span>
            </button>
          </div>
        </div>

        {/* Telemetry Strip & Piece Filter */}
        <div className="mt-4 pt-3 border-t border-[#2C2A29]/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-[#7E7570]">
            <span className="text-[#9A2A2A] font-bold">LEDGER:</span>
            <span>48 TAKES RECORDED // TOTAL DISCIPLINE: 16.4 HRS</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-[#9A2A2A] font-semibold">
              CRITICAL THRESHOLD: 86 BPM
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#7E7570] mr-1 uppercase text-[10px]">
              Filter Opus:
            </span>
            <button
              onClick={() => setSelectedPiece('all')}
              className={`px-2.5 py-1 text-[11px] border transition-colors shadow-none cursor-pointer ${
                selectedPiece === 'all'
                  ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                  : 'border-[#2C2A29]/40 bg-[#F4F1EA] text-[#2C2A29] hover:border-[#2C2A29]'
              }`}
            >
              All Opuses ({SESSIONS_DATA.length})
            </button>
            {distinctPieces.map((piece) => {
              const isSelected = selectedPiece === piece
              const count = SESSIONS_DATA.filter(
                (s) => s.pieceTitle === piece,
              ).length
              return (
                <button
                  key={piece}
                  onClick={() => setSelectedPiece(piece)}
                  className={`px-2.5 py-1 text-[11px] border transition-colors shadow-none cursor-pointer ${
                    isSelected
                      ? 'border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA]'
                      : 'border-[#2C2A29]/40 bg-[#F4F1EA] text-[#2C2A29] hover:border-[#2C2A29]'
                  }`}
                >
                  {piece} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* 2. Main Work Area: Celestial SVG Scatter Plot & Marginalia Tooltip */}
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left: Astronomical Star Map SVG Canvas */}
        <div className="flex-1 relative border-2 border-[#2C2A29] bg-[#F4F1EA] p-2 sm:p-4 overflow-hidden flex flex-col justify-center">
          {/* Ornate corner bracket flourishes */}
          <span className="absolute top-1 left-1.5 font-serif text-xs text-[#2C2A29]/40 pointer-events-none select-none">
            ⌜
          </span>
          <span className="absolute top-1 right-1.5 font-serif text-xs text-[#2C2A29]/40 pointer-events-none select-none">
            ⌝
          </span>
          <span className="absolute bottom-1 left-1.5 font-serif text-xs text-[#2C2A29]/40 pointer-events-none select-none">
            ⌞
          </span>
          <span className="absolute bottom-1 right-1.5 font-serif text-xs text-[#2C2A29]/40 pointer-events-none select-none">
            ⌟
          </span>

          <svg
            viewBox="0 0 1000 600"
            className="w-full h-auto max-h-[68vh] select-none"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Celestial Scatter Plot of Practice Takes"
          >
            <defs>
              {/* Subtle radial parchment gradient */}
              <radialGradient id={`parchment-grad-${filterId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FAF7F0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F4F1EA" stopOpacity="1" />
              </radialGradient>
              {/* Glow filter for pristine takes */}
              <filter id={`aureole-glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Background */}
            <rect
              width="1000"
              height="600"
              fill={`url(#parchment-grad-${filterId})`}
            />

            {/* Keplerian Planetary Orbits / Concentric Celestial Arcs */}
            {[100, 200, 300, 400, 480].map((radius) => (
              <circle
                key={radius}
                cx="500"
                cy="300"
                r={radius}
                fill="none"
                stroke="#2C2A29"
                strokeOpacity="0.05"
                strokeDasharray="3 4"
              />
            ))}

            {/* Faint 5-Line Musical Staff Watermarks */}
            {[140, 420].map((baselineY) => (
              <g key={baselineY} opacity="0.04">
                {[0, 8, 16, 24, 32].map((offset) => (
                  <line
                    key={offset}
                    x1="80"
                    y1={baselineY + offset}
                    x2="920"
                    y2={baselineY + offset}
                    stroke="#2C2A29"
                    strokeWidth="1"
                  />
                ))}
              </g>
            ))}

            {/* Celestial Quadrant & Astronomical Marginalia Annotations */}
            <text
              x="915"
              y="45"
              textAnchor="end"
              fontFamily="'Geist Mono', monospace"
              fontSize="9"
              fill="#7E7570"
              letterSpacing="1"
            >
              ✦ ASCENSIO TEMPORIS (VELOCITAS)
            </text>
            <text
              x="85"
              y="45"
              fontFamily="'Geist Mono', monospace"
              fontSize="9"
              fill="#7E7570"
              letterSpacing="1"
            >
              ✦ DECLINATIO HARMONICA (PURITAS)
            </text>
            <text
              x="500"
              y="592"
              textAnchor="middle"
              fontFamily="'Geist Mono', monospace"
              fontSize="8"
              fill="#7E7570"
              letterSpacing="2"
            >
              HARMONICES MUNDI // SYSTEMA MMXXVI // ASTRONOMIA PRACTICA
            </text>

            {/* Horizontal Grid Lines (Accuracy: 60% to 100%) */}
            {accuracyTicks.map((acc) => {
              const y = mapY(acc)
              return (
                <g key={acc}>
                  <line
                    x1="80"
                    y1={y}
                    x2="920"
                    y2={y}
                    stroke="#2C2A29"
                    strokeOpacity={acc === 100 ? 0.35 : 0.12}
                    strokeWidth={acc === 100 ? 1.5 : 1}
                    strokeDasharray={acc === 100 ? 'none' : '2 3'}
                  />
                  <text
                    x="72"
                    y={y + 3.5}
                    textAnchor="end"
                    fontFamily="'Geist Mono', monospace"
                    fontSize="10"
                    fill={acc === 100 ? '#2C2A29' : '#7E7570'}
                    fontWeight={acc === 100 ? 'bold' : 'normal'}
                  >
                    {acc}%
                  </text>
                </g>
              )
            })}

            {/* Vertical Grid Lines (Tempo: 60 to 160 BPM) */}
            {bpmTicks.map((bpm) => {
              const x = mapX(bpm)
              return (
                <g key={bpm}>
                  <line
                    x1={x}
                    y1="60"
                    x2={x}
                    y2="540"
                    stroke="#2C2A29"
                    strokeOpacity="0.12"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y="556"
                    textAnchor="middle"
                    fontFamily="'Geist Mono', monospace"
                    fontSize="10"
                    fill="#7E7570"
                  >
                    {bpm} BPM
                  </text>
                </g>
              )
            })}

            {/* Critical Breakdown Horizon Line (86 BPM) */}
            <g>
              <line
                x1={breakdownHorizonX}
                y1="60"
                x2={breakdownHorizonX}
                y2="540"
                stroke="#9A2A2A"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <rect
                x={breakdownHorizonX - 2}
                y="65"
                width="142"
                height="16"
                fill="#F4F1EA"
                stroke="#9A2A2A"
                strokeWidth="1"
              />
              <text
                x={breakdownHorizonX + 4}
                y="77"
                fontFamily="'Geist Mono', monospace"
                fontSize="8.5"
                fill="#9A2A2A"
                fontWeight="bold"
                letterSpacing="0.5"
              >
                HORIZON CRITICUS (86 BPM)
              </text>
            </g>

            {/* Axis Labels */}
            <text
              x="500"
              y="575"
              textAnchor="middle"
              fontFamily="'Playfair Display', Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="#2C2A29"
            >
              Tempo Velocity (Beats per Minute) →
            </text>
            <text
              x="30"
              y="300"
              textAnchor="middle"
              transform="rotate(-90 30 300)"
              fontFamily="'Playfair Display', Georgia, serif"
              fontStyle="italic"
              fontSize="11"
              fill="#2C2A29"
            >
              ↑ Intonation & Performance Accuracy (%)
            </text>

            {/* Constellation Filaments: Connecting takes of the same opus */}
            {Object.entries(sessionsByPiece).map(([piece, nodes]) => {
              if (nodes.length < 2) return null
              const isPieceSelected =
                selectedPiece === 'all' || selectedPiece === piece
              const hasActiveSession = nodes.some(
                (n) => n.id === displayedSessionId,
              )

              // Build SVG path data for the constellation filament
              const pathData = nodes.reduce((acc, node, idx) => {
                const x = mapX(node.tempoBpm)
                const y = mapY(node.accuracyPercent)
                return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
              }, '')

              const filamentColor = hasActiveSession
                ? '#9A2A2A'
                : isPieceSelected
                  ? '#2C2A29'
                  : '#7E7570'

              const filamentOpacity = hasActiveSession
                ? 0.9
                : isPieceSelected
                  ? 0.4
                  : 0.15

              return (
                <g key={`filament-${piece}`}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={filamentColor}
                    strokeWidth={hasActiveSession ? 2 : 1.25}
                    strokeDasharray={hasActiveSession ? 'none' : '4 3'}
                    strokeOpacity={filamentOpacity}
                  />
                  {/* Faint directional arrows or order labels on filament */}
                  {nodes.map((node, idx) => {
                    if (idx === nodes.length - 1) return null
                    const next = nodes[idx + 1]
                    const midX = (mapX(node.tempoBpm) + mapX(next.tempoBpm)) / 2
                    const midY =
                      (mapY(node.accuracyPercent) +
                        mapY(next.accuracyPercent)) /
                      2
                    return (
                      <text
                        key={`mid-${node.id}`}
                        x={midX}
                        y={midY - 4}
                        fontFamily="'Geist Mono', monospace"
                        fontSize="7"
                        fill={filamentColor}
                        opacity={filamentOpacity}
                        textAnchor="middle"
                      >
                        seq.{idx + 1}
                      </text>
                    )
                  })}
                </g>
              )
            })}

            {/* Celestial Star Nodes */}
            {SESSIONS_DATA.map((session) => {
              const cx = mapX(session.tempoBpm)
              const cy = mapY(session.accuracyPercent)
              const radius = mapRadius(session.durationMinutes)
              const isSelected = session.id === activeSessionId
              const isHovered = session.id === hoveredSessionId
              const isHighlighted = isSelected || isHovered
              const isFilteredOut =
                selectedPiece !== 'all' && session.pieceTitle !== selectedPiece

              // Star Typology & Aesthetics
              const isPristine = session.accuracyPercent >= 95
              const isBreakdown =
                session.accuracyPercent < 80 ||
                session.tempoBpm >= 115 ||
                session.accuracyPercent <= 82.5

              let starColor = LIVING_MANUSCRIPT_COLORS.charcoal
              if (isBreakdown) starColor = LIVING_MANUSCRIPT_COLORS.crimson
              else if (isPristine) starColor = LIVING_MANUSCRIPT_COLORS.goldLeaf

              return (
                <g
                  key={session.id}
                  className="cursor-pointer transition-transform duration-150"
                  opacity={isFilteredOut ? 0.25 : 1}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  onClick={() => setActiveSessionId(session.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${session.pieceTitle} at ${session.tempoBpm} BPM, Accuracy ${session.accuracyPercent}%`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveSessionId(session.id)
                    }
                  }}
                >
                  {/* Outer selection ring / halo */}
                  {isHighlighted && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 8}
                      fill="none"
                      stroke="#9A2A2A"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Golden aureole for pristine takes */}
                  {isPristine && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 4}
                      fill="none"
                      stroke="#C8A858"
                      strokeWidth="1"
                      strokeOpacity="0.8"
                    />
                  )}

                  {/* Star core circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={isBreakdown ? '#9A2A2A' : '#2C2A29'}
                    stroke={isHighlighted ? '#9A2A2A' : '#F4F1EA'}
                    strokeWidth="1.5"
                  />

                  {/* Central star glyph symbol */}
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fontSize={Math.max(10, radius + 2)}
                    fill={
                      isPristine
                        ? '#C8A858'
                        : isBreakdown
                          ? '#F4F1EA'
                          : '#F4F1EA'
                    }
                    className="pointer-events-none select-none font-serif"
                  >
                    {isBreakdown
                      ? '✦'
                      : isPristine
                        ? '✦'
                        : MUSICAL_GLYPHS.starNode}
                  </text>

                  {/* Label near node if highlighted */}
                  {isHighlighted && (
                    <g className="pointer-events-none">
                      <rect
                        x={cx - 40}
                        y={cy - radius - 20}
                        width="80"
                        height="15"
                        fill="#2C2A29"
                        stroke="#F4F1EA"
                        strokeWidth="0.5"
                      />
                      <text
                        x={cx}
                        y={cy - radius - 9}
                        textAnchor="middle"
                        fontFamily="'Geist Mono', monospace"
                        fontSize="9"
                        fill="#F4F1EA"
                      >
                        {session.tempoBpm} BPM · {session.accuracyPercent}%
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Right: Illuminated Marginalia Tooltip & Active Take Inspector Folio */}
        <aside
          className="w-full lg:w-96 flex flex-col justify-between border-2 border-[#2C2A29] bg-[#F4F1EA] p-5 shadow-none"
          aria-label="Active Star Inspector Folio"
        >
          <div>
            {/* Folio Marginalia Card Header */}
            <div className="flex justify-between items-baseline border-b border-[#2C2A29] pb-3 mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#7E7570]">
                  Folium Inspectionis Stellae
                </div>
                <h2 className="font-serif text-xl font-bold tracking-tight text-[#2C2A29] mt-0.5">
                  {activeSession.pieceTitle}
                </h2>
                <div className="font-serif italic text-xs text-[#7E7570]">
                  {activeSession.composer}
                </div>
              </div>
              <div className="font-mono text-xs border border-[#2C2A29] px-2 py-0.5 bg-[#E9E4DA]">
                {activeSession.id.toUpperCase()}
              </div>
            </div>

            {/* Date and Timestamp */}
            <div className="font-mono text-[11px] text-[#7E7570] mb-4">
              {activeSession.date}
            </div>

            {/* Telemetry Matrix Ledger */}
            <div className="grid grid-cols-2 gap-2 border border-[#2C2A29] p-3 bg-[#E9E4DA]/40 mb-4 font-mono">
              <div className="border-r border-b border-[#2C2A29]/20 pb-2 pr-2">
                <div className="text-[9px] uppercase tracking-wider text-[#7E7570]">
                  Tempo Velocity
                </div>
                <div className="text-lg font-bold text-[#2C2A29] mt-0.5">
                  {activeSession.tempoBpm}{' '}
                  <span className="text-xs font-normal">BPM</span>
                </div>
              </div>

              <div className="border-b border-[#2C2A29]/20 pb-2 pl-2">
                <div className="text-[9px] uppercase tracking-wider text-[#7E7570]">
                  Performance Accuracy
                </div>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    activeSession.accuracyPercent >= 90
                      ? 'text-[#2C2A29]'
                      : 'text-[#9A2A2A]'
                  }`}
                >
                  {activeSession.accuracyPercent}%
                </div>
              </div>

              <div className="border-r border-[#2C2A29]/20 pt-2 pr-2">
                <div className="text-[9px] uppercase tracking-wider text-[#7E7570]">
                  Pitch Purity
                </div>
                <div className="text-sm font-semibold text-[#2C2A29] mt-0.5">
                  {activeSession.pitchPurity}%
                </div>
              </div>

              <div className="pt-2 pl-2">
                <div className="text-[9px] uppercase tracking-wider text-[#7E7570]">
                  Timing Precision
                </div>
                <div className="text-sm font-semibold text-[#2C2A29] mt-0.5">
                  ±{activeSession.timingPrecision} ms
                </div>
              </div>
            </div>

            {/* Session Duration */}
            <div className="flex justify-between items-center font-mono text-xs border-b border-[#2C2A29]/20 pb-2 mb-4">
              <span className="text-[#7E7570]">Discipline Duration:</span>
              <span className="font-bold text-[#2C2A29]">
                {activeSession.durationMinutes} Minutes (Take Node ⌀)
              </span>
            </div>

            {/* Crimson Rubricated Editor Marginal Note */}
            {activeSession.editorNote && (
              <div className="border border-[#9A2A2A] bg-[#E9E4DA]/70 p-3.5 my-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#9A2A2A] uppercase tracking-wider font-bold mb-1">
                  <span>{MUSICAL_GLYPHS.coda}</span>
                  <span>Nota Editoris (Critical Diagnosis)</span>
                </div>
                <p className="font-serif italic text-xs text-[#9A2A2A] leading-relaxed">
                  "{activeSession.editorNote}"
                </p>
              </div>
            )}
          </div>

          {/* Action / Isolate Button */}
          <div className="pt-4 border-t border-[#2C2A29] mt-4 flex flex-col gap-2">
            <button
              onClick={handleReturn}
              className="w-full border border-[#2C2A29] bg-[#2C2A29] text-[#F4F1EA] py-2.5 font-serif text-xs md:text-sm hover:bg-[#9A2A2A] transition-colors shadow-none cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="font-mono text-sm">{MUSICAL_GLYPHS.fermata}</span>
              <span>Rehearse Passage on Practice Stand</span>
            </button>
            <p className="font-mono text-[9px] text-[#7E7570] text-center">
              Pans 2D camera right to Stand (0, 0)
            </p>
          </div>
        </aside>
      </div>

      {/* 3. Footer Legend & Colophon */}
      <footer className="w-full border-t border-[#2C2A29] pt-3 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[10px] text-[#7E7570]">
        {/* Star Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#2C2A29] uppercase">Legend:</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#C8A858] font-bold text-xs">✦</span>
            <span>Pristine (≥95%)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#2C2A29] font-bold text-xs">✦</span>
            <span>Disciplined (85–94%)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[#9A2A2A] font-bold text-xs">✦</span>
            <span>Breakdown / Critical (&lt;85%)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-bold text-xs">┄</span>
            <span>Constellation Filaments</span>
          </span>
        </div>

        <div className="italic font-serif text-xs text-[#2C2A29]">
          Folio III · PRISM Constellation History · Anno MMXXVI
        </div>
      </footer>
    </div>
  )
}
