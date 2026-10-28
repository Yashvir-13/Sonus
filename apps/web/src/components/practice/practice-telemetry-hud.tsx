import React from 'react'
import type { VoicingDefinition } from '@/lib/music/chord-voicings'

export type PracticeTelemetryHUDProps = {
  instrument: 'guitar' | 'piano'
  onInstrumentChange: (inst: 'guitar' | 'piano') => void
  pieceTitle: string
  keySignature: string
  currentMeasure: number
  totalMeasures: number
  tempoBpm: number
  onTempoChange: (bpm: number) => void
  activeChord: VoicingDefinition
  intonationAccuracy: number | null
  timingSyncMs: number | null
  voicingStringsCount: number
  isPlaying: boolean
  onTogglePlay: () => void
  onRestart: () => void
  livePitchText?: string
  liveRmsDb?: number
  isBackingAudioEnabled?: boolean
  onToggleBackingAudio?: () => void
  isMetronomeEnabled?: boolean
  onToggleMetronome?: () => void
  className?: string
}

export function PracticeTelemetryHUD({
  instrument,
  onInstrumentChange,
  pieceTitle,
  keySignature,
  currentMeasure,
  totalMeasures,
  tempoBpm,
  onTempoChange,
  activeChord,
  intonationAccuracy,
  timingSyncMs,
  voicingStringsCount,
  isPlaying,
  onTogglePlay,
  onRestart,
  livePitchText,
  liveRmsDb = -45,
  isBackingAudioEnabled = true,
  onToggleBackingAudio,
  isMetronomeEnabled = true,
  onToggleMetronome,
  className = '',
}: PracticeTelemetryHUDProps): React.JSX.Element {
  // Normalize VU meter level to percentage [0, 100] from dB [-60, 0]
  const vuPercent = Math.max(0, Math.min(100, Math.round(((liveRmsDb + 60) / 60) * 100)))

  return (
    <div className={`w-full flex flex-col font-serif text-[#242321] dark:text-[#EDE8DF] ${className}`}>
      {/* ─────────────────────────────────────────────────────────────
          TOP ARCHIVAL HUD
         ───────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#FCFBF8] dark:bg-[#1E1C1A] border-b border-[#E2DDD3] dark:border-[#38342E] px-6 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Left: Brand & Instrument Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-serif font-black tracking-widest text-[#242321] dark:text-[#EDE8DF]">
              § SONUS
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[#EFECE6] dark:bg-[#2A2723] text-[#736E65] dark:text-[#A39C8F] rounded">
              STAND
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#E2DDD3] dark:bg-[#38342E]" />

          {/* Instrument Toggle */}
          <div className="flex items-center rounded border border-[#D9D3C7] dark:border-[#38342E] bg-[#EFECE6] dark:bg-[#141312] p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => onInstrumentChange('guitar')}
              className={`px-3 py-1 rounded transition-colors ${
                instrument === 'guitar'
                  ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] font-bold shadow-sm'
                  : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
              }`}
            >
              GUITAR
            </button>
            <button
              type="button"
              onClick={() => onInstrumentChange('piano')}
              className={`px-3 py-1 rounded transition-colors ${
                instrument === 'piano'
                  ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] font-bold shadow-sm'
                  : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
              }`}
            >
              PIANO
            </button>
          </div>
        </div>

        {/* Center: Score Title & Key */}
        <div className="flex items-center gap-4 text-center">
          <div>
            <h1
              className="text-sm md:text-base font-serif font-bold text-[#242321] dark:text-[#EDE8DF] tracking-wide max-w-md truncate"
              title={pieceTitle}
            >
              {pieceTitle}
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
              <span>KEY: {keySignature}</span>
              <span>•</span>
              <span>
                MEASURE {currentMeasure} OF {totalMeasures}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Metronome, Backing Audio Toggle & VU Bar */}
        <div className="flex items-center gap-4">
          {/* Backing Track Audio Toggle */}
          {onToggleBackingAudio && (
            <button
              type="button"
              onClick={onToggleBackingAudio}
              title={isBackingAudioEnabled ? 'Backing Audio Guide is ON' : 'Backing Audio Guide is MUTED'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                isBackingAudioEnabled
                  ? 'bg-[#242321] text-[#FCFBF8] border-[#242321] dark:bg-[#EDE8DF] dark:text-[#141312] dark:border-[#EDE8DF] font-bold'
                  : 'bg-[#FCFBF8] text-[#736E65] border-[#D9D3C7] dark:bg-[#141312] dark:text-[#A39C8F] dark:border-[#38342E] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
              }`}
            >
              <span>{isBackingAudioEnabled ? '🎵' : '🔇'}</span>
              <span>AUDIO {isBackingAudioEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Metronome Beat Ticks Toggle */}
          {onToggleMetronome && (
            <button
              type="button"
              onClick={onToggleMetronome}
              title={isMetronomeEnabled ? 'Metronome Beat Ticks are ON' : 'Metronome Beat Ticks are MUTED'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                isMetronomeEnabled
                  ? 'bg-[#242321] text-[#FCFBF8] border-[#242321] dark:bg-[#EDE8DF] dark:text-[#141312] dark:border-[#EDE8DF] font-bold'
                  : 'bg-[#FCFBF8] text-[#736E65] border-[#D9D3C7] dark:bg-[#141312] dark:text-[#A39C8F] dark:border-[#38342E] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
              }`}
            >
              <span>{isMetronomeEnabled ? '⏱️' : '🔇'}</span>
              <span>TICKS {isMetronomeEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Metronome Controller */}
          <div className="flex items-center gap-1.5 bg-[#EFECE6] dark:bg-[#141312] border border-[#D9D3C7] dark:border-[#38342E] px-2 py-1 rounded">
            <span className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] tracking-wider">TEMPO</span>
            <button
              type="button"
              onClick={() => onTempoChange(Math.max(40, tempoBpm - 1))}
              aria-label="Decrease tempo (-)"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] text-sm font-mono font-bold text-[#242321] dark:text-[#EDE8DF] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24] active:scale-95"
            >
              -
            </button>
            <div className="w-10 text-center">
              <span className="text-xs font-mono font-bold text-[#242321] dark:text-[#EDE8DF]">{tempoBpm}</span>
              <span className="text-[8px] font-mono text-[#736E65] dark:text-[#A39C8F] block leading-none">BPM</span>
            </div>
            <button
              type="button"
              onClick={() => onTempoChange(Math.min(240, tempoBpm + 1))}
              aria-label="Increase tempo (+)"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#FCFBF8] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] text-sm font-mono font-bold text-[#242321] dark:text-[#EDE8DF] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24] active:scale-95"
            >
              +
            </button>
          </div>

          {/* Analog VU Bar */}
          <div className="flex flex-col gap-0.5 w-20">
            <div className="flex justify-between text-[8px] font-mono text-[#736E65] dark:text-[#A39C8F]">
              <span>MIC VU</span>
              <span>{Math.round(liveRmsDb)} dB</span>
            </div>
            <div className="w-full h-1.5 bg-[#EFECE6] dark:bg-[#141312] border border-[#D9D3C7] dark:border-[#38342E] rounded overflow-hidden p-0.5">
              <div
                className="h-full bg-[#4A6B5B] rounded-sm transition-all duration-75"
                style={{ width: `${vuPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM CHORD & TELEMETRY DECK
         ───────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#FCFBF8] dark:bg-[#1E1C1A] border-t border-[#E2DDD3] dark:border-[#38342E] px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-[0_-2px_6px_rgba(0,0,0,0.02)]">
        {/* Left Deck: Active Chord Card with Woodcut Fretboard Vector */}
        <div className="bg-[#FAF8F3] dark:bg-[#141312] border border-[#E2DDD3] dark:border-[#38342E] rounded p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between border-b border-[#E2DDD3] dark:border-[#38342E] pb-2">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F]">
                ACTIVE VOICING
              </div>
              <div className="text-2xl font-serif font-black text-[#242321] dark:text-[#EDE8DF]">
                {activeChord.chordName}
              </div>
            </div>
            {activeChord.guitarTab.barreFret ? (
              <span className="text-[11px] font-mono bg-[#E2DDD3] text-[#524D44] dark:bg-[#2A2723] dark:text-[#A39C8F] px-2 py-0.5 rounded font-semibold">
                Barre {activeChord.guitarTab.barreFret}nd Fret
              </span>
            ) : (
              <span className="text-[11px] font-mono bg-[#EFECE6] text-[#736E65] dark:bg-[#24221F] dark:text-[#A39C8F] px-2 py-0.5 rounded">
                Open Position
              </span>
            )}
          </div>

          {/* Instrument Diagram: Guitar Fretboard or Piano Keyboard */}
          <div className="my-3 flex items-center justify-center">
            {instrument === 'guitar' ? (
              <div data-testid="fretboard-diagram" className="flex flex-col items-center">
                {/* String Mute / Open indicators */}
                <div className="flex gap-4 font-mono text-[10px] text-[#736E65] dark:text-[#A39C8F] pb-1">
                  {activeChord.guitarTab.frets.map((fret, i) => (
                    <span key={i} className="w-3 text-center">
                      {fret === null ? 'x' : fret === 0 ? '○' : '•'}
                    </span>
                  ))}
                </div>

                {/* SVG 5-fret diagram */}
                <svg
                  width="180"
                  height="100"
                  viewBox="0 0 180 100"
                  className="bg-[#FCFBF8] dark:bg-[#1A1816] border border-[#D9D3C7] dark:border-[#38342E] rounded"
                >
                  {/* Nut line */}
                  <line x1="20" y1="12" x2="160" y2="12" stroke="currentColor" className="text-[#242321] dark:text-[#EDE8DF]" strokeWidth="4" />
                  {/* Fret lines (1 to 4) */}
                  {[32, 52, 72, 92].map((y, idx) => (
                    <line
                      key={idx}
                      x1="20"
                      y1={y}
                      x2="160"
                      y2={y}
                      stroke="currentColor"
                      className="text-[#C9C3B5] dark:text-[#3E3A32]"
                      strokeWidth="1.5"
                    />
                  ))}
                  {/* 6 String Lines */}
                  {[20, 48, 76, 104, 132, 160].map((x, sIdx) => {
                    const fret = activeChord.guitarTab.frets[sIdx]
                    const fretY = fret && fret > 0 ? 12 + (fret - 0.5) * 20 : null

                    return (
                      <g key={sIdx}>
                        <line x1={x} y1="12" x2={x} y2="92" stroke="currentColor" className="text-[#8A857A] dark:text-[#5C564C]" strokeWidth="1" />
                        {fretY && (
                          <circle cx={x} cy={fretY} r="5" fill="currentColor" className="text-[#242321] dark:text-[#EDE8DF]" />
                        )}
                      </g>
                    )
                  })}
                </svg>
                <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] mt-1">
                  Fingering: {activeChord.guitarTab.fingering}
                </div>
              </div>
            ) : (
              <div data-testid="piano-keyboard-diagram" className="flex flex-col items-center py-2">
                <div className="flex border border-[#242321] dark:border-[#38342E] rounded overflow-hidden">
                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((k) => (
                    <div
                      key={k}
                      className="w-6 h-20 border-r border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#1A1816] last:border-r-0 flex items-end justify-center pb-1 text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F]"
                    >
                      {k}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] mt-1">
                  RH Notes: {activeChord.pianoVoicing.rhNotes.join(' · ')}
                </div>
              </div>
            )}
          </div>

          {/* Pitch Spelling Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E2DDD3] dark:border-[#38342E]">
            {activeChord.pitchSpelling.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-2 py-0.5 rounded text-[10px] font-mono"
              >
                <span className="text-[#736E65] dark:text-[#A39C8F]">{item.role}:</span>
                <span className="font-bold text-[#242321] dark:text-[#EDE8DF]">{item.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Deck: Honest Precision Telemetry Dials */}
        <div className="bg-[#FAF8F3] dark:bg-[#141312] border border-[#E2DDD3] dark:border-[#38342E] rounded p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-2 flex justify-between">
            <span>PERFORMANCE TELEMETRY</span>
            {livePitchText ? (
              <span className="font-bold text-[#4A6B5B] dark:text-[#689F84]">{livePitchText}</span>
            ) : (
              <span className="text-[#8A857A] dark:text-[#6E675C]">AWAITING SOUND</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 my-auto py-2">
            {/* Intonation Accuracy */}
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#FCFBF8] dark:bg-[#1E1C1A] border border-[#E2DDD3] dark:border-[#38342E]">
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">INTONATION</span>
              {intonationAccuracy !== null ? (
                <>
                  <span className="text-xl font-serif font-black text-[#242321] dark:text-[#EDE8DF] my-1">
                    {intonationAccuracy.toFixed(1)}%
                  </span>
                  <span className={`text-[8px] font-mono uppercase font-bold ${
                    intonationAccuracy >= 90 ? 'text-[#4A6B5B] dark:text-[#689F84]' : 'text-[#9A2A2A] dark:text-[#E57373]'
                  }`}>
                    {intonationAccuracy >= 90 ? 'HIGH FIDELITY' : 'INTONATION DRIFT'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-serif font-black text-[#A39E93] dark:text-[#5C564C] my-1">
                    --%
                  </span>
                  <span className="text-[8px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">
                    AWAITING NOTE
                  </span>
                </>
              )}
            </div>

            {/* Timing Synchrony */}
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#FCFBF8] dark:bg-[#1E1C1A] border border-[#E2DDD3] dark:border-[#38342E]">
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">TIMING SYNC</span>
              {timingSyncMs !== null ? (
                <>
                  <span className="text-xl font-serif font-black text-[#242321] dark:text-[#EDE8DF] my-1">
                    ±{Math.abs(timingSyncMs)} ms
                  </span>
                  <span className="text-[8px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">
                    LATENCY DELTA
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-serif font-black text-[#A39E93] dark:text-[#5C564C] my-1">
                    -- ms
                  </span>
                  <span className="text-[8px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">
                    ON-BEAT CALIPER
                  </span>
                </>
              )}
            </div>

            {/* Voicing Completeness */}
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#FCFBF8] dark:bg-[#1E1C1A] border border-[#E2DDD3] dark:border-[#38342E]">
              <span className="text-[9px] font-mono text-[#736E65] dark:text-[#A39C8F] uppercase">VOICING</span>
              <span className="text-xl font-serif font-black text-[#242321] dark:text-[#EDE8DF] my-1">
                {voicingStringsCount > 0 ? `${voicingStringsCount}/6 str` : '0/6 str'}
              </span>
              <span className={`text-[8px] font-mono uppercase font-bold ${
                voicingStringsCount >= 4 ? 'text-[#4A6B5B] dark:text-[#689F84]' : 'text-[#736E65] dark:text-[#A39C8F]'
              }`}>
                {voicingStringsCount >= 4 ? 'FULL HARMONY' : voicingStringsCount > 0 ? 'PARTIAL' : 'SILENT'}
              </span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#736E65] dark:text-[#A39C8F] border-t border-[#E2DDD3] dark:border-[#38342E] pt-2 flex items-center justify-between">
            <span>GATE: -34dB • HARMONIC CLARITY: ≥0.35</span>
            <span className={voicingStringsCount > 0 ? 'text-[#4A6B5B] dark:text-[#689F84] font-bold' : 'text-[#8A857A] dark:text-[#6E675C]'}>
              {voicingStringsCount > 0 ? 'LIVE NOTE MATCHED' : 'LISTENING'}
            </span>
          </div>
        </div>

        {/* Right Deck: Mechanical Transport Controls */}
        <div className="bg-[#FAF8F3] dark:bg-[#141312] border border-[#E2DDD3] dark:border-[#38342E] rounded p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#736E65] dark:text-[#A39C8F] border-b border-[#E2DDD3] dark:border-[#38342E] pb-2 flex justify-between">
            <span>TRANSPORT & REPEAT</span>
            <span className="font-bold text-[#242321] dark:text-[#EDE8DF]">4B COUNT-IN</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 my-auto py-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`w-full py-2.5 rounded font-mono font-bold tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${
                isPlaying
                  ? 'bg-[#9A2A2A] dark:bg-[#B83232] text-[#FCFBF8] hover:bg-[#852222]'
                  : 'bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] hover:bg-[#3D3A36] dark:hover:bg-[#FFFFFF]'
              }`}
            >
              <span>{isPlaying ? '■ PAUSE' : '▶ START PRACTICE'}</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2 rounded font-mono font-semibold text-xs bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] text-[#242321] dark:text-[#EDE8DF] hover:bg-[#E2DDD3] dark:hover:bg-[#2E2A24] transition-colors"
            >
              ↺ RESTART STAND
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2DDD3] dark:border-[#38342E] text-[10px] font-mono">
            <span className="text-[#736E65] dark:text-[#A39C8F]">LOOP: A-B ACTIVE</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-[#EFECE6] dark:bg-[#24221F] rounded text-[#736E65] dark:text-[#A39C8F]">0.75x</span>
              <span className="px-1.5 py-0.5 bg-[#242321] text-[#FCFBF8] dark:bg-[#EDE8DF] dark:text-[#141312] rounded font-bold">
                1.0x
              </span>
              <span className="px-1.5 py-0.5 bg-[#EFECE6] dark:bg-[#24221F] rounded text-[#736E65] dark:text-[#A39C8F]">1.25x</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
