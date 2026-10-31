import React, { useState, useMemo } from 'react'
import { FlowingPracticeStand } from './flowing-practice-stand'
import { parseProgressionSequence, resolveChordVoicing, type VoicingDefinition } from '@/lib/music/chord-voicings'

const PRESET_PROGRESSIONS = [
  { name: "User Take: D - A - E - Em", chords: ['D', 'A', 'E', 'Em'] },
  { name: "Anthem: G - D - Em - C", chords: ['G', 'D', 'Em', 'C'] },
  { name: "Ballad: Bm - G - D - A", chords: ['Bm', 'G', 'D', 'A'] },
  { name: "Classic: C - Am - F - G", chords: ['C', 'Am', 'F', 'G'] },
]

export function PracticeStandPage(): React.JSX.Element {
  const [customInput, setCustomInput] = useState<string>('D - A - E - Em')

  // Parse current progression
  const progression = useMemo<VoicingDefinition[]>(() => {
    const rawItems = customInput
      .split(/[-–—→,>|\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== 'maj' && s.toLowerCase() !== 'min')

    const parsed = parseProgressionSequence(rawItems.length > 0 ? rawItems : ['D', 'A', 'E', 'Em'])
    return parsed.length > 0 ? parsed : [resolveChordVoicing('D')]
  }, [customInput])

  const pieceTitle = progression.map((p) => p.chordName).join(' · ')
  const keySignature = `${progression[0]?.root || 'D'} Key`

  return (
    <div className="w-full flex flex-col gap-4 font-serif select-none">
      <FlowingPracticeStand
        mode="studio"
        progression={progression}
        pieceTitle={pieceTitle}
        keySignature={keySignature}
        showSequenceStrip={true}
        showCustomInput={false}
      />

      {/* ─────────────────────────────────────────────────────────────
          PROGRESSION SELECTION & CUSTOM INPUT BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-[#EFECE6]/80 dark:bg-[#1A1816]/90 border border-[#E2DDD3] dark:border-[#38342E] rounded-xl px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        {/* Preset Progression Chips */}
        <div className="flex items-center gap-2">
          <span className="text-[#736E65] dark:text-[#A39C8F] uppercase tracking-wider text-[11px] font-semibold">
            PROGRESSION PRESETS:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PROGRESSIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setCustomInput(preset.chords.join(' - '))}
                className="px-2.5 py-1 rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] text-[#242321] dark:text-[#EDE8DF] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24] transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Progression Input */}
        <div className="flex items-center gap-2">
          <label htmlFor="custom-chord-input" className="text-[#736E65] dark:text-[#A39C8F] text-[11px] uppercase">
            CUSTOM SEQUENCE:
          </label>
          <input
            id="custom-chord-input"
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter chords (e.g. D - A - E - Em)"
            className="w-56 px-3 py-1 bg-[#FCFBF8] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] rounded text-[#242321] dark:text-[#EDE8DF] font-mono text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>
    </div>
  )
}
