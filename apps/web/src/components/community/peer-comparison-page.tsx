import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'

import {
  fetchCommunityBenchmarks,
  type CommunityBenchmarksDto,
  type CommunityLeaderboardEntryDto,
} from '@/api/sessions'

import { type PeerLeaderboardEntry } from '@/lib/adaptive/recommendation-engine'

import {

  Trophy,

  Users,

  Play,

  Award,

  CheckCircle2,

  Gauge,

  Loader2,

} from 'lucide-react'

function formatOrdinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export type PeerComparisonPageProps = {

  userAccuracyPct?: number

  userMeanLatencyMs?: number

  userVoicingPct?: number

  hasRecordedTakes?: boolean

  isSignedIn?: boolean

  onRequestSignIn?: () => void

  onBackToLanding?: () => void

  onOpenProgress?: () => void

  onPracticePiece?: (songId: string, targetBpm?: number) => void

  userButtonSlot?: React.ReactNode

}

function mapBackendEntry(e: CommunityLeaderboardEntryDto): PeerLeaderboardEntry {
  return {
    rank: e.rank,
    performerName: e.performer_name,
    handle: e.handle,
    isCurrentUser: e.is_current_user,
    isSimulatedBaseline: false,
    instrument: e.instrument,
    songId: e.exercise_id,
    songTitle: e.exercise_title,
    tempoTier: e.tempo_tier,
    tempoBpm: e.tempo_bpm,
    alignmentScorePct: e.accuracy_pct,
    meanOnsetDeltaMs: e.abs_timing_error_ms,
    voicingCompletenessPct: e.voicing_pct,
    bktMasteredCount: e.bkt_mastered_count,
    verifiedTakesCount: e.verified_takes_count,
  }
}

