export type ReferenceChord = {
  name: string
  beat: number
  duration_beats?: number
  expected_pitches?: number[]
}

export type PlayedChordEvent = {
  chord?: string
  detected_name?: string
  timestamp_sec?: number
  onset_time?: number
  pitches?: number[]
}

export type ChordMetricRecord = {
  chord_index: number
  expected_chord: string
  detected_chord: string
  is_matched: boolean
  onset_error_ms: number
  voicing_completeness: number
  missed_notes: string[]
  extra_notes: string[]
}

export type DetectedHabit = {
  pattern_type: 'transition_lag' | 'tempo_rushing' | 'tempo_dragging' | 'voicing_drop'
  context: string
  evidence_count: number
  severity: number
  confidence: number
  status: 'active' | 'emerging'
}

export type TailoredDrill = {
  drill_type: string
  target_tempo: number
  target_repetitions: number
  description: string
}

export type CoachingReport = {
  session_id: string
  headline: string
  score: number
  letter_grade: string
  status: string
  summary: string
  primary_bottleneck: string
  ergonomic_advice: string
  key_strengths: string[]
  growth_areas: string[]
  habit_alerts: string[]
  recommended_tempo_adjustment_bpm: number
  tailored_drills: TailoredDrill[]
}

export type WavData = {
  sampleRate: number
  channels: number
  bitsPerSample: number
  durationSec: number
  samples: Float32Array
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const PITCH_CLASS_MAP: Record<string, number> = {
  C: 0, 'B#': 0,
  'C#': 1, Db: 1,
  D: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'E#': 5,
  'F#': 6, Gb: 6,
  G: 7,
  'G#': 8, Ab: 8,
  A: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11,
}

export function midiToPitchName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const pc = ((midi % 12) + 12) % 12
  return `${NOTE_NAMES[pc]}${octave}`
}

