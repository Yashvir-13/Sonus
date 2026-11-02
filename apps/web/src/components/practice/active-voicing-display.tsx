import React, { useState, useMemo } from 'react'
import type { GuitarTabVoicing, PianoVoicing } from '@/lib/music/chord-voicings'
import { GuitarFretboardDiagram } from './guitar-fretboard-diagram'
import { PianoKeyboardDiagram } from './piano-keyboard-diagram'
import { GrandStaffDiagram } from './grand-staff-diagram'

export type PianoViewMode = 'both' | 'keyboard' | 'staff'

export interface ActiveVoicingDisplayProps {
  /** Target instrument currently active on the practice stand */
  instrument: 'guitar' | 'piano'
  /** Human-readable chord name (e.g. 'C Major', 'Bm', 'G7') */
  chordName?: string
  /** Guitar tab voicing data model (frets, fingering, barre, baseFret) */
  guitarTab?: GuitarTabVoicing
  /** Piano voicing data model (LH/RH notes and MIDI pitches) */
  pianoVoicing?: PianoVoicing
  /** Array of active MIDI pitches (e.g. from live tracker or chord definition) */
  activePitches?: number[]
  /** Interactive callback triggered when a key is clicked on the piano keyboard */
  onKeyClick?: (midi: number) => void
  /** Initial sub-tab selection in piano mode. Defaults to 'both' */
  defaultViewMode?: PianoViewMode
  /** Optional container CSS class name */
  className?: string
}

export function ActiveVoicingDisplay({
  instrument,
  chordName = '',
  guitarTab,
  pianoVoicing,
  activePitches,
  onKeyClick,
  defaultViewMode = 'both',
  className = '',
}: ActiveVoicingDisplayProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<PianoViewMode>(defaultViewMode)

  // 1. Resolve piano pitches & hands unconditionally (Rules of Hooks)
  const resolvedLhPitches = useMemo(() => {
    if (pianoVoicing?.lhPitches && pianoVoicing.lhPitches.length > 0) {
      return pianoVoicing.lhPitches
    }
    if (!activePitches || activePitches.length === 0) return []
    const belowMiddleC = activePitches.filter((p) => p < 60)
    if (belowMiddleC.length > 0) return belowMiddleC
    return activePitches.length > 1 ? [Math.min(...activePitches)] : []
  }, [pianoVoicing, activePitches])

  const resolvedRhPitches = useMemo(() => {
    if (pianoVoicing?.rhPitches && pianoVoicing.rhPitches.length > 0) {
      return pianoVoicing.rhPitches
    }
    if (!activePitches || activePitches.length === 0) return []
    const treble = activePitches.filter((p) => p >= 60)
    if (treble.length > 0) return treble
    return activePitches.length > 1
      ? activePitches.filter((p) => p !== Math.min(...activePitches))
      : activePitches
  }, [pianoVoicing, activePitches])

  // 2. Guitar Mode: Strictly render guitar fretboard with ZERO piano leakage
  if (instrument === 'guitar') {
    if (!guitarTab) {
      return (
        <div
          data-testid="active-voicing-display"
          className={`w-full flex items-center justify-center p-4 ${className}`}
        >
          <span className="text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
            No guitar voicing data available
          </span>
        </div>
      )
    }

    return (
      <div
        data-testid="active-voicing-display"
        className={`w-full flex items-center justify-center ${className}`}
      >
        <GuitarFretboardDiagram
          chordName={chordName}
          guitarTab={guitarTab}
          className="w-full max-w-[200px]"
        />
      </div>
    )
  }

  return (
    <div
      data-testid="active-voicing-display"
      className={`w-full flex flex-col items-center select-none ${className}`}
    >
      {/* Piano Dual Display Sub-Tabs */}
      <div className="flex items-center justify-center mb-3 w-full">
        <div
          role="tablist"
          aria-label="Piano visualization sub-tabs"
          className="inline-flex rounded border border-[#D9D3C7] dark:border-[#38342E] bg-[#EFECE6] dark:bg-[#141312] p-0.5 text-[10px] font-mono shadow-inner"
        >
          <button
            role="tab"
            aria-selected={viewMode === 'keyboard'}
            type="button"
            onClick={() => setViewMode('keyboard')}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              viewMode === 'keyboard'
                ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] font-bold shadow-sm'
                : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
            }`}
          >
            KEYBOARD
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'staff'}
            type="button"
            onClick={() => setViewMode('staff')}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              viewMode === 'staff'
                ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] font-bold shadow-sm'
                : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
            }`}
          >
            STAFF
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'both'}
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              viewMode === 'both'
                ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] font-bold shadow-sm'
                : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
            }`}
          >
            BOTH
          </button>
        </div>
      </div>

      {/* Visual Modalities */}
      <div className="w-full flex flex-col items-center gap-3">
        {/* Grand Staff Diagram (in 'both' or 'staff' mode) */}
        {(viewMode === 'both' || viewMode === 'staff') && (
          <div className="w-full flex justify-center py-1">
            <GrandStaffDiagram
              chordName={chordName}
              lhPitches={resolvedLhPitches}
              rhPitches={resolvedRhPitches}
              activePitches={activePitches}
              className="w-full max-w-[340px]"
            />
          </div>
        )}

        {/* Piano Keyboard Diagram (in 'both' or 'keyboard' mode) */}
        {(viewMode === 'both' || viewMode === 'keyboard') && (
          <div className="w-full flex justify-center py-1">
            <PianoKeyboardDiagram
              lhPitches={resolvedLhPitches}
              rhPitches={resolvedRhPitches}
              activePitches={activePitches}
              onKeyClick={onKeyClick}
              className="w-full max-w-[340px]"
            />
          </div>
        )}
      </div>

      {/* Hand & Pitch Legend Summary */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F]">
        {pianoVoicing?.lhNotes && pianoVoicing.lhNotes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9A2A2A] dark:bg-[#B83232]" />
            <span className="font-semibold text-[#9A2A2A] dark:text-[#B83232]">LH:</span>
            <span>{pianoVoicing.lhNotes.join(' · ')}</span>
          </div>
        )}
        {pianoVoicing?.rhNotes && pianoVoicing.rhNotes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3B6E57] dark:bg-[#689F84]" />
            <span className="font-semibold text-[#3B6E57] dark:text-[#689F84]">RH:</span>
            <span>{pianoVoicing.rhNotes.join(' · ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
