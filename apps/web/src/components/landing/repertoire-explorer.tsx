import React, { useState } from 'react'
import { ArrowRight, Star } from 'lucide-react'

export type RepertoireItem = {
  id: string
  title: string
  composer: string
  instrument: 'piano' | 'guitar'
  difficulty: number
  key: string
  tempo: number
  meter: string
  measures: number
  chords: string[]
  description: string
  focus: string
}

const REPERTOIRE_CATALOG: RepertoireItem[] = [
  // Piano Masterworks
  {
    id: 'chopin-nocturne',
    title: 'Nocturne in E-flat Major, Op. 9 No. 2',
    composer: 'Frédéric Chopin (1832)',
    instrument: 'piano',
    difficulty: 4,
    key: 'Eb Major',
    tempo: 132,
    meter: '12/8',
    measures: 32,
    chords: ['Eb', 'G7', 'Cm', 'Ab', 'Eb', 'Bb7', 'Eb'],
    description: 'Rubato bel canto ornamentation over flowing left-hand arpeggios.',
    focus: 'Micro-timing rubato & cantabile phrasing',
  },
  {
    id: 'pachelbel-canon',
    title: 'Canon in D / Harmonic Variations',
    composer: 'Johann Pachelbel (1680)',
    instrument: 'piano',
    difficulty: 2,
    key: 'D / C Major',
    tempo: 68,
    meter: '4/4',
    measures: 32,
    chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'],
    description: 'The archetype ground bass progression with 4 distinct polyphonic variations.',
    focus: 'Voice leading & LH bass stability',
  },
  {
    id: 'satie-gymnopedie',
    title: 'Gymnopédie No. 1',
    composer: 'Erik Satie (1888)',
    instrument: 'piano',
    difficulty: 2,
    key: 'D Major',
    tempo: 60,
    meter: '3/4',
    measures: 24,
    chords: ['Gmaj7', 'Dmaj7', 'Gmaj7', 'Dmaj7'],
    description: 'Lent et douloureux. Ethereal major-seventh balance and dynamic restraint.',
    focus: 'Dynamic pedal control & tone damping',
  },
  {
    id: 'bach-prelude',
    title: 'Prelude in C Major, BWV 846',
    composer: 'J.S. Bach (1722)',
    instrument: 'piano',
    difficulty: 3,
    key: 'C Major',
    tempo: 72,
    meter: '4/4',
    measures: 35,
    chords: ['C', 'Dm7', 'G7', 'C', 'Am', 'D7', 'G'],
    description: 'The Well-Tempered Clavier opening. Pure broken-chord harmonic unfolding.',
    focus: 'Metronomic evenness & fingertip weight transfer',
  },

  // Guitar Repertoire
  {
    id: 'knockin-cadence',
    title: "Knockin' Cadence & Strumming Cycle",
    composer: 'Classic Standard',
    instrument: 'guitar',
    difficulty: 1,
    key: 'G Major',
    tempo: 68,
    meter: '4/4',
    measures: 24,
    chords: ['G', 'D', 'Am', 'C'],
    description: 'The foundational open-position cycle with dynamic D-U strum syncopations.',
    focus: 'Left-hand chord transition latency & muted string isolation',
  },
  {
    id: 'spanish-romanza',
    title: 'Romance Anónimo (Jeux Interdits)',
    composer: 'Anonymous / Traditional',
    instrument: 'guitar',
    difficulty: 3,
    key: 'E Minor',
    tempo: 84,
    meter: '3/4',
    measures: 32,
    chords: ['Em', 'Am', 'B7', 'E'],
    description: 'Celebrated arpeggio study featuring continuous treble cantabile over rolling bass.',
    focus: 'Thumb-index-middle finger independence',
  },
  {
    id: 'autumn-voicings',
    title: 'Autumn Jazz Shell Voicings',
    composer: 'Joseph Kosma (1945)',
    instrument: 'guitar',
    difficulty: 4,
    key: 'G Minor / Bb',
    tempo: 104,
    meter: '4/4',
    measures: 32,
    chords: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm'],
    description: 'Essential circle of fifths 3-note guide tone voicings on strings 6-4-3 and 5-4-3.',
    focus: 'Rootless inversions & 3rd-to-7th resolution',
  },
  {
    id: 'neo-soul-cadence',
    title: 'Neo-Soul Extended Ballad',
    composer: 'Modern Standard',
    instrument: 'guitar',
    difficulty: 3,
    key: 'D Major',
    tempo: 74,
    meter: '4/4',
    measures: 16,
    chords: ['Bm7', 'Gmaj7', 'Dmaj9', 'A7sus4'],
    description: 'Lush 9th and 11th chord extensions with thumb-over bass notes.',
    focus: 'Intonation pitch stability under partial barres',
  },
]

export type RepertoireExplorerProps = {
  onSelectPiece?: (piece: RepertoireItem) => void
  activePieceTitle?: string
}