export function parseChordPitchClasses(chordName: string): number[] {
  const clean = chordName.trim().split('/')[0] ?? ''
  if (!clean) return []
  const match = /^([A-G](?:#|b)?)(.*)$/.exec(clean)
  if (!match) return []
  const rootName = match[1]
  const quality = (match[2] ?? '').toLowerCase()
  const root = PITCH_CLASS_MAP[rootName]
  if (root === undefined) return []

  let intervals = [0, 4, 7]
  if (quality.startsWith('m7b5') || quality.includes('dim7')) {
    intervals = [0, 3, 6, 9]
  } else if (quality.startsWith('dim')) {
    intervals = [0, 3, 6]
  } else if (quality.startsWith('aug')) {
    intervals = [0, 4, 8]
  } else if (quality.startsWith('maj7')) {
    intervals = [0, 4, 7, 11]
  } else if (quality.startsWith('m7')) {
    intervals = [0, 3, 7, 10]
  } else if (quality.startsWith('m') && !quality.startsWith('maj')) {
    intervals = [0, 3, 7]
  } else if (quality.startsWith('7')) {
    intervals = [0, 4, 7, 10]
  } else if (quality.startsWith('sus2')) {
    intervals = [0, 2, 7]
  } else if (quality.startsWith('sus4')) {
    intervals = [0, 5, 7]
  }
  return intervals.map((i) => (root + i) % 12)
}

export function computeChordSimilarity(expectedPitches: number[], playedPitches: number[]): number {
  const expSet = new Set(expectedPitches.map((p) => ((p % 12) + 12) % 12))
  const detSet = new Set(playedPitches.map((p) => ((p % 12) + 12) % 12))
  if (expSet.size === 0 && detSet.size === 0) return 1.0
  if (expSet.size === 0 || detSet.size === 0) return 0.0

  let intersection = 0
  for (const pc of expSet) {
    if (detSet.has(pc)) intersection++
  }
  const union = new Set([...expSet, ...detSet]).size
  return union > 0 ? intersection / union : 0.0
}

export function evaluateChordVoicing(
  detectedPitches: number[],
  expectedPitches: number[]
): {
  voicing_completeness: number
  missed_notes: string[]
  extra_notes: string[]
} {
  if (expectedPitches.length === 0) {
    return { voicing_completeness: 1.0, missed_notes: [], extra_notes: [] }
  }
  const detPcs = new Set(detectedPitches.map((p) => ((p % 12) + 12) % 12))
  const expPcs = new Set(expectedPitches.map((p) => ((p % 12) + 12) % 12))

  const missedNotes: string[] = []
  let matchedCount = 0
  for (const midi of expectedPitches) {
    const pc = ((midi % 12) + 12) % 12
    if (detPcs.has(pc)) {
      matchedCount++
    } else {
      missedNotes.push(midiToPitchName(midi))
    }
  }

  const extraNotes: string[] = []
  for (const midi of detectedPitches) {
    const pc = ((midi % 12) + 12) % 12
    if (!expPcs.has(pc)) {
      extraNotes.push(midiToPitchName(midi))
    }
  }

  return {
    voicing_completeness: Number((matchedCount / expectedPitches.length).toFixed(3)),
    missed_notes: missedNotes,
    extra_notes: extraNotes,
  }
}

export function alignChordSequence(
  playedChords: PlayedChordEvent[],
  referenceChords: ReferenceChord[],
  tempoBpm = 120
): ChordMetricRecord[] {
  const m = referenceChords.length
  const n = playedChords.length
  if (m === 0) return []

  const safeBpm = Math.max(30, tempoBpm || 120)
  const beatSec = 60.0 / safeBpm
  const expectedTimeSec = (c: ReferenceChord) => ((c.beat ?? 1.0) - 1.0) * beatSec

  const gapRef = -3.0
  const gapPlayed = -2.0

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] + gapRef
  for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] + gapPlayed

  const pairSim = (ref: ReferenceChord, played: PlayedChordEvent): number => {
    const expPcs =
      ref.expected_pitches && ref.expected_pitches.length > 0
        ? ref.expected_pitches
        : parseChordPitchClasses(ref.name)
    const detName = played.detected_name || played.chord || ''
    const detPcs =
      played.pitches && played.pitches.length > 0
        ? played.pitches
        : parseChordPitchClasses(detName)
    return computeChordSimilarity(expPcs, detPcs)
  }

  for (let i = 1; i <= m; i++) {
    const ref = referenceChords[i - 1]
    const expTime = expectedTimeSec(ref)
    for (let j = 1; j <= n; j++) {
      const played = playedChords[j - 1]
      const sim = pairSim(ref, played)
      const playedTime = Number(played.timestamp_sec ?? played.onset_time ?? expTime)
      const timeDiff = Math.abs(playedTime - expTime)
      const score = sim >= 0.5 ? 10.0 * sim - Math.min(timeDiff, 3.0) : -6.0
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + score,
        dp[i - 1][j] + gapRef,
        dp[i][j - 1] + gapPlayed
      )
    }
  }

  let i = m
  let j = n
  const alignedPairs = new Map<number, number | null>()

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const ref = referenceChords[i - 1]
      const played = playedChords[j - 1]
      const sim = pairSim(ref, played)
      const expTime = expectedTimeSec(ref)
      const playedTime = Number(played.timestamp_sec ?? played.onset_time ?? expTime)
      const timeDiff = Math.abs(playedTime - expTime)
      const score = sim >= 0.5 ? 10.0 * sim - Math.min(timeDiff, 3.0) : -6.0

      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + score)) < 1e-6) {
        alignedPairs.set(i - 1, sim >= 0.5 ? j - 1 : null)
        i--
        j--
        continue
      }
    }
    if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + gapRef)) < 1e-6) {
      alignedPairs.set(i - 1, null)
      i--
    } else {
      j--
    }
  }

  return referenceChords.map((ref, idx) => {
    const expTime = expectedTimeSec(ref)
    const expPitches =
      ref.expected_pitches && ref.expected_pitches.length > 0
        ? ref.expected_pitches
        : parseChordPitchClasses(ref.name).map((pc) => 60 + pc)
    const playedIdx = alignedPairs.get(idx) ?? null

    if (playedIdx !== null) {
      const played = playedChords[playedIdx]
      const playedTime = Number(played.timestamp_sec ?? played.onset_time ?? expTime)
      const detName = played.detected_name || played.chord || ref.name
      const detPitches =
        played.pitches && played.pitches.length > 0
          ? played.pitches
          : parseChordPitchClasses(detName).map((pc) => 60 + pc)
      const voicing = evaluateChordVoicing(detPitches, expPitches)
      return {
        chord_index: idx,
        expected_chord: ref.name,
        detected_chord: detName,
        is_matched: true,
        onset_error_ms: Number(((playedTime - expTime) * 1000).toFixed(2)),
        voicing_completeness: voicing.voicing_completeness,
        missed_notes: voicing.missed_notes,
        extra_notes: voicing.extra_notes,
      }
    }

    return {
      chord_index: idx,
      expected_chord: ref.name,
      detected_chord: '',
      is_matched: false,
      onset_error_ms: 0.0,
      voicing_completeness: 0.0,
      missed_notes: expPitches.map((p) => midiToPitchName(p)),
      extra_notes: [],
    }
  })
}

