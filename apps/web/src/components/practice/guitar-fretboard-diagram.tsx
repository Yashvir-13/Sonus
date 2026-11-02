import React, { useMemo } from 'react'
import type { GuitarTabVoicing } from '@/lib/music/chord-voicings'
import { parseFingeringString } from '@/lib/music/chord-voicings'

export { parseFingeringString }

export interface GuitarFretboardDiagramProps {
  chordName?: string
  guitarTab: GuitarTabVoicing
  fretCount?: number
  showFingerLabels?: boolean
  showInlays?: boolean
  className?: string
}

const STRING_X = [20, 48, 76, 104, 132, 160]
const INLAY_FRET_NUMBERS = [3, 5, 7, 9, 15, 17, 19, 21]

/**
 * Formats a fret number with its proper English ordinal suffix:
 * 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", etc.
 */
export function formatFretOrdinal(fret: number): string {
  const rem100 = fret % 100
  if (rem100 >= 11 && rem100 <= 13) {
    return `${fret}th`
  }
  switch (fret % 10) {
    case 1:
      return `${fret}st`
    case 2:
      return `${fret}nd`
    case 3:
      return `${fret}rd`
    default:
      return `${fret}th`
  }
}

/**
 * Backward-compatible alias for formatFretOrdinal.
 */
export const getOrdinalSuffix = formatFretOrdinal

/**
 * Computes dynamic baseFret viewport offset for high-position chords.
 */
export function computeBaseFret(guitarTab: GuitarTabVoicing, fretCount = 4): number {
  if (guitarTab.baseFret && guitarTab.baseFret > 0) {
    return guitarTab.baseFret
  }

  const frets = guitarTab.frets ?? []
  const fretted = frets.filter((f): f is number => f !== null && f > 0)
  if (fretted.length === 0) return 1

  const maxFret = Math.max(...fretted)
  const minFret = Math.min(...fretted)

  if (maxFret <= fretCount) {
    return 1
  }

  const targetBase = guitarTab.barreFret && guitarTab.barreFret <= minFret 
    ? guitarTab.barreFret 
    : minFret

  if (maxFret - (targetBase - 1) > fretCount) {
    return Math.max(1, maxFret - fretCount + 1)
  }

  return Math.max(1, targetBase)
}

/**
 * Production-grade SVG Guitar Fretboard Diagram.
 * Features:
 * - Accurate string (x) and fret (y) coordinate system
 * - In-SVG vector open ('O') and muted ('X') glyphs at y=6
 * - Fret position dots with centered, contrasting finger numbers (1..4, T)
 * - Vector rounded pill barre chords across barred strings
 * - Dynamic baseFret offset for chords past fret 4 with position label (e.g. "3fr")
 * - Fretboard neck inlays at frets 3, 5, 7, 9
 */
