import React, { useState, useEffect, useMemo } from 'react'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import { fetchExercises, type ExerciseDto } from '@/api/sessions'
import { X, Search, Play, Check } from 'lucide-react'

export type CodexRepertoireDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onSelectSong: (song: ExerciseDto) => void
  activeSongId?: string
  availableExercises?: ExerciseDto[]
  className?: string
}

export function CodexRepertoireDrawer({
  isOpen,
  onClose,
  onSelectSong,
  activeSongId,
  availableExercises,
  className = '',
}: CodexRepertoireDrawerProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'piano' | 'guitar'>('all')
  const [dbExercises, setDbExercises] = useState<ExerciseDto[]>(availableExercises || [])

  useEffect(() => {
    if (availableExercises && availableExercises.length > 0) {
      setDbExercises(availableExercises)
    }
  }, [availableExercises])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    fetchExercises()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const enriched = data.map((ex) => {
            const builtinMatch = BUILTIN_FULL_SONGS.find(
              (b) => b.id === ex.id || b.title.toLowerCase() === ex.title.toLowerCase()
            )
            return builtinMatch ? { ...builtinMatch, id: ex.id } : ex
          })
          setDbExercises(enriched)
        }
      })
      .catch(() => {
        // Fallback to built-in full songs when backend is offline
      })
    return () => {
      isMounted = false
    }
  }, [isOpen])

  const baseSongList = dbExercises.length > 0 ? dbExercises : BUILTIN_FULL_SONGS

  const filteredSongs = useMemo(() => {
    return baseSongList.filter((song) => {
      const titleMatches = song.title.toLowerCase().includes(searchQuery.toLowerCase())
      const descMatches = (song.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const keyMatches = song.progression?.key?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      const matchesSearch = searchQuery.trim() === '' || titleMatches || descMatches || keyMatches

      const matchesInst =
        instrumentFilter === 'all' || song.instrument.toLowerCase() === instrumentFilter

      return matchesSearch && matchesInst
    })
  }, [baseSongList, searchQuery, instrumentFilter])

  return (
    <>
      {isOpen && (
        <div
          data-testid="repertoire-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      <div
        data-testid="codex-repertoire-drawer"
        aria-label="Repertoire Codex Library"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 w-full max-w-md bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col font-sans ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        } ${className}`}
      >
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-[#F8F8F6] dark:bg-[#09090B]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500 block">
              SONG LIBRARY
            </span>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Choose a Piece to Practice
            </h2>
          </div>

          <button
            type="button"
            data-testid="repertoire-drawer-close"
            onClick={onClose}
            aria-label="Close repertoire drawer"
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 bg-white dark:bg-[#111114]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search piece, composer, or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500 transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
            {(['all', 'piano', 'guitar'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setInstrumentFilter(filter)}
                className={`flex-1 py-1 rounded uppercase tracking-wider text-[10px] font-bold transition-all cursor-pointer ${
                  instrumentFilter === filter
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              No pieces matching “{searchQuery}”
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isSelected = song.id === activeSongId
              const isPiano = song.instrument.toLowerCase() === 'piano'
              const chordsCount = song.progression?.chords?.length ?? 0

              return (
                <div
                  key={song.id}
                  data-testid={`codex-song-${song.id}`}
                  onClick={() => {
                    onSelectSong(song)
                    onClose()
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                            isPiano
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {song.instrument}
                        </span>
                        {song.progression?.key && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Key: {song.progression.key}
                          </span>
                        )}
                      </div>
                      <h3 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {song.title}
                      </h3>
                    </div>

                    {isSelected ? (
                      <span className="size-6 rounded bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <span className="size-6 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-zinc-950 group-hover:border-amber-500 transition-colors">
                        <Play className="size-3 ml-0.5" />
                      </span>
                    )}
                  </div>

                  {song.description && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {song.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70 text-[10px] font-mono text-zinc-500">
                    <span>{song.tempo_bpm} BPM</span>
                    <span>{chordsCount > 0 ? `${chordsCount} measures` : 'Continuous'}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