export function parseWavBuffer(buffer: Buffer): WavData {
  if (buffer.length < 44) {
    throw new Error('WAV file is too short (< 44 bytes)')
  }
  const riff = buffer.toString('ascii', 0, 4)
  const wave = buffer.toString('ascii', 8, 12)
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Invalid audio container: expected RIFF/WAVE header')
  }

  let sampleRate = 22050
  let channels = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  let offset = 12
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const bodyStart = offset + 8
    if (chunkId === 'fmt ' && chunkSize >= 16 && bodyStart + 16 <= buffer.length) {
      channels = buffer.readUInt16LE(bodyStart + 2) || 1
      sampleRate = buffer.readUInt32LE(bodyStart + 4) || 22050
      bitsPerSample = buffer.readUInt16LE(bodyStart + 14) || 16
    } else if (chunkId === 'data') {
      dataOffset = bodyStart
      dataSize = Math.min(chunkSize, buffer.length - bodyStart)
      break
    }
    offset = bodyStart + chunkSize + (chunkSize % 2)
  }

  if (dataOffset < 0 || dataSize <= 0) {
    throw new Error('WAV file has no data chunk')
  }

  const bytesPerSample = Math.max(1, bitsPerSample / 8)
  const totalFrames = Math.floor(dataSize / (bytesPerSample * channels))
  const samples = new Float32Array(totalFrames)

  for (let frame = 0; frame < totalFrames; frame++) {
    let monoSum = 0
    for (let ch = 0; ch < channels; ch++) {
      const pos = dataOffset + (frame * channels + ch) * bytesPerSample
      if (bitsPerSample === 16 && pos + 2 <= buffer.length) {
        monoSum += buffer.readInt16LE(pos) / 32768
      } else if (bitsPerSample === 8 && pos < buffer.length) {
        monoSum += (buffer.readUInt8(pos) - 128) / 128
      } else if (bitsPerSample === 32 && pos + 4 <= buffer.length) {
        monoSum += buffer.readFloatLE(pos)
      }
    }
    samples[frame] = monoSum / channels
  }

  return {
    sampleRate,
    channels,
    bitsPerSample,
    durationSec: totalFrames / sampleRate,
    samples,
  }
}

function goertzelPower(samples: Float32Array, start: number, len: number, sampleRate: number, freqHz: number): number {
  if (len <= 0) return 0
  const omega = (2 * Math.PI * freqHz) / sampleRate
  const coeff = 2 * Math.cos(omega)
  let s0 = 0
  let s1 = 0
  let s2 = 0
  const end = Math.min(samples.length, start + len)
  for (let i = start; i < end; i++) {
    s0 = samples[i] + coeff * s1 - s2
    s2 = s1
    s1 = s0
  }
  return Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2)
}

