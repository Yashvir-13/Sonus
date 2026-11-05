export type DrillStrategyArm =
  | 'isolated_transition'
  | 'subdivision_click'
  | 'voicing_arpeggio'
  | 'gradual_tempo_ramp'

export type TransitionMasteryState = {
  id: string
  transitionLabel: string
  fromChord: string
  toChord: string
  songId: string
  songTitle: string
  instrument: 'piano' | 'guitar'
  /** BKT latent mastery probability P(L_t) in [0, 1] */
  pKnown: number
  isMastered: boolean
  observationsCount: number
  /** EWMA transition latency in milliseconds */
  ewmaLatencyMs: number
  /** Mean voicing completeness percentage (0..100) */
  voicingCompletenessPct: number
  /** Dropped note if any */
  frequentlyMissedNote: string | null
  /** SuperMemo SM-2 state */
  sm2IntervalDays: number
  sm2EaseFactor: number
  sm2Repetitions: number
  daysSinceLastPractice: number
  dueStatus: 'overdue' | 'due_today' | 'scheduled'
  /** Recommended practice BPM (70% isolation stage) */
  recommendedBpm: number
  targetSongBpm: number
  /** Thompson Sampling Bandit Beta(alpha, beta) posteriors per drill arm */
  banditPosteriors: Record<DrillStrategyArm, { alpha: number; beta: number }>
}

export type AdaptiveExerciseRecommendation = {
  id: string
  rank: number
  transitionLabel: string
  fromChord: string
  toChord: string
  songId: string
  songTitle: string
  instrument: 'piano' | 'guitar'
  priorityScore: number
  bktMasteryPct: number
  learningGapPct: number
  sm2UrgencyLabel: string
  sm2EaseFactor: number
  ewmaLatencyMs: number
  voicingCompletenessPct: number
  selectedDrillStrategy: DrillStrategyArm
  strategyDisplayName: string
  banditExpectedRewardPct: number
  banditAlpha: number
  banditBeta: number
  recommendedBpm: number
  targetSongBpm: number
  tempoRampStages: {
    isolationBpm: number
    stepBpm: number
    targetBpm: number
    overSpeedBpm: number
  }
  rationaleHeadline: string
  mathematicalBreakdown: string
  practiceInstructions: string
}

export type LongitudinalSessionPoint = {
  sessionIndex: number
  dateLabel: string
  songId: string
  songTitle: string
  instrument: 'piano' | 'guitar'
  accuracyPct: number
  avgLatencyMs: number
  voicingPct: number
  tempoBpm: number
  cusumEvent?: {
    type: 'habit_formed' | 'breakthrough_locked'
    label: string
    detail: string
  }
}