export const GuitarFretboardDiagram: React.FC<GuitarFretboardDiagramProps> = ({
  chordName,
  guitarTab,
  fretCount = 4,
  showFingerLabels = true,
  showInlays = true,
  className = '',
}) => {
  const fretHeight = 20
  const nutY = 12
  const bottomFretY = nutY + fretCount * fretHeight

  // 1. Compute viewport baseFret
  const baseFret = useMemo(() => computeBaseFret(guitarTab, fretCount), [guitarTab, fretCount])
  const isNutVisible = baseFret === 1

  // 2. Resolve fingerings array
  const fingers = useMemo(() => {
    if (guitarTab.fingers && Array.isArray(guitarTab.fingers)) {
      return guitarTab.fingers
    }
    return parseFingeringString(guitarTab.fingering || '')
  }, [guitarTab.fingers, guitarTab.fingering])

  // 3. Horizontal fret wires: [32, 52, 72, 92...]
  const fretWireYs = useMemo(() => {
    const wires: number[] = []
    for (let i = 1; i <= fretCount; i++) {
      wires.push(nutY + i * fretHeight)
    }
    return wires
  }, [nutY, fretCount, fretHeight])

  // 4. Barre chord calculation
  const barreInfo = useMemo(() => {
    const barreFret = guitarTab.barreFret
    if (!barreFret || barreFret < baseFret || barreFret > baseFret + fretCount - 1) {
      return null
    }

    const relFret = barreFret - (baseFret - 1)
    const barreY = nutY + (relFret - 0.5) * fretHeight

    // Find strings fretted at barreFret
    const matchingStrings: number[] = []
    guitarTab.frets.forEach((f, idx) => {
      if (f === barreFret) {
        matchingStrings.push(idx)
      }
    })

    if (matchingStrings.length < 2) return null

    const fromStr = Math.min(...matchingStrings)
    const toStr = Math.max(...matchingStrings)
    const x1 = STRING_X[fromStr]
    const x2 = STRING_X[toStr]

    return {
      barreFret,
      y: barreY,
      x1,
      x2,
      width: x2 - x1 + 14,
      rectX: x1 - 7,
      fromStr,
      toStr,
    }
  }, [guitarTab.barreFret, guitarTab.frets, baseFret, fretCount, nutY, fretHeight])

  // 5. Inlay positions in visible range
  const visibleInlays = useMemo(() => {
    if (!showInlays) return []
    const inlays: { y: number; isDouble: boolean }[] = []

    for (let f = 1; f <= fretCount; f++) {
      const absFret = baseFret + f - 1
      if (absFret === 12) {
        inlays.push({ y: nutY + (f - 0.5) * fretHeight, isDouble: true })
      } else if (INLAY_FRET_NUMBERS.includes(absFret)) {
        inlays.push({ y: nutY + (f - 0.5) * fretHeight, isDouble: false })
      }
    }
    return inlays
  }, [showInlays, baseFret, fretCount, nutY, fretHeight])

  return (
    <div
      data-testid="fretboard-diagram"
      className={`flex flex-col items-center select-none ${className}`}
      aria-label={`Fretboard diagram for ${chordName || 'chord'}`}
    >
      <svg
        role="img"
        aria-label={chordName ? `Fretboard diagram for ${chordName}` : 'Guitar fretboard diagram'}
        width="180"
        height="100"
        viewBox="0 0 180 100"
        className="bg-[#FCFBF8] dark:bg-[#1A1816] border border-[#D9D3C7] dark:border-[#38342E] rounded"
      >
        {/* ── Position Offset Label (when baseFret > 1) ── */}
        {!isNutVisible && (
          <text
            x="14"
            y={nutY + 0.5 * fretHeight}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-[#736E65] dark:fill-[#A39C8F] font-mono font-bold text-[10px]"
          >
            {baseFret}fr
          </text>
        )}

        {/* ── Nut Line OR Top Fret Wire ── */}
        {isNutVisible ? (
          <line
            x1="20"
            y1={nutY}
            x2="160"
            y2={nutY}
            stroke="currentColor"
            className="text-[#242321] dark:text-[#EDE8DF]"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : (
          <line
            x1="20"
            y1={nutY}
            x2="160"
            y2={nutY}
            stroke="currentColor"
            className="text-[#C9C3B5] dark:text-[#3E3A32]"
            strokeWidth="1.5"
          />
        )}

        {/* ── Horizontal Fret Wires (1 to fretCount) ── */}
        {fretWireYs.map((y, idx) => (
          <line
            key={`wire-${idx}`}
            x1="20"
            y1={y}
            x2="160"
            y2={y}
            stroke="currentColor"
            className="text-[#C9C3B5] dark:text-[#3E3A32]"
            strokeWidth="1.5"
          />
        ))}

        {/* ── Fretboard Neck Inlays ── */}
        {visibleInlays.map((inlay, idx) =>
          inlay.isDouble ? (
            <g key={`inlay-double-${idx}`}>
              <circle data-testid="fret-inlay" cx="62" cy={inlay.y} r="2.5" className="fill-[#D9D3C7] dark:fill-[#38342E]" />
              <circle data-testid="fret-inlay" cx="118" cy={inlay.y} r="2.5" className="fill-[#D9D3C7] dark:fill-[#38342E]" />
            </g>
          ) : (
            <circle
              key={`inlay-${idx}`}
              data-testid="fret-inlay"
              cx="90"
              cy={inlay.y}
              r="2.5"
              className="fill-[#D9D3C7] dark:fill-[#38342E]"
            />
          )
        )}

        {/* ── 6 Vertical String Lines ── */}
        {STRING_X.map((x, sIdx) => (
          <line
            key={`string-${sIdx}`}
            x1={x}
            y1={nutY}
            x2={x}
            y2={bottomFretY}
            stroke="currentColor"
            className="text-[#8A857A] dark:text-[#5C564C]"
            strokeWidth="1"
          />
        ))}

        {/* ── In-SVG Open ('O') & Muted ('X') Indicators at y=6 ── */}
        {STRING_X.map((x, sIdx) => {
          const fret = guitarTab.frets[sIdx]
          if (fret === null || fret < 0) {
            // Muted string 'X'
            return (
              <g key={`mute-${sIdx}`} data-testid="nut-marker">
                <g data-testid="mute-marker">
                  <line
                    x1={x - 3.5}
                    y1={2.5}
                    x2={x + 3.5}
                    y2={9.5}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-[#736E65] dark:text-[#A39C8F]"
                  />
                  <line
                    x1={x - 3.5}
                    y1={9.5}
                    x2={x + 3.5}
                    y2={2.5}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-[#736E65] dark:text-[#A39C8F]"
                  />
                </g>
              </g>
            )
          }
          if (fret === 0) {
            // Open string 'O'
            return (
              <g key={`open-${sIdx}`} data-testid="nut-marker">
                <circle
                  data-testid="open-marker"
                  cx={x}
                  cy={6}
                  r={3.5}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#736E65] dark:text-[#A39C8F]"
                />
              </g>
            )
          }
          // Fretted string: render nothing above the nut
          return null
        })}

        {/* ── Barre Chord Vector Pill ── */}
        {barreInfo && (
          <g>
            <rect
              data-testid="barre-pill"
              x={barreInfo.rectX}
              y={barreInfo.y - 7}
              width={barreInfo.width}
              height={14}
              rx={7}
              ry={7}
              className="fill-[#242321] dark:fill-[#EDE8DF]"
            />
            {showFingerLabels && (
              <text
                data-testid="barre-finger-label"
                x={barreInfo.x1}
                y={barreInfo.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[#FAF8F3] dark:fill-[#141312] font-mono font-bold text-[9px]"
              >
                1
              </text>
            )}
          </g>
        )}

        {/* ── Fret Position Dots with Finger Numbers ── */}
        {STRING_X.map((x, sIdx) => {
          const fret = guitarTab.frets[sIdx]
          if (!fret || fret <= 0) return null

          const relFret = fret - (baseFret - 1)
          if (relFret < 1 || relFret > fretCount) return null

          const fretY = nutY + (relFret - 0.5) * fretHeight

          // If covered by barre and barre renders finger at this string, skip duplicate text/dot
          const isBarreOrigin = barreInfo && fret === barreInfo.barreFret && sIdx === barreInfo.fromStr
          const isBarreCovered = barreInfo && fret === barreInfo.barreFret && sIdx > barreInfo.fromStr && sIdx <= barreInfo.toStr

          // Resolve finger label
          let fingerLabel = fingers[sIdx]
          if (!fingerLabel && barreInfo && fret === barreInfo.barreFret) {
            fingerLabel = 1
          }

          if (isBarreCovered || isBarreOrigin) {
            return null
          }

          return (
            <g key={`dot-${sIdx}`}>
              <circle
                data-testid="fret-dot"
                cx={x}
                cy={fretY}
                r="7"
                className="fill-[#242321] dark:fill-[#EDE8DF]"
              />
              {showFingerLabels && fingerLabel && (
                <text
                  data-testid="fret-finger-label"
                  x={x}
                  y={fretY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-[#FAF8F3] dark:fill-[#141312] font-mono font-bold text-[9px]"
                >
                  {fingerLabel}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* ── Bottom Fingering String Caption ── */}
      {guitarTab.fingering && (
        <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] mt-1">
          Fingering: {guitarTab.fingering}
        </div>
      )}
    </div>
  )
}