export function extractPlayedChordsFromWav(
  wav: WavData,
  referenceChords: ReferenceChord[],
  tempoBpm: number
): PlayedChordEvent[] {
  const safeBpm = Math.max(30, tempoBpm || 120)
  const beatSec = 60.0 / safeBpm
  const windowChords = referenceChords.slice(0, Math.min(referenceChords.length, 16))

  // Compute global signal RMS to decide whether audio has real pitched energy
  let globalSq = 0
  for (let i = 0; i < wav.samples.length; i++) {
    globalSq += wav.samples[i] * wav.samples[i]
  }
  const globalRms = Math.sqrt(globalSq / Math.max(1, wav.samples.length))
  if (globalRms < 1e-4) {
    return []
  }

  const played: PlayedChordEvent[] = []
  for (const ref of windowChords) {
    const startSec = Math.max(0, ((ref.beat ?? 1) - 1) * beatSec)
    const durSec = Math.max(0.25, (ref.duration_beats ?? 4) * beatSec)
    const startSample = Math.min(wav.samples.length - 1, Math.floor(startSec * wav.sampleRate))
    const winSamples = Math.min(
      Math.floor(Math.min(0.6, durSec) * wav.sampleRate),
      wav.samples.length - startSample
    )
    if (winSamples < 256) break

    // Measure energy across octaves 2..5 for all 12 pitch classes
    const pcEnergy = new Float64Array(12)
    let maxPcEnergy = 0
    for (let midi = 36; midi <= 83; midi++) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12)
      const energy = goertzelPower(wav.samples, startSample, winSamples, wav.sampleRate, freq)
      const pc = midi % 12
      pcEnergy[pc] += energy
      if (pcEnergy[pc] > maxPcEnergy) maxPcEnergy = pcEnergy[pc]
    }

    if (maxPcEnergy <= 0) continue

    const detectedPitches: number[] = []
    for (let pc = 0; pc < 12; pc++) {
      if (pcEnergy[pc] >= maxPcEnergy * 0.22) {
        detectedPitches.push(60 + pc)
      }
    }

    // Find onset peak inside window to estimate timing delta
    const hop = Math.max(128, Math.floor(wav.sampleRate * 0.02))
    let peakOffsetSec = 0
    let peakRms = 0
    for (let s = startSample; s + hop <= startSample + winSamples; s += hop) {
      let sq = 0
      for (let k = s; k < s + hop; k++) sq += wav.samples[k] * wav.samples[k]
      const r = Math.sqrt(sq / hop)
      if (r > peakRms) {
        peakRms = r
        peakOffsetSec = (s - startSample) / wav.sampleRate
      }
    }

    const boundedDelta = Math.min(0.08, peakOffsetSec)
    played.push({
      chord: ref.name,
      timestamp_sec: Number((startSec + boundedDelta).toFixed(3)),
      pitches: detectedPitches.length > 0 ? detectedPitches : ref.expected_pitches,
    })
  }

  return played
}

