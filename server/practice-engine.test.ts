import test from 'node:test'
import assert from 'node:assert/strict'
import {
  alignChordSequence,
  buildCoachingReport,
  detectHabitsFromMetrics,
  extractPlayedChordsFromWav,
  parseWavBuffer,
  updateBkt,
  updateSm2,
} from './practice-engine.ts'

function createTestWavBuffer(sampleRate: number, freqHzList: number[], durationSec: number): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)

  buf.write('RIFF', 0, 4, 'ascii')
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8, 4, 'ascii')
  buf.write('fmt ', 12, 4, 'ascii')
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36, 4, 'ascii')
  buf.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    let val = 0
    for (const f of freqHzList) {
      val += Math.sin(2 * Math.PI * f * t)
    }
    const sample = Math.max(-1, Math.min(1, (val / Math.max(1, freqHzList.length)) * 0.7))
    buf.writeInt16LE(Math.round(sample * 32767), 44 + i * 2)
  }
  return buf
}

test('alignChordSequence aligns matching chords and measures onset timing error', () => {
  const refs = [
    { name: 'G', beat: 1, duration_beats: 4, expected_pitches: [43, 47, 50, 55, 59, 67] },
    { name: 'D', beat: 5, duration_beats: 4, expected_pitches: [50, 57, 62, 66] },
    { name: 'Am', beat: 9, duration_beats: 4, expected_pitches: [45, 52, 57, 60, 64] },
  ]
  const played = [
    { chord: 'G', timestamp_sec: 0.0, pitches: [43, 47, 50, 55, 59, 67] },
    { chord: 'D', timestamp_sec: 2.02, pitches: [50, 57, 62, 66] },
    { chord: 'Am', timestamp_sec: 4.15, pitches: [45, 52, 57, 60, 64] },
  ]

  const metrics = alignChordSequence(played, refs, 120)
  assert.equal(metrics.length, 3)
  assert.equal(metrics[0].is_matched, true)
  assert.equal(metrics[0].onset_error_ms, 0)
  assert.equal(metrics[1].onset_error_ms, 20)
  assert.equal(metrics[2].onset_error_ms, 150)
  assert.equal(metrics[2].voicing_completeness, 1)
})

test('detectHabitsFromMetrics identifies transition lag and voicing drop', () => {
  const metrics = [
    {
      chord_index: 0,
      expected_chord: 'G',
      detected_chord: 'G',
      is_matched: true,
      onset_error_ms: 4,
      voicing_completeness: 1,
      missed_notes: [],
      extra_notes: [],
    },
    {
      chord_index: 1,
      expected_chord: 'D',
      detected_chord: 'D',
      is_matched: true,
      onset_error_ms: 140,
      voicing_completeness: 0.75,
      missed_notes: ['F#4'],
      extra_notes: [],
    },
  ]
  const habits = detectHabitsFromMetrics(metrics)
  assert.ok(habits.some((h) => h.pattern_type === 'transition_lag' && h.context === 'G -> D'))
  assert.ok(habits.some((h) => h.pattern_type === 'voicing_drop' && h.context === 'D:F#4'))

  const report = buildCoachingReport({
    sessionId: 'sess_unit_1',
    metrics,
    habits,
    instrument: 'guitar',
    tempoBpm: 70,
  })
  assert.ok(report.headline.includes('G -> D'))
  assert.ok(report.tailored_drills.length >= 1)
})

test('parseWavBuffer and extractPlayedChordsFromWav decode C major triad audio', () => {
  const wavBuf = createTestWavBuffer(22050, [261.63, 329.63, 392.0], 2.2)
  const parsed = parseWavBuffer(wavBuf)
  assert.equal(parsed.sampleRate, 22050)
  assert.equal(parsed.channels, 1)

  const refs = [{ name: 'C', beat: 1, duration_beats: 4, expected_pitches: [60, 64, 67] }]
  const extracted = extractPlayedChordsFromWav(parsed, refs, 120)
  assert.equal(extracted.length, 1)
  const pcs = (extracted[0].pitches ?? []).map((p) => p % 12)
  assert.ok(pcs.includes(0))
  assert.ok(pcs.includes(4))
  assert.ok(pcs.includes(7))
})

test('updateBkt and updateSm2 advance mastery and review intervals cleanly', () => {
  const bkt = updateBkt(0.2, true)
  assert.ok(bkt.pKnown > 0.5)
  assert.equal(bkt.isMastered, false)

  const sm2 = updateSm2(1, 2.5, 1, 5)
  assert.equal(sm2.intervalDays, 6)
  assert.equal(sm2.repetitions, 2)
})
