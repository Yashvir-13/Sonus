import React, { useEffect, useMemo, useState } from 'react'

import {

  rankAdaptiveRecommendations,

  mapBackendMasteryToTransitions,

  INITIAL_TRANSITION_MASTERY,

  type TransitionMasteryState,

  type LongitudinalSessionPoint,

  type AdaptiveExerciseRecommendation,

} from '@/lib/adaptive/recommendation-engine'

import { fetchUserMastery } from '@/api/sessions'

import {

  Play,

  TrendingUp,

  CheckCircle2,

  Clock,

  Award,

  Sliders,

  Sparkles,

  Activity,

} from 'lucide-react'

export type ProgressDashboardPageProps = {

  transitions?: TransitionMasteryState[]

  sessionHistory?: LongitudinalSessionPoint[]

  onBackToLanding?: () => void

  onOpenStudioWithRecommendation?: (rec: AdaptiveExerciseRecommendation) => void

  onOpenCommunity?: () => void

  userButtonSlot?: React.ReactNode

}

export function ProgressDashboardPage({

  transitions = [],

  sessionHistory = [],

  onBackToLanding: _onBackToLanding,

  onOpenStudioWithRecommendation,

  onOpenCommunity: _onOpenCommunity,

  userButtonSlot: _userButtonSlot,

}: ProgressDashboardPageProps): React.JSX.Element {

  const [liveTransitions, setLiveTransitions] = useState<TransitionMasteryState[] | null>(null)

  const [instrumentFilter, setInstrumentFilter] = useState<'all' | 'piano' | 'guitar'>('all')

  const [selectedMetricTab, setSelectedMetricTab] = useState<'latency' | 'accuracy'>('latency')

  useEffect(() => {

    let isMounted = true

    fetchUserMastery()

      .then((data) => {

        if (!isMounted) return

        if (data && Array.isArray(data.records) && data.records.length > 0) {

          const mapped = mapBackendMasteryToTransitions(data.records)

          setLiveTransitions(mapped)

        }

      })

      .catch(() => {

        // Fall back gracefully to local props or catalog baseline if API is offline

      })

    return () => {

      isMounted = false

    }

  }, [])

  const effectiveTransitions = useMemo(() => {

    if (liveTransitions && liveTransitions.length > 0) return liveTransitions

    if (transitions && transitions.length > 0) return transitions

    return INITIAL_TRANSITION_MASTERY

  }, [liveTransitions, transitions])

  const filteredTransitions = useMemo(() => {

    if (instrumentFilter === 'all') return effectiveTransitions

    return effectiveTransitions.filter((t) => t.instrument === instrumentFilter)

  }, [effectiveTransitions, instrumentFilter])

  const recommendations = useMemo(() => {

    return rankAdaptiveRecommendations(filteredTransitions)

  }, [filteredTransitions])

  const topThreeRecommendations = recommendations.slice(0, 3)

  const latestSession = sessionHistory[sessionHistory.length - 1]

  const firstSession = sessionHistory[0]

  const latencyImprovementMs = firstSession && latestSession

    ? Math.max(0, firstSession.avgLatencyMs - latestSession.avgLatencyMs)

    : 0

  const masteredCount = effectiveTransitions.filter((t) => t.isMastered || t.pKnown >= 0.95).length

  const dueOrOverdueCount = effectiveTransitions.filter((t) => t.dueStatus !== 'scheduled').length

  return (

    <div

      data-testid="progress-dashboard-page"

      className="min-h-screen w-full bg-[#F8F8F6] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans transition-colors"

    >

      {/* Page Title & Quick Action Strip */}

      <div className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-[#121215]/60 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2">

          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">

            Progress, History &amp; Exercise Coach

          </span>

          <span className="hidden sm:inline text-xs font-mono text-zinc-400">

            • Longitudinal BKT &amp; SM-2 Mastery Schedule

          </span>

        </div>

        {topThreeRecommendations[0] && (

          <button

            type="button"

            onClick={() => onOpenStudioWithRecommendation?.(topThreeRecommendations[0]!)}

            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"

          >

            <Play className="size-3 fill-current" />

            <span>Practice Recommended Drill</span>

          </button>

        )}

      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">

        {/* 1. MUSICIAN PROFILE & LONGITUDINAL SUMMARY CARDS */}

        <section className="space-y-4">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

            <div>

              <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">

                Musician Profile &amp; Longitudinal Trajectory

              </span>

              <h1 className="font-brand text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">

                Your Practice History &amp; Adaptive Exercise Prescriptions

              </h1>

            </div>

            {/* Instrument Filter */}

            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-1 text-xs font-mono self-start">

              {(['all', 'piano', 'guitar'] as const).map((inst) => (

                <button

                  key={inst}

                  type="button"

                  onClick={() => setInstrumentFilter(inst)}

                  className={`px-3 py-1 rounded-md uppercase font-bold transition-colors cursor-pointer ${

                    instrumentFilter === inst

                      ? 'bg-amber-500 text-zinc-950'

                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                  }`}

                >

                  {inst === 'all' ? 'All Instruments' : inst}

                </button>

              ))}

            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs">

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">

                <span>LATEST ALIGNMENT ACCURACY</span>

                <TrendingUp className="size-4 text-emerald-500" />

              </div>

              <div className="mt-2 flex items-baseline gap-2">

                <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">

                  {latestSession ? `${latestSession.accuracyPct.toFixed(1)}%` : '—'}

                </span>

                {latestSession && firstSession && sessionHistory.length > 1 ? (

                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">

                    {latestSession.accuracyPct >= firstSession.accuracyPct ? '+' : ''}

                    {(latestSession.accuracyPct - firstSession.accuracyPct).toFixed(1)}% since S1

                  </span>

                ) : (

                  <span className="text-xs font-mono text-zinc-400">

                    {sessionHistory.length === 1 ? 'Baseline Set' : 'Awaiting Take 1'}

                  </span>

                )}

              </div>

              <p className="mt-1 text-xs text-zinc-500">

                {sessionHistory.length === 0

                  ? 'No recorded practice sessions yet'

                  : `Across ${sessionHistory.length} recorded practice sessions`}

              </p>

            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs">

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">

                <span>MEAN TRANSITION LATENCY</span>

                <Clock className="size-4 text-amber-500" />

              </div>

              <div className="mt-2 flex items-baseline gap-2">

                <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">

                  {latestSession ? `+${latestSession.avgLatencyMs}ms` : '—'}

                </span>

                {latencyImprovementMs > 0 ? (

                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">

                    -{latencyImprovementMs}ms faster

                  </span>

                ) : (

                  <span className="text-xs font-mono text-zinc-400">

                    {latestSession ? 'Initial Reference' : 'Baseline Needed'}

                  </span>

                )}

              </div>

              <p className="mt-1 text-xs text-zinc-500">

                {firstSession

                  ? `From +${firstSession.avgLatencyMs}ms baseline in Take 1`

                  : 'Record a take to establish motor timing'}

              </p>

            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs">

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">

                <span>BKT MASTERED TRANSITIONS</span>

                <CheckCircle2 className="size-4 text-emerald-500" />

              </div>

              <div className="mt-2 flex items-baseline gap-2">

                <span className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">

                  {masteredCount} / {transitions.length}

                </span>

                <span className="text-xs font-mono text-zinc-500">

                  P(L_t) ≥ 95%

                </span>

              </div>

              <p className="mt-1 text-xs text-zinc-500">

                Bayesian Knowledge Tracing verified

              </p>

            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-xs">

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">

                <span>SM-2 REVIEWS DUE TODAY</span>

                <Award className="size-4 text-amber-500" />

              </div>

              <div className="mt-2 flex items-baseline gap-2">

                <span className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">

                  {dueOrOverdueCount}

                </span>

                <span className="text-xs font-mono text-zinc-500">

                  chord pairs ready

                </span>

              </div>

              <p className="mt-1 text-xs text-zinc-500">

                Spaced repetition memory consolidation

              </p>

            </div>

          </div>

        </section>

        {/* 2. RESEARCH-BACKED EXERCISE RECOMMENDATIONS (BKT + SM-2 + THOMPSON BANDIT) */}

        <section className="space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">

            <div>

              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">

                <Sparkles className="size-3.5" />

                <span>Recommended Next Practice (BKT + SM-2 + Thompson Sampling Bandit)</span>

              </div>

              <h2 className="font-brand text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">

                Prescribed Drills Based on Your Motor Habits &amp; Memory Decay

              </h2>

            </div>

            <span className="text-xs font-mono text-zinc-500">

              Ranked by Learning Gap (1 − P(L_t)), SM-2 Review Urgency &amp; Bandit Expected Gain

            </span>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {topThreeRecommendations.length === 0 ? (

              <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white/50 dark:bg-[#121215]/50 space-y-3">

                <Sparkles className="size-7 text-amber-500 mx-auto" />

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">

                  No Motor Bottlenecks Identified Yet

                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">

                  Complete your first full practice take in the Practice Studio. The Bayesian Knowledge Tracing engine will analyze your chord transition timing, detect bottlenecks, and prescribe focused drill loops here.

                </p>

              </div>

            ) : (

              topThreeRecommendations.map((rec, idx) => (

              <div

                key={rec.id}

                data-testid={`recommendation-card-${idx + 1}`}

                className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 shadow-sm transition-all ${

                  idx === 0

                    ? 'border-amber-500/80 bg-white dark:bg-[#121215] ring-1 ring-amber-500/20'

                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]'

                }`}

              >

                <div className="space-y-3">

                  <div className="flex items-center justify-between gap-2 font-mono text-xs">

                    <span

                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${

                        idx === 0

                          ? 'bg-amber-500 text-zinc-950'

                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'

                      }`}

                    >

                      #{rec.rank} Priority · {rec.instrument.toUpperCase()}

                    </span>

                    <span className="text-zinc-500 tabular-nums">

                      Score {rec.priorityScore}

                    </span>

                  </div>

                  <div>

                    <div className="flex items-baseline justify-between gap-2">

                      <h3 className="font-brand text-2xl font-bold text-zinc-900 dark:text-zinc-100">

                        {rec.transitionLabel}

                      </h3>

                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">

                        +{rec.ewmaLatencyMs}ms EWMA

                      </span>

                    </div>

                    <p className="text-xs font-mono text-zinc-500 mt-0.5">

                      From {rec.songTitle}

                    </p>

                  </div>

                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">

                    {rec.rationaleHeadline}

                  </p>

                  {/* 3-Pillar Cognitive Metrics Box */}

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-3 space-y-2 font-mono text-[11px]">

                    <div className="flex items-center justify-between">

                      <span className="text-zinc-500">BKT Mastery P(L_t):</span>

                      <span className="font-bold text-amber-600 dark:text-amber-400">

                        {rec.bktMasteryPct}% (Gap {rec.learningGapPct}%)

                      </span>

                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">

                      <div

                        className="h-full bg-amber-500 rounded-full"

                        style={{ width: `${Math.min(100, rec.bktMasteryPct)}%` }}

                      />

                    </div>

                    <div className="flex items-center justify-between pt-1">

                      <span className="text-zinc-500">SM-2 Schedule:</span>

                      <span className="text-zinc-800 dark:text-zinc-200">{rec.sm2UrgencyLabel}</span>

                    </div>

                    <div className="flex items-center justify-between">

                      <span className="text-zinc-500">Bandit Drill Arm:</span>

                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">

                        {rec.strategyDisplayName}

                      </span>

                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">

                      <span>Posterior Beta(α={rec.banditAlpha}, β={rec.banditBeta})</span>

                      <span>Expected Gain: {rec.banditExpectedRewardPct}%</span>

                    </div>

                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">

                    {rec.practiceInstructions}

                  </p>

                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">

                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">

                    <div className="p-1.5 rounded bg-[#F8F8F6] dark:bg-[#09090B] border border-amber-500/50">

                      <span className="text-zinc-500 block">70%</span>

                      <span className="font-bold text-amber-600 dark:text-amber-400">

                        {rec.tempoRampStages.isolationBpm}

                      </span>

                    </div>

                    <div className="p-1.5 rounded bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800">

                      <span className="text-zinc-500 block">85%</span>

                      <span className="font-bold text-zinc-700 dark:text-zinc-300">

                        {rec.tempoRampStages.stepBpm}

                      </span>

                    </div>

                    <div className="p-1.5 rounded bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800">

                      <span className="text-zinc-500 block">100%</span>

                      <span className="font-bold text-zinc-700 dark:text-zinc-300">

                        {rec.tempoRampStages.targetBpm}

                      </span>

                    </div>

                    <div className="p-1.5 rounded bg-[#F8F8F6] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800">

                      <span className="text-zinc-500 block">105%</span>

                      <span className="font-bold text-emerald-600 dark:text-emerald-400">

                        {rec.tempoRampStages.overSpeedBpm}

                      </span>

                    </div>

                  </div>

                  <button

                    type="button"

                    data-testid={`launch-recommended-drill-${idx + 1}`}

                    onClick={() => onOpenStudioWithRecommendation?.(rec)}

                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"

                  >

                    <Play className="size-3.5 fill-current" />

                    <span>

                      Practice {rec.transitionLabel} at {rec.recommendedBpm} BPM →

                    </span>

                  </button>

                </div>

              </div>

            ))

            )}

          </div>

        </section>

        {/* 3. LONGITUDINAL IMPROVEMENT & CUSUM CHANGE-POINT CHART */}

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-xs space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">

            <div>

              <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">

                Session-Over-Session Telemetry &amp; Page’s CUSUM Change-Points

              </span>

              <h2 className="font-brand text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">

                How Your Timing &amp; Chord Accuracy Evolved Across Sessions

              </h2>

            </div>

            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8F8F6] dark:bg-[#09090B] p-1 text-xs font-mono">

              <button

                type="button"

                onClick={() => setSelectedMetricTab('latency')}

                className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${

                  selectedMetricTab === 'latency'

                    ? 'bg-amber-500 text-zinc-950'

                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                }`}

              >

                Transition Latency (ms)

              </button>

              <button

                type="button"

                onClick={() => setSelectedMetricTab('accuracy')}

                className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${

                  selectedMetricTab === 'accuracy'

                    ? 'bg-amber-500 text-zinc-950'

                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'

                }`}

              >

                Alignment Accuracy (%)

              </button>

            </div>

          </div>

          {/* Interactive SVG Longitudinal Chart */}

          <div className="w-full overflow-x-auto">

            <svg viewBox="0 0 800 230" className="w-full min-w-[620px] h-56 overflow-visible">

              {/* Horizontal reference lines */}

              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {

                const y = 24 + ratio * 160

                const label =

                  selectedMetricTab === 'latency'

                    ? `${Math.round(180 - ratio * 180)}ms`

                    : `${Math.round(100 - ratio * 40)}%`

                return (

                  <g key={idx}>

                    <line

                      x1={56}

                      y1={y}

                      x2={770}

                      y2={y}

                      stroke="currentColor"

                      className="text-zinc-200 dark:text-zinc-800"

                      strokeDasharray={idx === 4 ? undefined : '4 4'}

                      strokeWidth={1}

                    />

                    <text

                      x={46}

                      y={y + 4}

                      textAnchor="end"

                      className="fill-zinc-400 dark:fill-zinc-500 text-[10px] font-mono"

                    >

                      {label}

                    </text>

                  </g>

                )

              })}

              {/* Target pocket zone for latency (<30ms) */}

              {selectedMetricTab === 'latency' && (

                <rect

                  x={56}

                  y={24 + (150 / 180) * 160}

                  width={714}

                  height={(30 / 180) * 160}

                  fill="#10B981"

                  fillOpacity={0.08}

                />

              )}

              {/* Polyline connecting sessions */}

              {(() => {

                if (sessionHistory.length === 0) {

                  return (

                    <text

                      x={375}

                      y={105}

                      textAnchor="middle"

                      fill="#71717A"

                      fontSize={11}

                      fontFamily="monospace"

                    >

                      Awaiting initial practice take to plot CUSUM learning curve...

                    </text>

                  )

                }

                const count = Math.max(2, sessionHistory.length)

                const points = sessionHistory.map((s, i) => {

                  const x = 75 + (i / (count - 1)) * 675

                  const y =

                    selectedMetricTab === 'latency'

                      ? 24 + (1 - Math.min(180, s.avgLatencyMs) / 180) * 160

                      : 24 + (1 - (Math.max(60, s.accuracyPct) - 60) / 40) * 160

                  return { x, y, s }

                })

                const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ')

                return (

                  <>

                    <polyline

                      fill="none"

                      stroke={selectedMetricTab === 'latency' ? '#F59E0B' : '#10B981'}

                      strokeWidth={2.5}

                      points={polylineStr}

                    />

                    {points.map(({ x, y, s }) => (

                      <g key={s.sessionIndex}>

                        {s.cusumEvent && (

                          <>

                            <line

                              x1={x}

                              y1={18}

                              x2={x}

                              y2={184}

                              stroke={

                                s.cusumEvent.type === 'habit_formed' ? '#EF4444' : '#10B981'

                              }

                              strokeWidth={1.2}

                              strokeDasharray="3 3"

                            />

                            <rect

                              x={x - 68}

                              y={4}

                              width={136}

                              height={18}

                              rx={4}

                              fill={

                                s.cusumEvent.type === 'habit_formed' ? '#EF4444' : '#10B981'

                              }

                              fillOpacity={0.15}

                            />

                            <text

                              x={x}

                              y={16}

                              textAnchor="middle"

                              fill={

                                s.cusumEvent.type === 'habit_formed' ? '#EF4444' : '#10B981'

                              }

                              className="text-[9px] font-mono font-bold"

                            >

                              {s.cusumEvent.label}

                            </text>

                          </>

                        )}

                        <circle

                          cx={x}

                          cy={y}

                          r={5}

                          fill={selectedMetricTab === 'latency' ? '#F59E0B' : '#10B981'}

                          stroke="#09090B"

                          strokeWidth={1.5}

                        />

                        <text

                          x={x}

                          y={y - 10}

                          textAnchor="middle"

                          className="fill-zinc-700 dark:fill-zinc-200 text-[10px] font-mono font-bold"

                        >

                          {selectedMetricTab === 'latency'

                            ? `+${s.avgLatencyMs}ms`

                            : `${s.accuracyPct.toFixed(1)}%`}

                        </text>

                        <text

                          x={x}

                          y={204}

                          textAnchor="middle"

                          className="fill-zinc-500 text-[10px] font-mono"

                        >

                          S{s.sessionIndex} ({s.dateLabel})

                        </text>

                      </g>

                    ))}

                  </>

                )

              })()}

            </svg>

          </div>

        </section>

        {/* 4. CHORD TRANSITION MASTERY MATRIX & SESSION HISTORY LOG */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left 7 cols: Chord Transition Mastery Matrix */}

          <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] overflow-hidden shadow-xs">

            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">

              <div>

                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500 font-semibold">

                  Knowledge Tracing &amp; Spaced Repetition State

                </span>

                <h3 className="font-brand text-xl font-bold text-zinc-900 dark:text-zinc-100">

                  Chord Transition Mastery Matrix

                </h3>

              </div>

              <Sliders className="size-4 text-zinc-400" />

            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">

              {recommendations.map((rec) => (

                <div

                  key={rec.id}

                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"

                >

                  <div className="space-y-1">

                    <div className="flex items-center gap-2">

                      <span className="font-brand text-base font-bold text-zinc-900 dark:text-zinc-100">

                        {rec.transitionLabel}

                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">

                        {rec.instrument}

                      </span>

                      <span

                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${

                          rec.bktMasteryPct >= 95

                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'

                            : rec.bktMasteryPct >= 65

                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'

                            : 'bg-red-500/15 text-red-600 dark:text-red-400'

                        }`}

                      >

                        P(Mastery) = {rec.bktMasteryPct}%

                      </span>

                    </div>

                    <div className="text-[11px] text-zinc-500">

                      {rec.songTitle} · {rec.sm2UrgencyLabel} · EWMA +{rec.ewmaLatencyMs}ms

                    </div>

                  </div>

                  <button

                    type="button"

                    onClick={() => onOpenStudioWithRecommendation?.(rec)}

                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"

                  >

                    <Play className="size-3 text-amber-500 fill-current" />

                    <span>Loop ({rec.recommendedBpm} BPM)</span>

                  </button>

                </div>

              ))}

            </div>

          </div>

          {/* Right 5 cols: Chronological Session Log */}

          <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] overflow-hidden shadow-xs">

            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">

              <div>

                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">

                  Verified Practice Log

                </span>

                <h3 className="font-brand text-xl font-bold text-zinc-900 dark:text-zinc-100">

                  Recent Practice Sessions

                </h3>

              </div>

              <Activity className="size-4 text-zinc-400" />

            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[420px] overflow-y-auto font-mono text-xs">

              {sessionHistory.length === 0 ? (

                <div className="p-8 text-center text-zinc-500 font-sans space-y-2">

                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">

                    No recorded takes in PostgreSQL yet

                  </p>

                  <p className="text-xs text-zinc-400">

                    Complete a take in the Practice Room to view sequence alignments, latency improvements, and habit alerts.

                  </p>

                </div>

              ) : (

                [...sessionHistory].reverse().map((sess) => (

                <div key={sess.sessionIndex} className="p-4 space-y-1.5">

                  <div className="flex items-center justify-between">

                    <span className="font-bold text-zinc-900 dark:text-zinc-100">

                      Session #{sess.sessionIndex} · {sess.dateLabel}

                    </span>

                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">

                      {sess.accuracyPct.toFixed(1)}% Acc

                    </span>

                  </div>

                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans">

                    {sess.songTitle} ({sess.instrument.toUpperCase()} · {sess.tempoBpm} BPM)

                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">

                    <span>Mean Lag: +{sess.avgLatencyMs}ms</span>

                    <span>·</span>

                    <span>Voicing: {sess.voicingPct}%</span>

                  </div>

                  {sess.cusumEvent && (

                    <div

                      className={`mt-1 px-2.5 py-1 rounded text-[10px] border ${

                        sess.cusumEvent.type === 'habit_formed'

                          ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'

                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'

                      }`}

                    >

                      <b>{sess.cusumEvent.label}:</b> {sess.cusumEvent.detail}

                    </div>

                  )}

                </div>

              )))}

            </div>

          </div>

        </div>

      </main>

    </div>

  )

}