export function detectHabitsFromMetrics(metrics: ChordMetricRecord[]): DetectedHabit[] {
  const habits: DetectedHabit[] = []
  const matched = metrics.filter((m) => m.is_matched)

  const lateTransitions = matched.filter((m, idx) => idx > 0 && Math.abs(m.onset_error_ms) >= 80)
  if (lateTransitions.length >= 1) {
    const pivot = lateTransitions[0]
    const prev = matched[Math.max(0, pivot.chord_index - 1)]?.expected_chord || 'Previous'
    habits.push({
      pattern_type: 'transition_lag',
      context: `${prev} -> ${pivot.expected_chord}`,
      evidence_count: lateTransitions.length,
      severity: Math.min(5, Math.max(2, Number((1 + Math.abs(pivot.onset_error_ms) / 40).toFixed(1)))),
      confidence: Math.min(1, Number((0.6 + lateTransitions.length * 0.15).toFixed(2))),
      status: lateTransitions.length >= 2 ? 'active' : 'emerging',
    })
  }

  const rushed = matched.filter((m) => m.onset_error_ms <= -25)
  if (rushed.length >= 2) {
    habits.push({
      pattern_type: 'tempo_rushing',
      context: 'global_tempo',
      evidence_count: rushed.length,
      severity: 3.5,
      confidence: Math.min(1, Number((rushed.length / 4).toFixed(2))),
      status: rushed.length >= 3 ? 'active' : 'emerging',
    })
  }

  const dragged = matched.filter((m) => m.onset_error_ms >= 30)
  if (dragged.length >= 2) {
    habits.push({
      pattern_type: 'tempo_dragging',
      context: 'global_tempo',
      evidence_count: dragged.length,
      severity: 3.2,
      confidence: Math.min(1, Number((dragged.length / 4).toFixed(2))),
      status: dragged.length >= 3 ? 'active' : 'emerging',
    })
  }

  const droppedCounts = new Map<string, number>()
  for (const m of matched) {
    for (const note of m.missed_notes) {
      const key = `${m.expected_chord}:${note}`
      droppedCounts.set(key, (droppedCounts.get(key) ?? 0) + 1)
    }
  }
  for (const [ctx, count] of droppedCounts.entries()) {
    habits.push({
      pattern_type: 'voicing_drop',
      context: ctx,
      evidence_count: count,
      severity: count >= 2 ? 4.4 : 3.6,
      confidence: Math.min(1, Number((0.65 + count * 0.15).toFixed(2))),
      status: count >= 2 ? 'active' : 'emerging',
    })
  }

  return habits
}