export type PeerLeaderboardEntry = {
  rank: number
  performerName: string
  handle: string
  isCurrentUser?: boolean
  instrument: 'piano' | 'guitar'
  songId: string
  songTitle: string
  tempoTier: '70%' | '100%' | '105%'
  tempoBpm: number
  alignmentScorePct: number
  meanOnsetDeltaMs: number
  voicingCompletenessPct: number
  bktMasteredCount: number
  verifiedTakesCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BAYESIAN KNOWLEDGE TRACING (BKT) — Mirrors src/lib/adaptive/knowledge_tracing.py
// ─────────────────────────────────────────────────────────────────────────────
const BKT_P_INIT = 0.20
const BKT_P_TRANSIT = 0.15
const BKT_P_SLIP = 0.08
const BKT_P_GUESS = 0.12
const BKT_MASTERY_THRESHOLD = 0.95

export function updateBktMastery(
  priorPKnown: number,
  isCleanObservation: boolean
): { pKnown: number; isMastered: boolean } {
  const pL = Math.max(0.001, Math.min(0.999, priorPKnown || BKT_P_INIT))
  let pLGivenObs: number

  if (isCleanObservation) {
    const num = pL * (1.0 - BKT_P_SLIP)
    const den = num + (1.0 - pL) * BKT_P_GUESS
    pLGivenObs = den > 0 ? num / den : pL
  } else {
    const num = pL * BKT_P_SLIP
    const den = num + (1.0 - pL) * (1.0 - BKT_P_GUESS)
    pLGivenObs = den > 0 ? num / den : pL
  }

  const pNext = pLGivenObs + (1.0 - pLGivenObs) * BKT_P_TRANSIT
  const clamped = Number(Math.max(0.0, Math.min(1.0, pNext)).toFixed(4))
  return {
    pKnown: clamped,
    isMastered: clamped >= BKT_MASTERY_THRESHOLD,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUPERMEMO SM-2 SPACED REPETITION — Mirrors src/lib/adaptive/spaced_repetition.py
// ─────────────────────────────────────────────────────────────────────────────
export function metricsToSm2Quality(
  accuracyPct: number,
  absTimingErrorMs: number,
  voicingPct: number
): number {
  if (accuracyPct >= 95 && absTimingErrorMs <= 25 && voicingPct >= 95) return 5
  if (accuracyPct >= 85 && absTimingErrorMs <= 45 && voicingPct >= 80) return 4
  if (accuracyPct >= 70 && absTimingErrorMs <= 80 && voicingPct >= 65) return 3
  if (accuracyPct >= 55 && absTimingErrorMs <= 120) return 2
  if (accuracyPct >= 35) return 1
  return 0
}

export function updateSm2State(
  prevIntervalDays: number,
  prevEaseFactor: number,
  prevRepetitions: number,
  quality: number
): { intervalDays: number; easeFactor: number; repetitions: number } {
  const q = Math.max(0, Math.min(5, quality))
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  const nextEf = Number(Math.max(1.3, prevEaseFactor + efDelta).toFixed(3))

  if (q < 3) {
    return { intervalDays: 1, easeFactor: nextEf, repetitions: 0 }
  }

  const nextReps = prevRepetitions + 1
  let nextInterval: number
  if (nextReps === 1) nextInterval = 1
  else if (nextReps === 2) nextInterval = 6
  else nextInterval = Math.max(1, Math.round(prevIntervalDays * nextEf))

  return {
    intervalDays: nextInterval,
    easeFactor: nextEf,
    repetitions: nextReps,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. THOMPSON SAMPLING MULTI-ARMED BANDIT — Mirrors src/lib/adaptive/bandit.py
// ─────────────────────────────────────────────────────────────────────────────
const STRATEGY_DISPLAY_NAMES: Record<DrillStrategyArm, string> = {
  isolated_transition: '2-Chord Isolation Loop (70% Speed)',
  subdivision_click: 'Sixteenth-Note Subdivision Pulse',
  voicing_arpeggio: 'Bottom-Up Chord Tone Check',
  gradual_tempo_ramp: '4-Step Progressive Tempo Ramp',
}

export function selectOptimalDrillStrategy(
  state: TransitionMasteryState
): {
  strategy: DrillStrategyArm
  displayName: string
  expectedRewardPct: number
  alpha: number
  beta: number
} {
  const arms: DrillStrategyArm[] = [
    'isolated_transition',
    'subdivision_click',
    'voicing_arpeggio',
    'gradual_tempo_ramp',
  ]

  let bestArm: DrillStrategyArm = 'isolated_transition'
  let bestScore = -1
  let bestExpected = 0.5
  let bestAlpha = 2
  let bestBeta = 2

  for (const arm of arms) {
    const post = state.banditPosteriors[arm] || { alpha: 1, beta: 1 }
    const meanReward = post.alpha / (post.alpha + post.beta)
    // Deterministic posterior upper-confidence quantile (Thompson / UCB hybrid)
    const variance =
      (post.alpha * post.beta) /
      (Math.pow(post.alpha + post.beta, 2) * (post.alpha + post.beta + 1))
    const explorationBonus = 1.25 * Math.sqrt(variance)

    // Contextual boost based on primary acoustic fault
    let contextBoost = 0
    if (arm === 'voicing_arpeggio' && state.frequentlyMissedNote) contextBoost = 0.14
    if (arm === 'isolated_transition' && state.ewmaLatencyMs >= 100) contextBoost = 0.12
    if (arm === 'subdivision_click' && state.ewmaLatencyMs >= 45 && state.ewmaLatencyMs < 100) {
      contextBoost = 0.08
    }
    if (arm === 'gradual_tempo_ramp' && state.pKnown >= 0.72) contextBoost = 0.15

    const totalArmScore = meanReward + explorationBonus + contextBoost
    if (totalArmScore > bestScore) {
      bestScore = totalArmScore
      bestArm = arm
      bestExpected = meanReward
      bestAlpha = post.alpha
      bestBeta = post.beta
    }
  }

  return {
    strategy: bestArm,
    displayName: STRATEGY_DISPLAY_NAMES[bestArm],
    expectedRewardPct: Math.round(bestExpected * 100),
    alpha: Number(bestAlpha.toFixed(1)),
    beta: Number(bestBeta.toFixed(1)),
  }
}

export function rankAdaptiveRecommendations(
  transitions: TransitionMasteryState[]
): AdaptiveExerciseRecommendation[] {
  const scored = transitions.map((t) => {
    const learningGap = 1.0 - t.pKnown
    const overdueRatio = Math.min(2.0, t.daysSinceLastPractice / Math.max(1, t.sm2IntervalDays))
    const latencySeverity = Math.min(1.0, Math.abs(t.ewmaLatencyMs) / 160)
    const voicingDeficit = (100 - t.voicingCompletenessPct) / 100

    // Composite priority score combining BKT gap (45%), SM-2 urgency (25%), and EWMA fault severity (30%)
    const priorityScore = Number(
      (learningGap * 45 + overdueRatio * 12.5 + (latencySeverity * 0.65 + voicingDeficit * 0.35) * 30).toFixed(1)
    )

    const bandit = selectOptimalDrillStrategy(t)
    const isoBpm = Math.max(40, Math.round(t.targetSongBpm * 0.7))
    const stepBpm = Math.max(46, Math.round(t.targetSongBpm * 0.85))
    const overBpm = Math.min(220, Math.round(t.targetSongBpm * 1.05))

    const sm2UrgencyLabel =
      t.dueStatus === 'overdue'
        ? `Overdue (${t.daysSinceLastPractice}d elapsed / ${t.sm2IntervalDays}d interval)`
        : t.dueStatus === 'due_today'
        ? `Due Today (${t.sm2IntervalDays}d interval)`
        : `Scheduled in ${Math.max(1, t.sm2IntervalDays - t.daysSinceLastPractice)}d`

    const rationaleHeadline = t.frequentlyMissedNote
      ? `${t.transitionLabel} averages +${Math.round(t.ewmaLatencyMs)}ms lag and drops ${t.frequentlyMissedNote}`
      : `${t.transitionLabel} lags by +${Math.round(t.ewmaLatencyMs)}ms across ${t.observationsCount} recorded takes`

    const mathematicalBreakdown = `BKT Mastery P(L_t) = ${(t.pKnown * 100).toFixed(1)}% (Gap ${(learningGap * 100).toFixed(1)}%) · SM-2 EF ${t.sm2EaseFactor.toFixed(2)} (${sm2UrgencyLabel}) · Bandit Beta(α=${bandit.alpha}, β=${bandit.beta}) E[R]=${bandit.expectedRewardPct}%`

    const practiceInstructions =
      bandit.strategy === 'voicing_arpeggio'
        ? `Loop ${t.fromChord} → ${t.toChord} at ${isoBpm} BPM. Play each note of ${t.toChord} one by one first to make sure ${t.frequentlyMissedNote || 'the 3rd'} rings clearly before playing the full chord.`
        : bandit.strategy === 'isolated_transition'
        ? `Isolate the 2-bar change ${t.fromChord} ↔ ${t.toChord} at ${isoBpm} BPM (70% speed). Lift and pre-shape your fingers on beat 4 so you land on beat 1 without hesitating.`
        : bandit.strategy === 'subdivision_click'
        ? `Practice ${t.fromChord} → ${t.toChord} at ${stepBpm} BPM with subdivision clicks enabled to lock your right and left hands to the beat.`
        : `Step ${t.fromChord} → ${t.toChord} through ${isoBpm} → ${stepBpm} → ${t.targetSongBpm} → ${overBpm} BPM to consolidate muscle memory.`

    return {
      id: `rec_${t.id}`,
      rank: 0,
      transitionLabel: t.transitionLabel,
      fromChord: t.fromChord,
      toChord: t.toChord,
      songId: t.songId,
      songTitle: t.songTitle,
      instrument: t.instrument,
      priorityScore,
      bktMasteryPct: Number((t.pKnown * 100).toFixed(1)),
      learningGapPct: Number((learningGap * 100).toFixed(1)),
      sm2UrgencyLabel,
      sm2EaseFactor: t.sm2EaseFactor,
      ewmaLatencyMs: Math.round(t.ewmaLatencyMs),
      voicingCompletenessPct: Math.round(t.voicingCompletenessPct),
      selectedDrillStrategy: bandit.strategy,
      strategyDisplayName: bandit.displayName,
      banditExpectedRewardPct: bandit.expectedRewardPct,
      banditAlpha: bandit.alpha,
      banditBeta: bandit.beta,
      recommendedBpm: isoBpm,
      targetSongBpm: t.targetSongBpm,
      tempoRampStages: {
        isolationBpm: isoBpm,
        stepBpm,
        targetBpm: t.targetSongBpm,
        overSpeedBpm: overBpm,
      },
      rationaleHeadline,
      mathematicalBreakdown,
      practiceInstructions,
    }
  })

  scored.sort((a, b) => b.priorityScore - a.priorityScore)
  return scored.map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INITIAL LONGITUDINAL TRANSITIONS, SESSIONS & PEER BENCHMARK DATA
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_TRANSITION_MASTERY: TransitionMasteryState[] = [
  {
    id: 'tr_am_c',
    transitionLabel: 'Am → C',
    fromChord: 'Am',
    toChord: 'C',
    songId: 'ex_guitar_rising_sun',
    songTitle: 'House of the Rising Sun',
    instrument: 'guitar',
    pKnown: 0.34,
    isMastered: false,
    observationsCount: 7,
    ewmaLatencyMs: 142,
    voicingCompletenessPct: 75,
    frequentlyMissedNote: 'E3 (Major 3rd)',
    sm2IntervalDays: 1,
    sm2EaseFactor: 1.76,
    sm2Repetitions: 1,
    daysSinceLastPractice: 2,
    dueStatus: 'overdue',
    recommendedBpm: 53,
    targetSongBpm: 76,
    banditPosteriors: {
      isolated_transition: { alpha: 6.4, beta: 1.8 },
      subdivision_click: { alpha: 3.1, beta: 2.4 },
      voicing_arpeggio: { alpha: 5.8, beta: 1.6 },
      gradual_tempo_ramp: { alpha: 2.5, beta: 2.2 },
    },
  },
  {
    id: 'tr_cm_g7',
    transitionLabel: 'Cm → G7',
    fromChord: 'Cm',
    toChord: 'G7',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    instrument: 'piano',
    pKnown: 0.46,
    isMastered: false,
    observationsCount: 6,
    ewmaLatencyMs: 118,
    voicingCompletenessPct: 82,
    frequentlyMissedNote: 'B3 (Leading Tone)',
    sm2IntervalDays: 1,
    sm2EaseFactor: 1.92,
    sm2Repetitions: 1,
    daysSinceLastPractice: 1,
    dueStatus: 'due_today',
    recommendedBpm: 59,
    targetSongBpm: 84,
    banditPosteriors: {
      isolated_transition: { alpha: 5.2, beta: 1.9 },
      subdivision_click: { alpha: 3.8, beta: 2.1 },
      voicing_arpeggio: { alpha: 6.1, beta: 1.5 },
      gradual_tempo_ramp: { alpha: 3.0, beta: 2.0 },
    },
  },
  {
    id: 'tr_f#m_bm',
    transitionLabel: 'F#m → Bm',
    fromChord: 'F#m',
    toChord: 'Bm',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    instrument: 'piano',
    pKnown: 0.58,
    isMastered: false,
    observationsCount: 5,
    ewmaLatencyMs: 84,
    voicingCompletenessPct: 90,
    frequentlyMissedNote: null,
    sm2IntervalDays: 2,
    sm2EaseFactor: 2.14,
    sm2Repetitions: 2,
    daysSinceLastPractice: 2,
    dueStatus: 'due_today',
    recommendedBpm: 50,
    targetSongBpm: 72,
    banditPosteriors: {
      isolated_transition: { alpha: 4.9, beta: 1.7 },
      subdivision_click: { alpha: 5.5, beta: 1.6 },
      voicing_arpeggio: { alpha: 2.8, beta: 2.1 },
      gradual_tempo_ramp: { alpha: 4.2, beta: 1.8 },
    },
  },
  {
    id: 'tr_c_d_barre',
    transitionLabel: 'C → D',
    fromChord: 'C',
    toChord: 'D',
    songId: 'ex_guitar_knockin',
    songTitle: "Knockin' Cadence",
    instrument: 'guitar',
    pKnown: 0.78,
    isMastered: false,
    observationsCount: 9,
    ewmaLatencyMs: 36,
    voicingCompletenessPct: 94,
    frequentlyMissedNote: null,
    sm2IntervalDays: 4,
    sm2EaseFactor: 2.38,
    sm2Repetitions: 3,
    daysSinceLastPractice: 3,
    dueStatus: 'scheduled',
    recommendedBpm: 48,
    targetSongBpm: 68,
    banditPosteriors: {
      isolated_transition: { alpha: 4.1, beta: 1.9 },
      subdivision_click: { alpha: 4.4, beta: 1.8 },
      voicing_arpeggio: { alpha: 3.2, beta: 2.0 },
      gradual_tempo_ramp: { alpha: 6.3, beta: 1.4 },
    },
  },
  {
    id: 'tr_g_d',
    transitionLabel: 'G → D',
    fromChord: 'G',
    toChord: 'D',
    songId: 'ex_guitar_knockin',
    songTitle: "Knockin' Cadence",
    instrument: 'guitar',
    pKnown: 0.96,
    isMastered: true,
    observationsCount: 12,
    ewmaLatencyMs: 11,
    voicingCompletenessPct: 99,
    frequentlyMissedNote: null,
    sm2IntervalDays: 14,
    sm2EaseFactor: 2.68,
    sm2Repetitions: 5,
    daysSinceLastPractice: 4,
    dueStatus: 'scheduled',
    recommendedBpm: 48,
    targetSongBpm: 68,
    banditPosteriors: {
      isolated_transition: { alpha: 5.0, beta: 1.5 },
      subdivision_click: { alpha: 4.8, beta: 1.5 },
      voicing_arpeggio: { alpha: 4.2, beta: 1.6 },
      gradual_tempo_ramp: { alpha: 7.1, beta: 1.2 },
    },
  },
  {
    id: 'tr_d_a',
    transitionLabel: 'D → A',
    fromChord: 'D',
    toChord: 'A',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    instrument: 'piano',
    pKnown: 0.97,
    isMastered: true,
    observationsCount: 11,
    ewmaLatencyMs: 9,
    voicingCompletenessPct: 100,
    frequentlyMissedNote: null,
    sm2IntervalDays: 16,
    sm2EaseFactor: 2.74,
    sm2Repetitions: 5,
    daysSinceLastPractice: 3,
    dueStatus: 'scheduled',
    recommendedBpm: 50,
    targetSongBpm: 72,
    banditPosteriors: {
      isolated_transition: { alpha: 5.4, beta: 1.4 },
      subdivision_click: { alpha: 5.1, beta: 1.4 },
      voicing_arpeggio: { alpha: 4.5, beta: 1.6 },
      gradual_tempo_ramp: { alpha: 7.4, beta: 1.1 },
    },
  },
]

export const INITIAL_SESSION_HISTORY: LongitudinalSessionPoint[] = [
  {
    sessionIndex: 1,
    dateLabel: 'Oct 18',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    instrument: 'piano',
    accuracyPct: 71.4,
    avgLatencyMs: 168,
    voicingPct: 74,
    tempoBpm: 66,
  },
  {
    sessionIndex: 2,
    dateLabel: 'Oct 20',
    songId: 'ex_guitar_rising_sun',
    songTitle: 'House of the Rising Sun',
    instrument: 'guitar',
    accuracyPct: 74.2,
    avgLatencyMs: 156,
    voicingPct: 76,
    tempoBpm: 68,
  },
  {
    sessionIndex: 3,
    dateLabel: 'Oct 22',
    songId: 'ex_guitar_rising_sun',
    songTitle: 'House of the Rising Sun',
    instrument: 'guitar',
    accuracyPct: 73.8,
    avgLatencyMs: 162,
    voicingPct: 75,
    tempoBpm: 70,
    cusumEvent: {
      type: 'habit_formed',
      label: 'CUSUM Alert: Am → C Lag',
      detail: 'Page’s CUSUM S+ crossed h=3.5 threshold (+162ms lag on Am → C).',
    },
  },
  {
    sessionIndex: 4,
    dateLabel: 'Oct 24',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    instrument: 'piano',
    accuracyPct: 79.5,
    avgLatencyMs: 124,
    voicingPct: 83,
    tempoBpm: 68,
  },
  {
    sessionIndex: 5,
    dateLabel: 'Oct 26',
    songId: 'ex_guitar_knockin',
    songTitle: "Knockin' Cadence",
    instrument: 'guitar',
    accuracyPct: 83.1,
    avgLatencyMs: 96,
    voicingPct: 86,
    tempoBpm: 68,
  },
  {
    sessionIndex: 6,
    dateLabel: 'Oct 28',
    songId: 'ex_guitar_knockin',
    songTitle: "Knockin' Cadence",
    instrument: 'guitar',
    accuracyPct: 88.4,
    avgLatencyMs: 54,
    voicingPct: 91,
    tempoBpm: 68,
    cusumEvent: {
      type: 'breakthrough_locked',
      label: 'CUSUM Breakthrough: G → D Locked',
      detail: 'Negative CUSUM S- confirmed a -68ms latency drop after 2-chord isolation loop.',
    },
  },
  {
    sessionIndex: 7,
    dateLabel: 'Oct 30',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    instrument: 'piano',
    accuracyPct: 86.2,
    avgLatencyMs: 68,
    voicingPct: 89,
    tempoBpm: 76,
  },
  {
    sessionIndex: 8,
    dateLabel: 'Nov 01',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    instrument: 'piano',
    accuracyPct: 90.8,
    avgLatencyMs: 38,
    voicingPct: 94,
    tempoBpm: 72,
  },
  {
    sessionIndex: 9,
    dateLabel: 'Nov 02',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    instrument: 'piano',
    accuracyPct: 92.4,
    avgLatencyMs: 28,
    voicingPct: 95,
    tempoBpm: 84,
    cusumEvent: {
      type: 'breakthrough_locked',
      label: 'BKT Mastery: D → A (P = 0.97)',
      detail: 'Reached 97% BKT mastery probability; SM-2 interval extended to 16 days.',
    },
  },
]

export const PEER_LEADERBOARD_ENTRIES: PeerLeaderboardEntry[] = [
  {
    rank: 1,
    performerName: 'Clara V.',
    handle: '@clarav_keys',
    instrument: 'piano',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    tempoTier: '105%',
    tempoBpm: 88,
    alignmentScorePct: 98.6,
    meanOnsetDeltaMs: 4.8,
    voicingCompletenessPct: 99.4,
    bktMasteredCount: 14,
    verifiedTakesCount: 42,
  },
  {
    rank: 2,
    performerName: 'Mateo R.',
    handle: '@mateo_acoustic',
    instrument: 'guitar',
    songId: 'ex_guitar_rising_sun',
    songTitle: 'House of the Rising Sun',
    tempoTier: '100%',
    tempoBpm: 76,
    alignmentScorePct: 97.2,
    meanOnsetDeltaMs: 7.1,
    voicingCompletenessPct: 98.0,
    bktMasteredCount: 12,
    verifiedTakesCount: 38,
  },
  {
    rank: 3,
    performerName: 'Sora T.',
    handle: '@sora_nocturne',
    instrument: 'piano',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    tempoTier: '100%',
    tempoBpm: 72,
    alignmentScorePct: 95.8,
    meanOnsetDeltaMs: 9.4,
    voicingCompletenessPct: 97.2,
    bktMasteredCount: 11,
    verifiedTakesCount: 31,
  },
  {
    rank: 4,
    performerName: 'You (Current Session Profile)',
    handle: '@you_sonus',
    isCurrentUser: true,
    instrument: 'piano',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    tempoTier: '100%',
    tempoBpm: 84,
    alignmentScorePct: 92.4,
    meanOnsetDeltaMs: 28.0,
    voicingCompletenessPct: 95.0,
    bktMasteredCount: 8,
    verifiedTakesCount: 19,
  },
  {
    rank: 5,
    performerName: 'Julian K.',
    handle: '@julian_fretwork',
    instrument: 'guitar',
    songId: 'ex_guitar_knockin',
    songTitle: "Knockin' Cadence",
    tempoTier: '100%',
    tempoBpm: 68,
    alignmentScorePct: 90.1,
    meanOnsetDeltaMs: 32.5,
    voicingCompletenessPct: 92.8,
    bktMasteredCount: 7,
    verifiedTakesCount: 24,
  },
  {
    rank: 6,
    performerName: 'Elena M.',
    handle: '@elena_conservatory',
    instrument: 'piano',
    songId: 'ex_piano_shostakovich_waltz_2',
    songTitle: 'Waltz No. 2 in C Minor',
    tempoTier: '70%',
    tempoBpm: 59,
    alignmentScorePct: 88.7,
    meanOnsetDeltaMs: 39.2,
    voicingCompletenessPct: 91.0,
    bktMasteredCount: 6,
    verifiedTakesCount: 16,
  },
  {
    rank: 7,
    performerName: 'Devon H.',
    handle: '@devon_sixstring',
    instrument: 'guitar',
    songId: 'ex_guitar_rising_sun',
    songTitle: 'House of the Rising Sun',
    tempoTier: '70%',
    tempoBpm: 53,
    alignmentScorePct: 85.4,
    meanOnsetDeltaMs: 48.6,
    voicingCompletenessPct: 88.5,
    bktMasteredCount: 5,
    verifiedTakesCount: 14,
  },
  {
    rank: 8,
    performerName: 'Nadia P.',
    handle: '@nadia_chords',
    instrument: 'piano',
    songId: 'ex_piano_canon',
    songTitle: "Pachelbel's Canon Harmonic Flow",
    tempoTier: '100%',
    tempoBpm: 72,
    alignmentScorePct: 82.9,
    meanOnsetDeltaMs: 56.0,
    voicingCompletenessPct: 85.2,
    bktMasteredCount: 4,
    verifiedTakesCount: 11,
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// 5. BACKEND ADAPTER: Map Live DB Sessions to Longitudinal State
// ─────────────────────────────────────────────────────────────────────────────
export type BackendSessionItem = {
  id: string
  exercise_id: string
  exercise_title: string
  instrument: string
  tempo_bpm: number
  state: string
  overall_accuracy?: number | null
  avg_timing_error_ms?: number | null
  voicing_score?: number | null
  created_at?: string | null
}

export function mapBackendSessionsToLongitudinal(
  sessions: BackendSessionItem[]
): LongitudinalSessionPoint[] {
  if (!sessions || sessions.length === 0) {
    return []
  }

  // Filter completed sessions with metrics and sort chronologically (oldest to newest)
  const completed = sessions
    .filter((s) => s.state === 'completed' || s.overall_accuracy !== null)
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return ta - tb
    })

  if (completed.length === 0) {
    return []
  }

  return completed.map((s, idx) => {
    const rawAcc = s.overall_accuracy ?? 85.0
    const acc = rawAcc <= 1.0 ? rawAcc * 100 : rawAcc
    const lat = Math.round(Math.abs(s.avg_timing_error_ms ?? 24.0))
    const rawVox = s.voicing_score ?? 90.0
    const vox = rawVox <= 1.0 ? Math.round(rawVox * 100) : Math.round(rawVox)
    const inst = (s.instrument === 'guitar' ? 'guitar' : 'piano') as 'piano' | 'guitar'

    let dateLabel = `Take ${idx + 1}`
    if (s.created_at) {
      try {
        const d = new Date(s.created_at)
        dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } catch {
        dateLabel = `Take ${idx + 1}`
      }
    }

    return {
      sessionIndex: idx + 1,
      dateLabel,
      songId: s.exercise_id,
      songTitle: s.exercise_title || 'Practice Session',
      instrument: inst,
      accuracyPct: Number(acc.toFixed(1)),
      avgLatencyMs: lat,
      voicingPct: vox,
      tempoBpm: s.tempo_bpm || 76,
      cusumEvent:
        acc >= 94
          ? {
              type: 'breakthrough_locked',
              label: 'Verified Clean Take',
              detail: `Aligned at ${acc.toFixed(1)}% accuracy with ±${lat}ms timing offset.`,
            }
          : undefined,
    }
  })
}

export type BackendHabitItem = {
  id: string
  pattern_type: string
  trigger_context: string
  evidence_count: number
  status: string
  severity?: number
  confidence?: number
}

export function mapBackendHabitsToTransitions(
  habits: BackendHabitItem[],
  exercises: Array<{ id: string; title: string; instrument: string; tempo_bpm?: number }> = []
): TransitionMasteryState[] {
  if (!habits || habits.length === 0) return []

  const results: TransitionMasteryState[] = []
  const seenTransitions = new Set<string>()

  for (const h of habits) {
    if (h.trigger_context && h.trigger_context.includes(' -> ')) {
      const parts = h.trigger_context.split(' -> ').map((s) => s.trim())
      const fromChord = parts[0]
      const toChord = parts[1]
      const key = fromChord + '_' + toChord
      if (seenTransitions.has(key)) continue
      seenTransitions.add(key)

      const matchingEx = exercises.find((e) =>
        e.title.toLowerCase().includes(fromChord.toLowerCase()) ||
        (fromChord === 'Am' && e.id.includes('rising_sun')) ||
        (fromChord === 'G' && e.id.includes('knockin')) ||
        (fromChord === 'Cm' && e.id.includes('waltz'))
      ) || exercises[0] || {
        id: 'ex_guitar_knockin',
        title: "Knockin' Cadence",
        instrument: 'guitar',
        tempo_bpm: 70,
      }

      const pKnown = Math.max(0.25, Math.min(0.9, 0.85 - (h.evidence_count * 0.04)))
      const latMs = Math.min(180, 50 + h.evidence_count * 10)
      const isMastered = pKnown >= 0.95
      const dueStatus: 'overdue' | 'due_today' | 'scheduled' =
        h.status === 'active' ? 'overdue' : h.status === 'emerging' ? 'due_today' : 'scheduled'

      results.push({
        id: h.id,
        transitionLabel: fromChord + " → " + toChord,
        fromChord,
        toChord,
        songId: matchingEx.id,
        songTitle: matchingEx.title,
        instrument: matchingEx.instrument.toLowerCase() === 'guitar' ? 'guitar' : 'piano',
        pKnown: Number(pKnown.toFixed(2)),
        isMastered,
        observationsCount: Math.max(1, h.evidence_count),
        ewmaLatencyMs: latMs,
        voicingCompletenessPct: 88,
        frequentlyMissedNote: null,
        sm2IntervalDays: h.status === 'active' ? 1 : 2,
        sm2EaseFactor: 2.3,
        sm2Repetitions: Math.max(1, Math.round(h.evidence_count / 3)),
        daysSinceLastPractice: 0,
        dueStatus,
        recommendedBpm: Math.max(40, Math.round((matchingEx.tempo_bpm || 76) * 0.7)),
        targetSongBpm: matchingEx.tempo_bpm || 76,
        banditPosteriors: {
          isolated_transition: { alpha: 5.5, beta: 1.5 },
          subdivision_click: { alpha: 4.8, beta: 2.0 },
          voicing_arpeggio: { alpha: 5.0, beta: 1.8 },
          gradual_tempo_ramp: { alpha: 6.2, beta: 1.2 },
        },
      })
    }
  }

  return results
}
