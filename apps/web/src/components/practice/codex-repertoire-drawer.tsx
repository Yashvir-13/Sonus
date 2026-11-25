import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BUILTIN_FULL_SONGS } from '@/lib/music/song-catalog'
import { fetchExercises, type ExerciseDto } from '@/api/sessions'
import { X, Search, Play, Check, Loader2 } from 'lucide-react'

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
  const [fetchedExercises, setFetchedExercises] = useState<ExerciseDto[] | null>(null)
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const closingFromEffectRef = useRef(false)
  const pointerStartedOutsideRef = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        try {
          if (typeof dialog.showModal === 'function') {
            dialog.showModal()
          } else {
            dialog.setAttribute('open', '')
          }
        } catch {
          dialog.setAttribute('open', '')
        }
      }
    } else if (dialog.open) {
      closingFromEffectRef.current = true
      try {
        dialog.close?.()
      } finally {
        closingFromEffectRef.current = false
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    Promise.resolve().then(async () => {
      if (!isMounted) return
      setIsLoadingExercises(true)
      try {
        const data = await fetchExercises()
        if (isMounted && data && data.length > 0) {
          const enriched = data.map((ex) => {
            const builtinMatch = BUILTIN_FULL_SONGS.find(
              (b) => b.id === ex.id || b.title.toLowerCase() === ex.title.toLowerCase()
            )
            return builtinMatch ? { ...builtinMatch, id: ex.id } : ex
          })
          setFetchedExercises(enriched)
        }
      } catch {
        // Fallback to built-in full songs when backend is offline
      } finally {
        if (isMounted) {
          setIsLoadingExercises(false)
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [isOpen])

  const baseSongList =
    fetchedExercises && fetchedExercises.length > 0
      ? fetchedExercises
      : availableExercises && availableExercises.length > 0
      ? availableExercises
      : BUILTIN_FULL_SONGS

  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return baseSongList.filter((song) => {
      const titleMatches = song.title.toLowerCase().includes(q)
      const artistMatches = (song.artist || '').toLowerCase().includes(q)
      const composerMatches = (song.composer || '').toLowerCase().includes(q)
      const descMatches = (song.description || '').toLowerCase().includes(q)
      const keyMatches = song.progression?.key?.toLowerCase().includes(q) ?? false
      const matchesSearch =
        q === '' || titleMatches || artistMatches || composerMatches || descMatches || keyMatches

      const matchesInst =
        instrumentFilter === 'all' || song.instrument.toLowerCase() === instrumentFilter

      return matchesSearch && matchesInst
    })
  }, [baseSongList, searchQuery, instrumentFilter])

  return (
    <dialog
      ref={dialogRef}
      data-testid="codex-repertoire-drawer"
      aria-label="Repertoire Codex Library"
      aria-hidden={!isOpen}
      closedby="any"
      onClose={() => {
        if (!closingFromEffectRef.current && isOpen) {
          onClose()
        }
      }}
      onPointerDown={(e) => {
        const dialog = dialogRef.current
        if (!dialog || 'closedBy' in HTMLDialogElement.prototype) {
          pointerStartedOutsideRef.current = false
          return
        }
        const r = dialog.getBoundingClientRect()
        pointerStartedOutsideRef.current =
          e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
      }}
      onPointerUp={(e) => {
        const dialog = dialogRef.current
        if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return
        if (!pointerStartedOutsideRef.current) return
        pointerStartedOutsideRef.current = false
        const r = dialog.getBoundingClientRect()
        const outside =
          e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
        if (outside) {
          onClose()
        }
      }}
      className={`fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-dvh w-full max-w-md bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 border-0 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 flex-col font-sans backdrop:bg-black/65 transition-transform duration-200 ease-out ${
        isOpen ? 'open:flex translate-x-0' : '-translate-x-full pointer-events-none'
      } ${className}`}
    >
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-[#F8F8F6] dark:bg-[#09090B]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500 block">
                SONG LIBRARY
              </span>
              {isLoadingExercises && (
                <span
                  data-testid="repertoire-loading-indicator"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500"
                >
                  <Loader2 className="size-3 animate-spin text-amber-500" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>
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
                <button
                  key={song.id}
                  type="button"
                  data-testid={`codex-song-${song.id}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelectSong(song)
                    onClose()
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-[#F8F8F6] dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
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
                      <span className="block font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {song.title}
                      </span>
                      {(song.artist || song.composer) && (
                        <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                          {song.artist || song.composer}
                        </span>
                      )}
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
                    <span className="block text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {song.description}
                    </span>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70 text-[10px] font-mono text-zinc-500 w-full">
                    <span>{song.tempo_bpm} BPM</span>
                    <span>{chordsCount > 0 ? `${chordsCount} measures` : 'Continuous'}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
    </dialog>
  )
}
