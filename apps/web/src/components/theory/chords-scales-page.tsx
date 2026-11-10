import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  THEORY_ROOTS,
  type TheoryRoot,
  type TheoryCategory,
  type TheoryEntry,
  getTheoryEntriesByRoot,
  buildTheoryEntry,
  PATTERN_TEMPLATES,
} from '@/lib/music/theory-lexicon'
import { GuitarFretboardDiagram } from '@/components/practice/guitar-fretboard-diagram'
import { PianoKeyboardDiagram } from '@/components/practice/piano-keyboard-diagram'
import { PracticeAudioEngine } from '@/lib/audio/practice-audio-engine'
import { Search, Volume2, Sparkles, BookOpen, Music, Play } from 'lucide-react'

export interface ChordsScalesPageProps {
  onBackToLanding?: () => void
  onOpenPracticeWithChord?: (chordName: string) => void
  className?: string
}

export function ChordsScalesPage({
  onBackToLanding,
  onOpenPracticeWithChord,
  className = '',
}: ChordsScalesPageProps): React.JSX.Element {
  const [selectedRoot, setSelectedRoot] = useState<TheoryRoot>('C')
  const [selectedCategory, setSelectedCategory] = useState<TheoryCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntryId, setSelectedEntryId] = useState<string>('c_major')
  const [activeTab, setActiveTab] = useState<'both' | 'guitar' | 'piano'>('both')

  const audioEngineRef = useRef<PracticeAudioEngine | null>(null)

  useEffect(() => {
    audioEngineRef.current = new PracticeAudioEngine()
    return () => {
      audioEngineRef.current?.dispose()
      audioEngineRef.current = null
    }
  }, [])

  // All entries for current root
  const rootEntries = useMemo(() => {
    return getTheoryEntriesByRoot(selectedRoot)
  }, [selectedRoot])

  // Filtered by category and search
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return rootEntries.filter((entry) => {
      const matchCat = selectedCategory === 'all' || entry.category === selectedCategory
      const matchSearch =
        q === '' ||
        entry.name.toLowerCase().includes(q) ||
        entry.symbol.toLowerCase().includes(q) ||
        entry.formula.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.mood.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [rootEntries, selectedCategory, searchQuery])

  // Selected entry or fallback
  const activeEntry: TheoryEntry = useMemo(() => {
    const match = rootEntries.find((e) => e.id === selectedEntryId)
    if (match) return match
    if (filteredEntries.length > 0) return filteredEntries[0]!
    return buildTheoryEntry(selectedRoot, PATTERN_TEMPLATES[0]!)
  }, [rootEntries, selectedEntryId, filteredEntries, selectedRoot])

  const playGuitarVoicing = (entry: TheoryEntry) => {
    if (!audioEngineRef.current) return
    audioEngineRef.current.unlock()
    audioEngineRef.current.stopAllSounds()
    // Pluck fretted strings from low to high
    const midiNotes = entry.pianoMidi
    audioEngineRef.current.playGuitarStrum(midiNotes, 'down', true, 2.5)
  }

  const playPianoVoicing = (entry: TheoryEntry) => {
    if (!audioEngineRef.current) return
    audioEngineRef.current.unlock()
    audioEngineRef.current.stopAllSounds()
    audioEngineRef.current.playPianoVoicing(
      entry.pianoVoicing.lhPitches,
      entry.pianoVoicing.rhPitches,
      2.5
    )
  }

  return (
    <div
      data-testid="chords-scales-page"
      className={`min-h-screen w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Masthead */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-amber-600 dark:text-amber-500">
                HARMONY &amp; THEORY COMPENDIUM
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-[11px] font-mono text-zinc-500">Diatonic, Modal &amp; Extended</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <BookOpen className="size-6 text-amber-500" />
              <span>Chords &amp; Scales</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              Authentic music theory dictionary with exact formulas, intervals, notes, guitar fretboards,
              and 25-key piano voicings with live Karplus-Strong &amp; acoustic piano audio preview.
            </p>
          </div>

          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="self-start md:self-auto px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-amber-500 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              ← Back to Stage
            </button>
          )}
        </div>

        {/* 12 Chromatic Roots Picker */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
            CHOOSE ROOT NOTE (TONIC):
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {THEORY_ROOTS.map((root) => {
              const isSelected = selectedRoot === root
              return (
                <button
                  key={root}
                  type="button"
                  data-testid={`theory-root-${root}`}
                  onClick={() => setSelectedRoot(root)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-xs ring-2 ring-amber-500/30'
                      : 'bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/60'
                  }`}
                >
                  {root}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111114] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
            {[
              { id: 'all', label: 'All Harmonies' },
              { id: 'triads', label: 'Triads' },
              { id: 'sevenths', label: '7th Chords' },
              { id: 'extended', label: 'Extended & Altered' },
              { id: 'scales', label: 'Scales & Modes' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                data-testid={`theory-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id as TheoryCategory | 'all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search formula, mood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 font-mono focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Main Content: Split View with Active Inspector and Full Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Chord / Scale Inspector */}
          <div className="lg:col-span-5 bg-white dark:bg-[#111114] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-5 shadow-xs sticky top-6">
            <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {activeEntry.category.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Formula: <strong className="text-zinc-900 dark:text-zinc-100">{activeEntry.formula}</strong>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeEntry.name}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {activeEntry.description}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-500">
                <Sparkles className="size-3.5" />
                <span>{activeEntry.mood}</span>
              </div>
            </div>

            {/* Notes & Interval breakdown chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                CONSTITUENT NOTES:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeEntry.notes.map((n, idx) => (
                  <span
                    key={`${n}-${idx}`}
                    className="px-2.5 py-1 rounded-md bg-[#F8F8F6] dark:bg-[#18181C] border border-zinc-200 dark:border-zinc-800 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Instrument Diagram Selector */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                VISUAL DIAGRAMS:
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {(['both', 'guitar', 'piano'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-0.5 rounded uppercase font-bold transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagrams */}
            <div className="space-y-4">
              {(activeTab === 'both' || activeTab === 'guitar') && (
                <div className="p-3 rounded-xl bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-2">
                  <div className="w-full flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">GUITAR FRETBOARD</span>
                    <button
                      type="button"
                      onClick={() => playGuitarVoicing(activeEntry)}
                      className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                    >
                      <Volume2 className="size-3" />
                      <span>Pluck Acoustic</span>
                    </button>
                  </div>
                  <div className="py-2">
                    <GuitarFretboardDiagram
                      chordName={activeEntry.name}
                      guitarTab={activeEntry.guitarVoicing}
                      showFingerLabels={true}
                    />
                  </div>
                </div>
              )}

              {(activeTab === 'both' || activeTab === 'piano') && (
                <div className="p-3 rounded-xl bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-2">
                  <div className="w-full flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">PIANO KEYBOARD</span>
                    <button
                      type="button"
                      onClick={() => playPianoVoicing(activeEntry)}
                      className="px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                    >
                      <Volume2 className="size-3" />
                      <span>Play Piano Voicing</span>
                    </button>
                  </div>
                  <div className="w-full py-2 flex justify-center">
                    <PianoKeyboardDiagram
                      chordName={activeEntry.name}
                      lhPitches={activeEntry.pianoVoicing.lhPitches}
                      rhPitches={activeEntry.pianoVoicing.rhPitches}
                      startMidi={48}
                      endMidi={72}
                      showLabels={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Practice CTA */}
            {onOpenPracticeWithChord && (
              <button
                type="button"
                onClick={() => onOpenPracticeWithChord(activeEntry.symbol)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Music className="size-4" />
                <span>Practice {activeEntry.name} in Studio →</span>
              </button>
            )}
          </div>

          {/* Right Column (7 cols): Full Repertoire Cards Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>{filteredEntries.length} VOCABULARY ITEMS</span>
              <span>CLICK TO INSPECT &amp; PLAY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEntries.map((entry) => {
                const isSelected = entry.id === activeEntry.id
                return (
                  <div
                    key={entry.id}
                    data-testid={`theory-card-${entry.id}`}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {entry.category}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          {entry.formula}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {entry.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] font-mono">
                      <span className="text-zinc-400">{entry.notes.join(' · ')}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEntryId(entry.id)
                          playPianoVoicing(entry)
                        }}
                        className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-600 dark:text-zinc-300 transition-colors"
                        title="Preview Audio"
                      >
                        <Play className="size-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