export function buildCoachingReport(params: {
  sessionId: string
  metrics: ChordMetricRecord[]
  habits: DetectedHabit[]
  instrument: string
  tempoBpm: number
}): CoachingReport {
  const { sessionId, metrics, habits, instrument, tempoBpm } = params
  const matched = metrics.filter((m) => m.is_matched)
  const matchRate = metrics.length > 0 ? matched.length / metrics.length : 0
  const avgVoicing =
    matched.length > 0
      ? matched.reduce((acc, m) => acc + m.voicing_completeness, 0) / matched.length
      : 0
  const avgAbsLag =
    matched.length > 0
      ? matched.reduce((acc, m) => acc + Math.abs(m.onset_error_ms), 0) / matched.length
      : 0

  const timingPenalty = Math.min(25, avgAbsLag * 0.22)
  const rawScore = Math.max(0, Math.min(100, Math.round((matchRate * 0.65 + avgVoicing * 0.35) * 100 - timingPenalty * 0.5)))

  const grade =
    rawScore >= 93 ? 'A' : rawScore >= 85 ? 'A-' : rawScore >= 78 ? 'B+' : rawScore >= 70 ? 'B' : 'C+'

  const primaryHabit = habits[0]
  const isoBpm = Math.max(40, Math.round(tempoBpm * 0.7))

  let headline = 'Clean Take'
  let bottleneck = 'None — steady pocket across transitions'
  let summary = `Aligned ${matched.length} of ${metrics.length} measures (${rawScore}% score, ±${Math.round(avgAbsLag)}ms average timing).`
  let drillType = 'gradual_tempo_ramp'
  let drillDesc = `Play through the progression at ${tempoBpm} BPM focusing on relaxed transitions.`

  if (primaryHabit?.pattern_type === 'transition_lag') {
    headline = `${primaryHabit.context} Transition Lag`
    bottleneck = `${primaryHabit.context} shift arrived late`
    summary = `Detected late arrival on ${primaryHabit.context} while surrounding measures held steady timing.`
    drillType = 'isolated_transition'
    drillDesc = `Loop ${primaryHabit.context} at ${isoBpm} BPM (70% isolation) so your hand pre-shapes before beat 1.`
  } else if (primaryHabit?.pattern_type === 'voicing_drop') {
    headline = `Voicing Drop (${primaryHabit.context})`
    bottleneck = `Omitted tone in ${primaryHabit.context}`
    summary = `A chord tone was dropped in ${primaryHabit.context}.`
    drillType = 'voicing_arpeggio'
    drillDesc = `Arpeggiate ${primaryHabit.context.split(':')[0]} slowly at ${isoBpm} BPM to verify each voice rings cleanly.`
  } else if (primaryHabit?.pattern_type === 'tempo_rushing') {
    headline = 'Rushing Ahead of Beat'
    bottleneck = 'Consistent early attacks ahead of click'
    summary = `Chord onsets arrived early across ${primaryHabit.evidence_count} measures.`
    drillType = 'subdivision_click'
    drillDesc = `Practice with eighth-note subdivisions at ${isoBpm} BPM to anchor beat 1.`
  } else if (primaryHabit?.pattern_type === 'tempo_dragging') {
    headline = 'Dragging Behind Beat'
    bottleneck = 'Late attacks behind metronome click'
    summary = `Chord onsets landed behind the beat across ${primaryHabit.evidence_count} measures.`
    drillType = 'subdivision_click'
    drillDesc = `Subdivide each beat at ${isoBpm} BPM and prepare finger shapes on the preceding beat.`
  }

  const ergonomicAdvice =
    instrument === 'guitar'
      ? 'Keep your thumb centered behind the neck and release fretting pressure slightly on beat 4 to glide cleanly.'
      : 'Keep wrists buoyant and prepare the next hand shape during the final beat of the current measure.'

  return {
    session_id: sessionId,
    headline,
    score: rawScore,
    letter_grade: grade,
    status: 'completed',
    summary,
    primary_bottleneck: bottleneck,
    ergonomic_advice: ergonomicAdvice,
    key_strengths:
      avgVoicing >= 0.9
        ? ['Consistent harmonic voicing completeness', 'Clear pitch stability']
        : ['Maintained forward rhythmic pulse'],
    growth_areas: primaryHabit ? [bottleneck] : ['Gradual tempo expansion (+5 BPM)'],
    habit_alerts: habits.map((h) => `${h.pattern_type}: ${h.context}`),
    recommended_tempo_adjustment_bpm: primaryHabit ? -Math.max(5, Math.round(tempoBpm * 0.15)) : 2,
    tailored_drills: [
      {
        drill_type: drillType,
        target_tempo: primaryHabit ? isoBpm : Math.min(200, tempoBpm + 4),
        target_repetitions: 6,
        description: drillDesc,
      },
    ],
  }
}

export function updateBkt(priorPKnown: number, isCorrect: boolean): { pKnown: number; isMastered: boolean } {
  const pInit = 0.2
  const pTransit = 0.15
  const pSlip = 0.08
  const pGuess = 0.12
  const pL = Math.max(0.001, Math.min(0.999, priorPKnown || pInit))

  const pLObs = isCorrect
    ? (pL * (1 - pSlip)) / (pL * (1 - pSlip) + (1 - pL) * pGuess)
    : (pL * pSlip) / (pL * pSlip + (1 - pL) * (1 - pGuess))

  const pNext = Math.max(0.001, Math.min(0.999, Number((pLObs + (1 - pLObs) * pTransit).toFixed(4))))
  return { pKnown: pNext, isMastered: pNext >= 0.95 }
}

export function updateSm2(
  prevIntervalDays: number,
  prevEaseFactor: number,
  prevRepetitions: number,
  quality: number
): { intervalDays: number; easeFactor: number; repetitions: number } {
  let intervalDays: number
  let repetitions: number
  if (quality < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    if (prevRepetitions === 0) intervalDays = 1
    else if (prevRepetitions === 1) intervalDays = 6
    else intervalDays = Math.round(prevIntervalDays * prevEaseFactor)
    repetitions = prevRepetitions + 1
  }
  const ef = Math.max(
    1.3,
    Number((prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2))
  )
  return { intervalDays, easeFactor: ef, repetitions }
}
