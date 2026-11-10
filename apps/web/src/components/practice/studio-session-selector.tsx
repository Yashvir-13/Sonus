import React, { useState, useMemo } from 'react'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import { type ExerciseDto } from '@/api/sessions'
import { Search, Music, ArrowRight, X, Sparkles } from 'lucide-react'

export interface StudioSessionSelectorProps {
  isOpen: boolean
  onClose?: () => void
  onLaunchSession: (song: ExerciseDto, instrument: 'guitar' | 'piano') => void
  availableExercises?: ExerciseDto[]
  currentSongId?: string
}

export function StudioSessionSelector({
  isOpen,
  onClose,
  onLaunchSession,
  availableExercises,
  currentSongId,
}: StudioSessionSelectorProps): React.JSX.Element | null {
  const [selectedInstrument, setSelectedInstrument] = useState<'guitar' | 'piano'>('piano')
  const [searchQuery, setSearchQuery] = useState('')

  const baseSongs =
    availableExercises && availableExercises.length > 0 ? availableExercises : BUILTIN_FULL_SONGS

  const [selectedSong, setSelectedSong] = useState<ExerciseDto>(() => {
    if (currentSongId) {
      const match = baseSongs.find((s) => s.id === currentSongId)
      if (match) return match
    }
    return baseSongs.find((s) => s.instrument.toLowerCase() === 'piano') || baseSongs[0]!
  })

  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return baseSongs.filter((song) => {
      const matchInst = song.instrument.toLowerCase() === selectedInstrument
      const titleMatches = song.title.toLowerCase().includes(q)
      const artistMatches = (song.artist || '').toLowerCase().includes(q)
      const composerMatches = (song.composer || '').toLowerCase().includes(q)
      const descMatches = (song.description || '').toLowerCase().includes(q)
      const keyMatches = song.progression?.key?.toLowerCase().includes(q) ?? false
      const matchSearch = q === '' || titleMatches || artistMatches || composerMatches || descMatches || keyMatches
      return matchInst && matchSearch
    })
  }, [baseSongs, selectedInstrument, searchQuery])

  if (!isOpen) return null

  return (
    <div
      data-testid="studio-session-selector-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-selector-title"
        className="w-full max-w-3xl bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500 block">
              PRACTICE ROOM ENTRANCE
            </span>
            <h2 id="session-selector-title" className="text-xl sm:text-2xl font-bold tracking-tight">
              Choose Your Session
            </h2>
            <p className="text-xs text-zinc-500">
              Select your instrument and piece before entering the practice stage.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              data-testid="close-session-selector-btn"
              onClick={onClose}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Step 1: Tactile Instrument Choice */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
            STEP 1: SELECT YOUR INSTRUMENT
          </span>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              data-testid="select-instrument-piano"
              onClick={() => {
                setSelectedInstrument('piano')
                const pianoSong = baseSongs.find((s) => s.instrument.toLowerCase() === 'piano')
                if (pianoSong) setSelectedSong(pianoSong)
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                selectedInstrument === 'piano'
                  ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  PIANO
                </span>
                <span className="text-lg">🎹</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Acoustic Piano &amp; Grand Staff
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Dual-clef sight reading with Synthesia waterfall roll option.
                </p>
              </div>
            </button>

            <button
              type="button"
              data-testid="select-instrument-guitar"
              onClick={() => {
                setSelectedInstrument('guitar')
                const guitarSong = baseSongs.find((s) => s.instrument.toLowerCase() === 'guitar')
                if (guitarSong) setSelectedSong(guitarSong)
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                selectedInstrument === 'guitar'
                  ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  GUITAR
                </span>
                <span className="text-lg">🎸</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  6-String Acoustic Guitar
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Continuous rhythmic tab and Karplus-Strong string synthesis.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Song Selection Grid */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
              STEP 2: SELECT A PIECE TO PRACTICE
            </span>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search piece or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 font-mono focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSongs.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-xs font-mono text-zinc-500">
                No pieces found matching “{searchQuery}” for {selectedInstrument}.
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isSelected = selectedSong?.id === song.id
                const measures = song.progression?.chords?.length ?? 0
                return (
                  <div
                    key={song.id}
                    data-testid={`session-song-${song.id}`}
                    onClick={() => setSelectedSong(song)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                        : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">
                          Key of {song.progression?.key || 'C'}
                        </span>
                        <span className="text-zinc-500">{song.tempo_bpm} BPM</span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {song.title}
                      </h4>
                      {(song.artist || song.composer) && (
                        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                          {song.artist || song.composer}
                        </p>
                      )}
                      {song.description && (
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {song.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-500">
                      <span>{measures > 0 ? `${measures} Measures` : 'Continuous'}</span>
                      {isSelected && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Sparkles className="size-3" />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer: Launch Button */}
        <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] flex items-center justify-between gap-4">
          <div className="text-xs font-mono text-zinc-500 hidden sm:block">
            Ready: <strong className="text-zinc-900 dark:text-zinc-100">{selectedSong.title}</strong> on{' '}
            <strong className="text-amber-600 dark:text-amber-400 uppercase">{selectedInstrument}</strong>
          </div>

          <button
            type="button"
            data-testid="launch-session-btn"
            onClick={() => onLaunchSession(selectedSong, selectedInstrument)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ml-auto"
          >
            <Music className="size-4" />
            <span>Launch Studio Session</span>
            <ArrowRight className="size-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