export function PeerComparisonPage({

  userAccuracyPct = 92.4,

  userMeanLatencyMs = 28.0,

  userVoicingPct = 95.0,

  hasRecordedTakes = true,

  isSignedIn = true,

  onRequestSignIn,

  onBackToLanding: _onBackToLanding,

  onOpenProgress: _onOpenProgress,

  onPracticePiece,

  userButtonSlot: _userButtonSlot,

}: PeerComparisonPageProps): React.JSX.Element {

  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'piano' | 'guitar'>('all')

  const [selectedSongFilter, setSelectedSongFilter] = useState<string>('all')

  const [tempoTierFilter, setTempoTierFilter] = useState<'all' | '70%' | '100%' | '105%'>('all')

  const [benchmarks, setBenchmarks] = useState<CommunityBenchmarksDto | null>(null)
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = useState(
    () => typeof fetchCommunityBenchmarks === 'function'
  )
  const [benchmarksError, setBenchmarksError] = useState(false)

  useEffect(() => {
    if (typeof fetchCommunityBenchmarks !== 'function') {
      return
    }
    let cancelled = false
    Promise.resolve().then(async () => {
      if (cancelled) return
      setIsLoadingBenchmarks(true)
      setBenchmarksError(false)
      try {
        const data = await fetchCommunityBenchmarks({
          instrument: instrumentFilter,
          pieceId: selectedSongFilter,
        })
        if (!cancelled && data && typeof data === 'object' && 'distributions' in data) {
          setBenchmarks(data)
        }
      } catch {
        if (!cancelled) {
          setBenchmarks(null)
          setBenchmarksError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBenchmarks(false)
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [instrumentFilter, selectedSongFilter])

  const isBaselineFallback = benchmarks ? benchmarks.is_baseline_fallback : true

  const pieceOptions = useMemo(() => {
    const map = new Map<string, string>([
      ['ex_piano_shostakovich_waltz_2', 'Waltz No. 2 in C Minor'],
      ['ex_piano_canon', "Pachelbel's Canon in D"],
      ['ex_guitar_rising_sun', 'The House of the Rising Sun'],
      ['ex_guitar_knockin', "Knockin' on Heaven's Door"],
    ])
    for (const item of benchmarks?.leaderboard ?? []) {
      if (!map.has(item.exercise_id)) {
        map.set(item.exercise_id, item.exercise_title)
      }
    }
    return Array.from(map.entries())
  }, [benchmarks])

  const entries = useMemo(() => {
    const liveEntries = (benchmarks?.leaderboard ?? []).map(mapBackendEntry)
    return liveEntries
      .filter((e) => instrumentFilter === 'all' || e.instrument === instrumentFilter)
      .filter((e) => selectedSongFilter === 'all' || e.songId === selectedSongFilter)
      .filter((e) => tempoTierFilter === 'all' || e.tempoTier === tempoTierFilter)
      .sort((a, b) => b.alignmentScorePct - a.alignmentScorePct)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [
    benchmarks,
    instrumentFilter,
    selectedSongFilter,
    tempoTierFilter,
  ])

  const liveTiming = !isBaselineFallback ? benchmarks?.distributions.timing_ms : null
  const liveVoicing = !isBaselineFallback ? benchmarks?.distributions.voicing_pct : null
  const liveAccuracy = !isBaselineFallback ? benchmarks?.distributions.accuracy_pct : null

  // Compute user percentiles (prefer backend empirical percentile when live)
  const fallbackTimingPct = Math.max(5, Math.min(99, Math.round(100 - Math.abs(userMeanLatencyMs) * 0.65)))
  const fallbackVoicingPct = Math.max(5, Math.min(99, Math.round(userVoicingPct * 0.92)))
  const timingPercentile = liveTiming?.user_percentile ?? fallbackTimingPct
  const voicingPercentile = liveVoicing?.user_percentile ?? fallbackVoicingPct
  const overallPercentile = liveAccuracy?.user_percentile ?? Math.max(5, Math.min(99, Math.round((timingPercentile + voicingPercentile) / 2)))

  return (

    <div

      data-testid="peer-comparison-page"

      className="min-h-screen w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors"

    >

      {/* Page Title & Quick Action Strip */}

      <div className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121215]/95 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2 min-w-0">

          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 whitespace-nowrap">

            Peer Benchmarks &amp; Piece Leaderboards

          </span>

          <span className="hidden sm:inline text-xs font-mono text-zinc-400 truncate">

            •{' '}
            {isLoadingBenchmarks
              ? 'Loading Cohort Benchmarks'
              : benchmarksError
                ? 'Cohort Offline'
                : isBaselineFallback
                  ? 'Simulated Reference Baseline'
                  : 'Empirical Community Distributions'}{' '}
            &amp; Accuracy Percentiles

          </span>

        </div>

        <motion.button

          type="button"

          whileTap={{ scale: 0.98 }}

          onClick={() => onPracticePiece?.('ex_piano_shostakovich_waltz_2')}

          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ml-auto whitespace-nowrap shrink-0"

        >

          <Play className="size-3 fill-current" />

          <span>Practice Room</span>

        </motion.button>

      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">

        {/* 1. PEER PERCENTILE DISTRIBUTION BELL CURVES */}

        <section className="space-y-4">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

            <div>

              <span
                data-testid="benchmarks-status-label"
                className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-2"
              >

                {isLoadingBenchmarks ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-amber-500" />
                    <span>Loading Live Cohort Benchmarks...</span>
                  </>
                ) : benchmarksError ? (
                  <>
                    Live Cohort Unavailable (Offline)
                  </>
                ) : isBaselineFallback ? (
                  <>
                    Simulated Reference Baseline
                    {benchmarks && benchmarks.total_completed_sessions > 0
                      ? ` · ${benchmarks.cohort_size} Active Musicians (${benchmarks.total_completed_sessions}/${benchmarks.min_cohort_sessions} Verified Takes)`
                      : ''}
                  </>
                ) : (
                  <>
                    Cohort Percentile Distributions (N = {benchmarks?.cohort_size ?? 0} Active Musicians · {benchmarks?.total_completed_sessions ?? 0} Verified Takes)
                  </>
                )}

              </span>

              <h1 className="font-brand text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">

                Compare Your Timing &amp; Chord Voicing Against Peers

              </h1>

              {!isSignedIn && (
                <div className="mt-3 inline-flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-mono text-amber-800 dark:text-amber-300">
                  <span>Practicing in guest mode. Verified cohort placement requires an account.</span>
                  <button
                    type="button"
                    onClick={() => onRequestSignIn?.()}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Sign in to rank your own takes
                  </button>
                </div>
              )}

            </div>

            <div className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 font-mono text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 self-start">

              <Trophy className="size-4 text-emerald-500" />

              <span>

                {hasRecordedTakes ? (

                <>Your Overall Standing: <b>{formatOrdinal(overallPercentile)} Percentile</b> (Top {100 - overallPercentile}%)</>

              ) : (

                <>Your Overall Standing: <b>Baseline Needed</b> (Complete Take in Studio)</>

              )}

              </span>

            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {[

              {

                id: 'dist-timing',

                title: 'Chord Transition Speed (ms)',

                userValLabel: hasRecordedTakes ? `+${Math.round(Math.abs(userMeanLatencyMs))}ms` : '—',

                medianLabel:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading peer median...'
                    : benchmarksError && !benchmarks
                      ? 'Peer Median: Unavailable'
                      : liveTiming?.median != null
                        ? `Peer Median: ±${liveTiming.median.toFixed(1)}ms`
                        : 'Simulated Median: +62ms',

                top10Label:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading top 10%...'
                    : benchmarksError && !benchmarks
                      ? 'Top 10%: Unavailable'
                      : liveTiming?.top_10_pct != null
                        ? `Top 10%: ±${liveTiming.top_10_pct.toFixed(1)}ms`
                        : 'Top 10%: ±14ms',

                percentile: hasRecordedTakes ? timingPercentile : null,

                markerX: hasRecordedTakes ? Math.max(40, Math.min(260, 250 - Math.abs(userMeanLatencyMs) * 1.1)) : null,

                color: '#F59E0B',

                desc: 'Measures how quickly your fingers settle on the new chord after crossing the barline.',

              },

              {

                id: 'dist-voicing',

                title: 'Chord Voicing Completeness (%)',

                userValLabel: hasRecordedTakes ? `${userVoicingPct.toFixed(1)}%` : '—',

                medianLabel:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading peer median...'
                    : benchmarksError && !benchmarks
                      ? 'Peer Median: Unavailable'
                      : liveVoicing?.median != null
                        ? `Peer Median: ${liveVoicing.median.toFixed(1)}%`
                        : 'Simulated Median: 84.0%',

                top10Label:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading top 10%...'
                    : benchmarksError && !benchmarks
                      ? 'Top 10%: Unavailable'
                      : liveVoicing?.top_10_pct != null
                        ? `Top 10%: ${liveVoicing.top_10_pct.toFixed(1)}%`
                        : 'Top 10%: 98.0%',

                percentile: hasRecordedTakes ? voicingPercentile : null,

                markerX: hasRecordedTakes ? Math.max(40, Math.min(265, (userVoicingPct / 100) * 255)) : null,

                color: '#10B981',

                desc: 'Percentage of expected chord notes (especially roots and 3rds) that ring out cleanly.',

              },

              {

                id: 'dist-alignment',

                title: 'Needleman-Wunsch Score (%)',

                userValLabel: hasRecordedTakes ? `${userAccuracyPct.toFixed(1)}%` : '—',

                medianLabel:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading peer median...'
                    : benchmarksError && !benchmarks
                      ? 'Peer Median: Unavailable'
                      : liveAccuracy?.median != null
                        ? `Peer Median: ${liveAccuracy.median.toFixed(1)}%`
                        : 'Simulated Median: 81.5%',

                top10Label:
                  isLoadingBenchmarks && !benchmarks
                    ? 'Loading top 10%...'
                    : benchmarksError && !benchmarks
                      ? 'Top 10%: Unavailable'
                      : liveAccuracy?.top_10_pct != null
                        ? `Top 10%: ${liveAccuracy.top_10_pct.toFixed(1)}%`
                        : 'Top 10%: 96.2%',

                percentile: hasRecordedTakes ? overallPercentile : null,

                markerX: hasRecordedTakes ? Math.max(40, Math.min(265, (userAccuracyPct / 100) * 255)) : null,

                color: '#F59E0B',

                desc: 'Combined sequence alignment score across full-length repertoire takes.',

              },

            ].map((dist, idx) => (

              <motion.div

                key={dist.id}

                data-testid={dist.id}

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.22, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}

                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs flex flex-col justify-between gap-4"

              >

                <div className="space-y-1">

                  <div className="flex items-center justify-between text-xs font-mono">

                    <span className="text-zinc-500 uppercase">{dist.title}</span>

                    <span className="font-bold text-amber-600 dark:text-amber-400">

                      {dist.percentile != null ? `${formatOrdinal(dist.percentile)} Percentile` : 'Baseline Needed'}

                    </span>

                  </div>

                  <div className="flex items-baseline justify-between">

                    <span className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">

                      You: {dist.userValLabel}

                    </span>

                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">

                      {dist.top10Label}

                    </span>

                  </div>

                </div>

                {/* SVG Gaussian Bell Curve with User Percentile Marker */}

                <svg viewBox="0 0 300 110" className="w-full h-28 overflow-visible">

                  <line

                    x1={15}

                    y1={90}

                    x2={285}

                    y2={90}

                    stroke="currentColor"

                    className="text-zinc-200 dark:text-zinc-800"

                    strokeWidth={1}

                  />

                  {/* Bell Curve Area */}

                  <path

                    d="M 15 90 Q 65 88, 105 52 T 155 18 T 205 52 T 285 90 Z"

                    fill={dist.color}

                    fillOpacity={0.12}

                  />

                  <path

                    d="M 15 90 Q 65 88, 105 52 T 155 18 T 205 52 T 285 90"

                    fill="none"

                    stroke={dist.color}

                    strokeWidth={2}

                  />

                  {/* Peer Median Line */}

                  <line

                    x1={155}

                    y1={18}

                    x2={155}

                    y2={90}

                    stroke="currentColor"

                    className="text-zinc-400 dark:text-zinc-600"

                    strokeDasharray="3 3"

                    strokeWidth={1}

                  />

                  <text

                    x={155}

                    y={104}

                    textAnchor="middle"

                    className="fill-zinc-500 text-[9px] font-mono"

                  >

                    {dist.medianLabel}

                  </text>

                  {/* User Position Pin */}

                  {dist.markerX !== null && dist.markerX !== undefined && (

                    <>

                      <line

                        x1={dist.markerX}

                        y1={12}

                        x2={dist.markerX}

                        y2={90}

                        stroke="#10B981"

                        strokeWidth={2}

                      />

                      <circle cx={dist.markerX} cy={28} r={4.5} fill="#10B981" />

                      <text

                        x={dist.markerX}

                        y={10}

                        textAnchor="middle"

                        fill="#10B981"

                        className="text-[9px] font-mono font-bold"

                      >

                        YOU ({dist.userValLabel})

                      </text>

                    </>

                  )}

                </svg>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">

                  {dist.desc}

                </p>

              </motion.div>

            ))}

          </div>

        </section>

        {/* 2. INTERACTIVE PIECE-BY-PIECE LEADERBOARD */}

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] overflow-hidden shadow-xs">

          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div>

              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">

                <Users className="size-3.5" />

                <span>Interactive Repertoire Leaderboard</span>

              </div>

              <h2 className="font-brand text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">

                Piece Rankings by Instrument &amp; Tempo Tier

              </h2>

            </div>

            {/* Filter Bar */}

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">

              {/* Instrument Filter */}

              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-1">

                {(['all', 'piano', 'guitar'] as const).map((inst) => {
                  const isSelected = instrumentFilter === inst
                  return (
                  <button

                    key={inst}

                    type="button"

                    onClick={() => setInstrumentFilter(inst)}

                    className={`relative px-2.5 py-1 rounded uppercase font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${

                      isSelected

                        ? 'text-zinc-950'

                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                    }`}

                  >

                    {isSelected && (
                      <motion.span
                        layoutId="peer-instrument-filter"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute inset-0 rounded bg-amber-500 shadow-xs"
                        aria-hidden="true"
                      />
                    )}

                    <span className="relative z-10">{inst}</span>

                  </button>
                  )
                })}

              </div>

              {/* Piece Filter */}

              <select

                aria-label="Filter leaderboard by piece"

                value={selectedSongFilter}

                onChange={(e) => setSelectedSongFilter(e.target.value)}

                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-800 dark:text-zinc-200 text-xs font-mono"

              >

                <option value="all">All Pieces</option>

                {pieceOptions.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}

              </select>

              {/* Tempo Tier Filter */}

              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-1">

                {(['all', '70%', '100%', '105%'] as const).map((tier) => {
                  const isSelected = tempoTierFilter === tier
                  return (
                  <button

                    key={tier}

                    type="button"

                    onClick={() => setTempoTierFilter(tier)}

                    className={`relative px-2.5 py-1 rounded uppercase font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${

                      isSelected

                        ? 'text-zinc-950'

                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                    }`}

                  >

                    {isSelected && (
                      <motion.span
                        layoutId="peer-tempo-filter"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute inset-0 rounded bg-emerald-500 shadow-xs"
                        aria-hidden="true"
                      />
                    )}

                    <span className="relative z-10">{tier === 'all' ? 'All Speeds' : tier}</span>

                  </button>
                  )
                })}

              </div>

            </div>

          </div>

          {/* Leaderboard Table */}

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse font-mono text-xs">

              <thead>

                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] text-[10px] uppercase tracking-wider text-zinc-500">

                  <th className="py-3 px-4">Rank</th>

                  <th className="py-3 px-4">Musician</th>

                  <th className="py-3 px-4">Piece &amp; Instrument</th>

                  <th className="py-3 px-4">Tempo Tier</th>

                  <th className="py-3 px-4">Alignment Score</th>

                  <th className="py-3 px-4">Mean Timing</th>

                  <th className="py-3 px-4">Voicing</th>

                  <th className="py-3 px-4 text-right">Action</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">

                {isLoadingBenchmarks ? (
                  <tr>
                    <td
                      colSpan={8}
                      data-testid="leaderboard-loading-state"
                      className="py-10 px-4 text-center text-xs font-mono text-zinc-500"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin text-amber-500" />
                        <span>Loading verified cohort rankings...</span>
                      </span>
                    </td>
                  </tr>
                ) : benchmarksError && entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      data-testid="leaderboard-error-state"
                      className="py-10 px-4 text-center text-xs font-mono text-zinc-500"
                    >
                      Unable to reach live cohort benchmarks right now. Check your connection or refresh to retry.
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      data-testid="leaderboard-empty-state"
                      className="py-10 px-4 text-center text-xs font-mono text-zinc-500"
                    >
                      No verified takes match the selected filters yet. Complete a practice take in the Practice Room to post a verified score.
                    </td>
                  </tr>
                ) : entries.map((row: PeerLeaderboardEntry) => (

                  <tr

                    key={`${row.handle}-${row.songId}`}

                    data-testid={row.isCurrentUser ? 'leaderboard-current-user-row' : undefined}

                    className={`transition-colors ${

                      row.isCurrentUser

                        ? 'bg-amber-500/10 font-semibold'

                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'

                    }`}

                  >

                    <td className="py-3.5 px-4">

                      <span

                        className={`inline-flex items-center justify-center size-6 rounded-full text-[11px] font-bold ${

                          row.rank === 1

                            ? 'bg-amber-500 text-zinc-950'

                            : row.rank <= 3

                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'

                            : 'text-zinc-500'

                        }`}

                      >

                        {row.rank}

                      </span>

                    </td>

                    <td className="py-3.5 px-4">

                      <div className="flex items-center gap-2">

                        <span className="font-sans font-bold text-zinc-900 dark:text-zinc-100">

                          {row.performerName}

                        </span>

                        {row.isCurrentUser && (

                          <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[9px] font-bold uppercase">

                            YOU

                          </span>

                        )}

                        {row.isSimulatedBaseline && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-mono uppercase">
                            Simulated
                          </span>
                        )}

                      </div>

                      <span className="text-[10px] text-zinc-500">{row.handle}</span>

                    </td>

                    <td className="py-3.5 px-4">

                      <div className="font-sans font-medium text-zinc-900 dark:text-zinc-100">

                        {row.songTitle}

                      </div>

                      <span className="text-[10px] uppercase text-zinc-500">

                        {row.instrument} · {row.bktMasteredCount} BKT Mastered

                      </span>

                    </td>

                    <td className="py-3.5 px-4">

                      <span className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B]">

                        {row.tempoTier} ({row.tempoBpm} BPM)

                      </span>

                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">

                      {row.alignmentScorePct.toFixed(1)}%

                    </td>

                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">

                      ±{row.meanOnsetDeltaMs.toFixed(1)}ms

                    </td>

                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">

                      {row.voicingCompletenessPct.toFixed(1)}%

                    </td>

                    <td className="py-3.5 px-4 text-right">

                      <button

                        type="button"

                        onClick={() => onPracticePiece?.(row.songId, row.tempoBpm)}

                        className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"

                      >

                        <Play className="size-3 text-amber-500 fill-current" />

                        <span>Challenge Score</span>

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* Bottom Benchmark Callout Cards */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 flex items-start gap-3">

            <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />

            <div className="text-xs space-y-1">

              <div className="font-bold text-zinc-900 dark:text-zinc-100">

                Objective Acoustic Scoring

              </div>

              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">

                All peer scores are computed via the same Needleman-Wunsch sequence alignment and 12-pitch-class chroma verification pipeline.

              </p>

            </div>

          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 flex items-start gap-3">

            <Gauge className="size-5 text-amber-500 shrink-0 mt-0.5" />

            <div className="text-xs space-y-1">

              <div className="font-bold text-zinc-900 dark:text-zinc-100">

                How to Reach the Top 10%

              </div>

              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Isolate slow chord transitions at 70% tempo until onset lag drops below 30ms before advancing to full repertoire speed.
              </p>

            </div>

          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 flex items-start gap-3">

            <Award className="size-5 text-emerald-500 shrink-0 mt-0.5" />

            <div className="text-xs space-y-1">

              <div className="font-bold text-zinc-900 dark:text-zinc-100">

                Speed-Normalized Tiers

              </div>

              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">

                Compare yourself fairly within the 70% learning tempo tier before stepping up to 100% target and 105% mastery speeds.

              </p>

            </div>

          </div>

        </section>

      </main>

    </div>

  )

}
