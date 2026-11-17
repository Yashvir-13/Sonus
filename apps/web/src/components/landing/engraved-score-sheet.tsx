import React from 'react'

export type EngravedScoreSheetProps = {
  className?: string
}

/**
 * Crisp two-page vector Grand Staff score anchored cleanly over the piano desk in Act 3.
 * Renders real treble & bass clefs, chords (G, D, Am, C), bar timing annotations,
 * amber beat playhead, and a highlighted missed E3 note on Measure 4 at native display DPI.
 */
export function EngravedScoreSheet({
  className = '',
}: EngravedScoreSheetProps): React.JSX.Element {
  return (
    <div
      data-testid="world-sheet-pin"
      className={`relative w-full max-w-[560px] rounded-xl border border-stone-400/50 dark:border-zinc-600/60 bg-[#FAF5E8] dark:bg-[#EAE5D8] text-zinc-900 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Subtle Book Spine Gutter Down Center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 bg-gradient-to-r from-stone-900/12 via-stone-900/22 to-stone-900/12"
      />

      {/* Top Margin Score Title Strip */}
      <div className="px-4 sm:px-5 pt-3 pb-1.5 flex items-center justify-between border-b border-stone-300/80 text-[11px] font-mono text-stone-700">
        <span className="font-semibold text-stone-900">Bar-by-Bar Timing Take · G Major</span>
        <span className="tabular-nums text-stone-600">80 BPM · 4/4</span>
      </div>

      {/* Crisp Vector SVG Two-Page Grand Staff */}
      <svg
        viewBox="0 0 640 310"
        className="w-full h-auto block select-none"
        role="img"
        aria-label="Two-page sheet music showing Measures 1 to 3 on beat and Measure 4 late transition with missed E3 tone"
      >
        <defs>
          <linearGradient id="sonus-page-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FAF5E8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#E6DCC6" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="640" height="310" fill="url(#sonus-page-sheen)" />

        {/* ══════════════════════════════════════════════════════════════════
            LEFT PAGE: MEASURES 1 (G) & 2 (D) — ON BEAT
           ══════════════════════════════════════════════════════════════════ */}
        {/* Measure 1 & 2 Timing Headers */}
        <text x="58" y="28" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#18181B">
          M1 · G
        </text>
        <rect x="112" y="16" width="44" height="17" rx="4" fill="#059669" fillOpacity="0.14" />
        <text
          x="134"
          y="28"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          fill="#047857"
        >
          -2ms
        </text>

        <text x="192" y="28" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#18181B">
          M2 · D
        </text>
        <rect x="246" y="16" width="44" height="17" rx="4" fill="#059669" fillOpacity="0.14" />
        <text
          x="268"
          y="28"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          fill="#047857"
        >
          +4ms
        </text>

        {/* System Brace & Barlines (Left Page) */}
        <line x1="28" y1="54" x2="28" y2="236" stroke="#27272A" strokeWidth="2.5" />
        <line x1="176" y1="54" x2="176" y2="236" stroke="#52525B" strokeWidth="1.2" />
        <line x1="304" y1="54" x2="304" y2="236" stroke="#27272A" strokeWidth="1.5" />

        {/* Left Page Treble Staff (y = 54..94, spacing 10) */}
        {[54, 64, 74, 84, 94].map((y) => (
          <line key={`lt-${y}`} x1="28" y1={y} x2="304" y2={y} stroke="#52525B" strokeWidth="1" />
        ))}
        {/* Left Page Bass Staff (y = 196..236, spacing 10) */}
        {[196, 206, 216, 226, 236].map((y) => (
          <line key={`lb-${y}`} x1="28" y1={y} x2="304" y2={y} stroke="#52525B" strokeWidth="1" />
        ))}

        {/* Treble & Bass Clef Symbols */}
        <text x="34" y="90" fontSize="42" fill="#18181B" fontFamily="serif">
          𝄞
        </text>
        <text x="35" y="226" fontSize="34" fill="#18181B" fontFamily="serif">
          𝄢
        </text>

        {/* Sharp (F#) Key Signature */}
        <text x="64" y="60" fontSize="14" fontWeight="700" fill="#18181B">
          ♯
        </text>
        <text x="64" y="211" fontSize="14" fontWeight="700" fill="#18181B">
          ♯
        </text>

        {/* Measure 1 Notes (G Major Arpeggio - Emerald Verified) */}
        {/* Bass Root G2 */}
        <ellipse cx="94" cy="231" rx="6" ry="4.5" fill="#047857" transform="rotate(-15 94 231)" />
        <line x1="99.5" y1="231" x2="99.5" y2="196" stroke="#047857" strokeWidth="1.6" />
        <ellipse cx="128" cy="211" rx="6" ry="4.5" fill="#047857" transform="rotate(-15 128 211)" />
        <line x1="133.5" y1="211" x2="133.5" y2="178" stroke="#047857" strokeWidth="1.6" />
        {/* Treble Triad G4-B4-D5 */}
        {[
          { x: 96, y: 84 },
          { x: 120, y: 74 },
          { x: 144, y: 64 },
        ].map((n, idx) => (
          <g key={`m1n-${idx}`}>
            <ellipse
              cx={n.x}
              cy={n.y}
              rx="6"
              ry="4.5"
              fill="#18181B"
              transform={`rotate(-15 ${n.x} ${n.y})`}
            />
            <line x1={n.x + 5.2} y1={n.y} x2={n.x + 5.2} y2={n.y - 28} stroke="#18181B" strokeWidth="1.5" />
          </g>
        ))}
        <line x1="101.2" y1="56" x2="149.2" y2="36" stroke="#18181B" strokeWidth="3.2" />

        {/* Measure 2 Notes (D Major) */}
        <ellipse cx="204" cy="216" rx="6" ry="4.5" fill="#047857" transform="rotate(-15 204 216)" />
        <line x1="209.5" y1="216" x2="209.5" y2="182" stroke="#047857" strokeWidth="1.6" />
        {[
          { x: 206, y: 89 },
          { x: 234, y: 79 },
          { x: 262, y: 69 },
        ].map((n, idx) => (
          <g key={`m2n-${idx}`}>
            <ellipse
              cx={n.x}
              cy={n.y}
              rx="6"
              ry="4.5"
              fill="#18181B"
              transform={`rotate(-15 ${n.x} ${n.y})`}
            />
            <line x1={n.x + 5.2} y1={n.y} x2={n.x + 5.2} y2={n.y - 28} stroke="#18181B" strokeWidth="1.5" />
          </g>
        ))}
        <line x1="211.2" y1="61" x2="267.2" y2="41" stroke="#18181B" strokeWidth="3.2" />

        <text x="166" y="276" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#52525B">
          Bars 1–2 · Clean Hand Preparation
        </text>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PAGE: MEASURE 3 (Am) -> MEASURE 4 (C — LATE + MISSED E3)
           ══════════════════════════════════════════════════════════════════ */}
        {/* Measure 3 & 4 Timing Headers */}
        <text x="342" y="28" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#18181B">
          M3 · Am
        </text>
        <rect x="404" y="16" width="44" height="17" rx="4" fill="#059669" fillOpacity="0.14" />
        <text
          x="426"
          y="28"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          fill="#047857"
        >
          -6ms
        </text>

        {/* Crimson Measure 4 Highlight Backdrop */}
        <rect
          x="474"
          y="42"
          width="142"
          height="212"
          rx="6"
          fill="#DC2626"
          fillOpacity="0.09"
          stroke="#DC2626"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />

        <text x="482" y="28" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#991B1B">
          M4 · C
        </text>
        <rect x="536" y="16" width="54" height="17" rx="4" fill="#DC2626" fillOpacity="0.16" />
        <text
          x="563"
          y="28"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          fill="#B91C1C"
        >
          +142ms
        </text>

        {/* Right Page System Barlines */}
        <line x1="336" y1="54" x2="336" y2="236" stroke="#27272A" strokeWidth="1.8" />
        <line x1="474" y1="54" x2="474" y2="236" stroke="#52525B" strokeWidth="1.2" />
        <line x1="612" y1="54" x2="612" y2="236" stroke="#27272A" strokeWidth="2.5" />

        {/* Right Page Treble & Bass Staves */}
        {[54, 64, 74, 84, 94].map((y) => (
          <line key={`rt-${y}`} x1="336" y1={y} x2="612" y2={y} stroke="#52525B" strokeWidth="1" />
        ))}
        {[196, 206, 216, 226, 236].map((y) => (
          <line key={`rb-${y}`} x1="336" y1={y} x2="612" y2={y} stroke="#52525B" strokeWidth="1" />
        ))}

        {/* Measure 3 Notes (Am - Clean) */}
        <ellipse cx="368" cy="226" rx="6" ry="4.5" fill="#047857" transform="rotate(-15 368 226)" />
        <line x1="373.5" y1="226" x2="373.5" y2="192" stroke="#047857" strokeWidth="1.6" />
        {[
          { x: 370, y: 79 },
          { x: 400, y: 69 },
          { x: 430, y: 59 },
        ].map((n, idx) => (
          <g key={`m3n-${idx}`}>
            <ellipse
              cx={n.x}
              cy={n.y}
              rx="6"
              ry="4.5"
              fill="#18181B"
              transform={`rotate(-15 ${n.x} ${n.y})`}
            />
            <line x1={n.x + 5.2} y1={n.y} x2={n.x + 5.2} y2={n.y - 26} stroke="#18181B" strokeWidth="1.5" />
          </g>
        ))}

        {/* Vertical Amber Beat Playhead Entering Measure 4 */}
        <line
          x1="488"
          y1="38"
          x2="488"
          y2="250"
          stroke="#D97706"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="488" cy="38" r="4" fill="#D97706" />

        {/* Measure 4 Notes: C5 Treble Hit, Missed E3 Highlighted in Crimson */}
        <ellipse cx="518" cy="69" rx="6" ry="4.5" fill="#18181B" transform="rotate(-15 518 69)" />
        <line x1="523.5" y1="69" x2="523.5" y2="41" stroke="#18181B" strokeWidth="1.5" />
        <ellipse cx="566" cy="59" rx="6" ry="4.5" fill="#18181B" transform="rotate(-15 566 59)" />
        <line x1="571.5" y1="59" x2="571.5" y2="33" stroke="#18181B" strokeWidth="1.5" />

        {/* Bass Root C3 + Dashed Crimson Hollow Notehead on Missed E3 */}
        <ellipse cx="518" cy="221" rx="6" ry="4.5" fill="#18181B" transform="rotate(-15 518 221)" />
        <line x1="523.5" y1="221" x2="523.5" y2="188" stroke="#18181B" strokeWidth="1.5" />

        {/* Missed E3 Hollow Crimson Marker + Label */}
        <circle cx="566" cy="211" r="11" fill="#DC2626" fillOpacity="0.16" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3 2" />
        <ellipse
          cx="566"
          cy="211"
          rx="6"
          ry="4.5"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          transform="rotate(-15 566 211)"
        />
        <rect x="492" y="262" width="114" height="22" rx="4" fill="#DC2626" />
        <text
          x="549"
          y="276"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
          fill="#FFFFFF"
        >
          Missed E3 · Bar 4
        </text>

        <text x="404" y="276" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#52525B">
          Loop Focus: M3 → M4
        </text>
      </svg>
    </div>
  )
}