export function RepertoireExplorer({
  onSelectPiece,
  activePieceTitle,
}: RepertoireExplorerProps): React.JSX.Element {
  const propMatch = activePieceTitle
    ? REPERTOIRE_CATALOG.find((p) => p.title === activePieceTitle)
    : undefined

  const [userInstrument, setUserInstrument] = useState<'piano' | 'guitar' | null>(null)
  const [userPieceId, setUserPieceId] = useState<string | null>(null)

  const activeInstrument = userInstrument ?? propMatch?.instrument ?? 'piano'
  const filteredItems = REPERTOIRE_CATALOG.filter((item) => item.instrument === activeInstrument)
  const currentPiece =
    (userPieceId ? REPERTOIRE_CATALOG.find((i) => i.id === userPieceId) : null) ||
    propMatch ||
    filteredItems[0]

  return (
    <section
      id="repertoire"
      aria-label="Repertoire Catalog"
      className="w-full flex flex-col gap-8 rounded-3xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] p-8 sm:p-12 shadow-sm scroll-mt-24"
    >
      {/* Header & Instrument Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#E2DDD3] dark:border-[#38342E] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-mono font-bold">
              §
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#C5A059] dark:text-[#DFC07A]">
              CURATED REPERTOIRE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#242321] dark:text-[#EDE8DF]">
            Masterworks for Deliberate Practice
          </h2>
          <p className="text-xs sm:text-sm text-[#736E65] dark:text-[#A39C8F] font-sans">
            Every score includes complete grand staff staves, guitar fingerings, audio guide tracks, and algorithmic motor targets.
          </p>
        </div>

        {/* Instrument Switcher Tabs */}
        <div className="flex rounded-xl border border-[#D9D3C7] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setUserInstrument('piano')
              setUserPieceId('chopin-nocturne')
            }}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 font-bold transition-all ${
              activeInstrument === 'piano'
                ? 'bg-[#242321] text-[#FAF8F3] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-xs'
                : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
            }`}
          >
            <span>🎹</span>
            <span>PIANO MASTERWORKS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUserInstrument('guitar')
              setUserPieceId('knockin-cadence')
            }}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 font-bold transition-all ${
              activeInstrument === 'guitar'
                ? 'bg-[#242321] text-[#FAF8F3] dark:bg-[#EDE8DF] dark:text-[#141312] shadow-xs'
                : 'text-[#736E65] dark:text-[#A39C8F] hover:text-[#242321] dark:hover:text-[#EDE8DF]'
            }`}
          >
            <span>🎸</span>
            <span>GUITAR STANDARDS</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid & Selected Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Piece Selection List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {filteredItems.map((piece) => {
              const isSelected = currentPiece.id === piece.id

              return (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => {
                    setUserPieceId(piece.id)
                    onSelectPiece?.(piece)
                  }}
                  className={`group flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#FCFBF8] dark:bg-[#24221F] shadow-sm ring-1 ring-[#C5A059]/40'
                      : 'border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] hover:border-[#C5A059]/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-[#C5A059] font-bold">
                      {piece.key} • {piece.tempo} BPM
                    </span>
                    <div className="flex items-center text-[#C5A059]">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3 w-3 ${
                            idx < piece.difficulty ? 'fill-[#C5A059] text-[#C5A059]' : 'text-[#D9D3C7] dark:text-[#38342E]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#242321] dark:text-[#EDE8DF] group-hover:text-[#C5A059] transition-colors">
                    {piece.title}
                  </h3>
                  <p className="text-xs text-[#736E65] dark:text-[#A39C8F] font-mono">
                    {piece.composer}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Detailed Score Dossier (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2DDD3] dark:border-[#38342E] bg-[#FCFBF8] dark:bg-[#141312] p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] dark:border-[#38342E] pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#C5A059] font-bold">
                  {currentPiece.instrument.toUpperCase()} SCORE DOSSIER
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#242321] dark:text-[#EDE8DF] mt-1">
                  {currentPiece.title}
                </h3>
                <p className="text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
                  {currentPiece.composer}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-[#EFECE6] dark:bg-[#24221F] border border-[#D9D3C7] dark:border-[#38342E] px-3 py-1.5 text-xs font-mono font-bold text-[#242321] dark:text-[#EDE8DF]">
                <span>{currentPiece.measures} MEASURES</span>
                <span>•</span>
                <span>{currentPiece.meter}</span>
              </div>
            </div>

            <p className="text-sm font-sans text-[#736E65] dark:text-[#A39C8F] leading-relaxed">
              {currentPiece.description}
            </p>

            {/* Pedagogical Target Box */}
            <div className="rounded-xl border border-[#C5A059]/30 bg-[#C5A059]/10 dark:bg-[#C5A059]/15 p-4 flex items-start gap-3">
              <span className="text-base text-[#C5A059]">🎯</span>
              <div>
                <span className="text-xs font-mono font-bold text-[#C5A059] uppercase block">
                  PRIMARY PEDAGOGICAL TARGET
                </span>
                <p className="text-xs text-[#242321] dark:text-[#EDE8DF] font-sans mt-0.5">
                  {currentPiece.focus}
                </p>
              </div>
            </div>

            {/* Chord Harmonic Progression Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold uppercase text-[#736E65] dark:text-[#A39C8F] tracking-wider block">
                HARMONIC SEQUENCE PREVIEW:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {currentPiece.chords.map((chord, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-[#D9D3C7] dark:border-[#38342E] bg-[#FAF8F3] dark:bg-[#1E1C1A] px-3 py-1 font-serif text-sm font-bold text-[#242321] dark:text-[#EDE8DF] shadow-2xs"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-8 pt-6 border-t border-[#E2DDD3] dark:border-[#38342E] flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-mono text-[#736E65] dark:text-[#A39C8F]">
              Ready for immediate real-time practice on the stand.
            </span>

            <button
              type="button"
              onClick={() => onSelectPiece?.(currentPiece)}
              className="flex items-center gap-2 rounded-xl bg-[#242321] text-[#FAF8F3] dark:bg-[#EDE8DF] dark:text-[#141312] border border-[#242321] dark:border-[#EDE8DF] px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase hover:shadow-md transition-all active:scale-95"
            >
              <span>LOAD INTO STAND</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
