import React, { useState, useEffect, useMemo } from 'react'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import { fetchExercises, type ExerciseDto } from '@/api/sessions'
import { X, Search, Play, Check } from 'lucide-react'

export interface CodexRepertoireDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectSong: (song: ExerciseDto) => void
  activeSongId?: string
  className?: string
}

export function CodexRepertoireDrawer({
  isOpen,
  onClose,
  onSelectSong,
  activeSongId,
  className = '',
}: CodexRepertoireDrawerProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'piano' | 'guitar'>('all')
  const [dbExercises, setDbExercises] = useState<ExerciseDto[]>([])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    fetchExercises()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          // Merge backend database records with rich client score progression data
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
        // Fallback to built-in full songs when backend is offline or starting
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
      {/* Backdrop */}
      {isOpen && (
        <div
          data-testid="repertoire-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Slide-over Drawer (Left) */}
      <div
        data-testid="codex-repertoire-drawer"
        aria-label="Repertoire Codex Library"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 w-full max-w-md bg-[#FAF8F3] dark:bg-[#1A1816] text-[#242321] dark:text-[#EDE8DF] border-r border-[#E2DDD3] dark:border-[#38342E] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col font-serif ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        } ${className}`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2DDD3] dark:border-[#38342E] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C5A059] block">
              § ARCHIVAL CODEX
            </span>
            <h2 className="text-xl font-bold tracking-tight">Repertoire Library</h2>
          </div>

          <button
            type="button"
            data-testid="repertoire-drawer-close"
            onClick={onClose}
            aria-label="Close repertoire drawer"
            className="p-2 rounded-xl text-[#736E65] hover:text-[#242321] hover:bg-[#EFECE6] dark:text-[#A39C8F] dark:hover:text-[#EDE8DF] dark:hover:bg-[#2A2723] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search & Instrument Filter */}
        <div className="p-4 border-b border-[#E2DDD3] dark:border-[#38342E] flex flex-col gap-3 font-sans">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8A857A]" />
            <input
              type="text"
              placeholder="Search piece, composer, or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FCFBF8] dark:bg-[#141312] border border-[#E2DDD3] dark:border-[#38342E] text-[#242321] dark:text-[#EDE8DF] placeholder-[#8A857A] focus:outline-hidden focus:border-[#C5A059] transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFECE6] dark:bg-[#141312] border border-[#E2DDD3] dark:border-[#38342E] text-xs font-mono">
            {(['all', 'piano', 'guitar'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setInstrumentFilter(filter)}
                className={`flex-1 py-1 rounded-lg uppercase tracking-wider text-[10px] font-bold transition-all ${
                  instrumentFilter === filter
                    ? 'bg-[#FCFBF8] dark:bg-[#2A2723] text-[#242321] dark:text-[#EDE8DF] shadow-xs'
                    : 'text-[#736E65] dark:text-[#8A857A] hover:text-[#242321]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Piece Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#8A857A]">
              No exercises matching “{searchQuery}”
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
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-xs'
                      : 'bg-[#FCFBF8] dark:bg-[#141312] border-[#E2DDD3] dark:border-[#38342E] hover:border-[#C5A059]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            isPiano
                              ? 'bg-[#3B6E57]/15 text-[#3B6E57] dark:text-[#689F84]'
                              : 'bg-[#9A2A2A]/15 text-[#9A2A2A] dark:text-[#C25454]'
                          }`}
                        >
                          {song.instrument}
                        </span>
                        {song.progression?.key && (
                          <span className="text-[10px] font-mono text-[#8A857A]">
                            Key of {song.progression.key}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-[#242321] dark:text-[#EDE8DF] truncate group-hover:text-[#C5A059] transition-colors">
                        {song.title}
                      </h3>
                    </div>

                    {isSelected ? (
                      <span className="size-6 rounded-full bg-[#C5A059] text-[#141312] flex items-center justify-center shrink-0">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <span className="size-6 rounded-full bg-[#EFECE6] dark:bg-[#2A2723] text-[#8A857A] flex items-center justify-center shrink-0 group-hover:bg-[#C5A059] group-hover:text-[#141312] transition-colors">
                        <Play className="size-3 ml-0.5" />
                      </span>
                    )}
                  </div>

                  {song.description && (
                    <p className="text-[11px] text-[#736E65] dark:text-[#A39C8F] line-clamp-2 leading-relaxed">
                      {song.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#E2DDD3]/50 dark:border-[#38342E]/50 text-[10px] font-mono text-[#8A857A]">
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
