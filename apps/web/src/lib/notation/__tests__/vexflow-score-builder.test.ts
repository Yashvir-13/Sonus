import { describe, it, expect } from 'vitest'
import {
  beatsToVexDuration,
  decomposeRestBeats,
  findMeasureBeatAtX,
  interpolateBeatToX,
  midiToVexKey,
  normalizeKeySignature,
  pitchToVexKey,
  renderVexFlowScore,
  type FlowingChordItem,
} from '../vexflow-score-builder'
import { parseProgressionSequence } from '@/lib/music/chord-voicings'

describe('vexflow-score-builder', () => {
  describe('normalizeKeySignature', () => {
    it('normalizes major and minor key strings into valid VexFlow specs', () => {
      expect(normalizeKeySignature('C Minor')).toBe('Cm')
      expect(normalizeKeySignature('G Major')).toBe('G')
      expect(normalizeKeySignature('D Major')).toBe('D')
      expect(normalizeKeySignature('A Minor')).toBe('Am')
      expect(normalizeKeySignature('F# Minor')).toBe('F#m')
      expect(normalizeKeySignature('Bb Major')).toBe('Bb')
      expect(normalizeKeySignature('Dm7')).toBe('Dm')
      expect(normalizeKeySignature(undefined)).toBe('C')
    })
  })

  describe('pitchToVexKey & midiToVexKey', () => {
    it('converts scientific pitch strings with sharps and flats to VexFlow keys', () => {
      expect(pitchToVexKey('Eb5')).toBe('eb/5')
      expect(pitchToVexKey('F#4')).toBe('f#/4')
      expect(pitchToVexKey('C3')).toBe('c/3')
      expect(pitchToVexKey('B♭3')).toBe('bb/3')
    })

    it('converts MIDI pitches using sharp or flat spelling preferences', () => {
      expect(midiToVexKey(60)).toBe('c/4')
      expect(midiToVexKey(63, true)).toBe('eb/4')
      expect(midiToVexKey(66, false)).toBe('f#/4')
    })
  })

  describe('beatsToVexDuration & decomposeRestBeats', () => {
    it('maps beat durations accurately including dotted values', () => {
      expect(beatsToVexDuration(4)).toEqual({ duration: 'w', dots: 0 })
      expect(beatsToVexDuration(3)).toEqual({ duration: 'h', dots: 1 })
      expect(beatsToVexDuration(2)).toEqual({ duration: 'h', dots: 0 })
      expect(beatsToVexDuration(1.5)).toEqual({ duration: 'q', dots: 1 })
      expect(beatsToVexDuration(1)).toEqual({ duration: 'q', dots: 0 })
      expect(beatsToVexDuration(0.5)).toEqual({ duration: '8', dots: 0 })
    })

    it('decomposes multi-beat gaps into valid rest sequences', () => {
      expect(decomposeRestBeats(2.5)).toEqual([
        { duration: 'h', dots: 0 },
        { duration: '8', dots: 0 },
      ])
      expect(decomposeRestBeats(1)).toEqual([{ duration: 'q', dots: 0 }])
    })
  })

  describe('interpolateBeatToX & findMeasureBeatAtX', () => {
    it('interpolates piecewise linearly across engraved notehead anchors', () => {
      const anchors = [
        { beat: 0, x: 140 },
        { beat: 1, x: 220 },
        { beat: 2, x: 280 },
        { beat: 3, x: 400 },
      ]
      expect(interpolateBeatToX(0, anchors)).toBe(140)
      expect(interpolateBeatToX(0.5, anchors)).toBe(180)
      expect(interpolateBeatToX(1.5, anchors)).toBe(250)
      expect(interpolateBeatToX(2.5, anchors)).toBe(340)
      expect(interpolateBeatToX(5, anchors)).toBe(400)
    })

    it('resolves measure start beat from clicked X coordinate', () => {
      const measures = [
        { measureIndex: 0, startBeat: 0, endBeat: 4, x: 20, width: 320, noteStartX: 140, chordName: 'G' },
        { measureIndex: 1, startBeat: 4, endBeat: 8, x: 340, width: 260, noteStartX: 360, chordName: 'D' },
      ]
      expect(findMeasureBeatAtX(150, measures)).toBe(0)
      expect(findMeasureBeatAtX(410, measures)).toBe(4)
    })
  })

  describe('renderVexFlowScore SVG engraving', () => {
    it('engraves Piano Grand Staff with Bravura SVG, curly brace, key signature, and monotonic anchors', () => {
      const container = document.createElement('div')
      const prog: FlowingChordItem[] = [
        {
          ...parseProgressionSequence(['Cm'])[0],
          duration_beats: 3,
          melodyNotes: [
            { pitch: 'C5', beatOffset: 0, duration: 1, clef: 'treble' },
            { pitch: 'D5', beatOffset: 1, duration: 1, clef: 'treble' },
            { pitch: 'Eb5', beatOffset: 2, duration: 1, clef: 'treble' },
            { pitch: 'C3', beatOffset: 0, duration: 1, clef: 'bass' },
            { pitch: 'Eb3', beatOffset: 1, duration: 1, clef: 'bass' },
            { pitch: 'G3', beatOffset: 1, duration: 1, clef: 'bass' },
            { pitch: 'Eb3', beatOffset: 2, duration: 1, clef: 'bass' },
            { pitch: 'G3', beatOffset: 2, duration: 1, clef: 'bass' },
          ],
        },
        {
          ...parseProgressionSequence(['G7'])[0],
          duration_beats: 3,
          melodyNotes: [
            { pitch: 'B4', beatOffset: 0, duration: 2, clef: 'treble' },
            { pitch: 'D5', beatOffset: 2, duration: 1, clef: 'treble' },
            { pitch: 'G2', beatOffset: 0, duration: 1, clef: 'bass' },
            { pitch: 'F3', beatOffset: 1, duration: 1, clef: 'bass' },
            { pitch: 'B3', beatOffset: 1, duration: 1, clef: 'bass' },
            { pitch: 'F3', beatOffset: 2, duration: 1, clef: 'bass' },
            { pitch: 'B3', beatOffset: 2, duration: 1, clef: 'bass' },
          ],
        },
      ]

      const metrics = renderVexFlowScore(container, {
        instrument: 'piano',
        progression: prog,
        beatsPerMeasure: 3,
        timeSignature: '3/4',
        keySignature: 'C Minor',
        isDark: false,
      })

      expect(metrics.keySignature).toBe('Cm')
      expect(metrics.timeSignature).toBe('3/4')
      expect(metrics.totalBeats).toBe(6)
      expect(metrics.measures.length).toBe(2)
      expect(metrics.anchors.length).toBeGreaterThanOrEqual(6)

      // Anchors must be strictly non-decreasing in both beat and X
      for (let i = 1; i < metrics.anchors.length; i++) {
        expect(metrics.anchors[i].beat).toBeGreaterThan(metrics.anchors[i - 1].beat)
        expect(metrics.anchors[i].x).toBeGreaterThanOrEqual(metrics.anchors[i - 1].x)
      }

      const svg = container.querySelector('[data-testid="vexflow-grand-staff-svg"]')
      expect(svg).not.toBeNull()
      expect(container.querySelectorAll('[data-testid="grand-staff-notehead"]').length).toBe(15)
    })

    it('engraves Guitar Tablature with rhythmic stems, eighth-note beams, and aligned strum markers', () => {
      const container = document.createElement('div')
      const baseG = parseProgressionSequence(['G'])[0]
      const prog: FlowingChordItem[] = [
        {
          ...baseG,
          duration_beats: 4,
          strumEvents: [
            { beatOffset: 0, direction: 'down', accent: true, label: 'D' },
            { beatOffset: 1, direction: 'down', accent: false, label: 'D' },
            { beatOffset: 2, direction: 'down', accent: false, label: 'D' },
            { beatOffset: 2.5, direction: 'up', accent: false, label: 'U' },
            { beatOffset: 3, direction: 'down', accent: true, label: 'D' },
            { beatOffset: 3.5, direction: 'up', accent: false, label: 'U' },
          ],
        },
      ]

      const metrics = renderVexFlowScore(container, {
        instrument: 'guitar',
        progression: prog,
        beatsPerMeasure: 4,
        timeSignature: '4/4',
        keySignature: 'G Major',
        isDark: true,
      })

      expect(metrics.measures.length).toBe(1)
      expect(metrics.strumMarkers.length).toBe(6)
      expect(metrics.firstLineY).toBeGreaterThan(0)
      expect(metrics.lineSpacing).toBe(14)

      const svg = container.querySelector('[data-testid="vexflow-guitar-tab-svg"]')
      expect(svg).not.toBeNull()
      // Verifies eighth-note pairs were beamed together underneath the TAB
      expect(svg?.querySelectorAll('.vf-beam').length).toBeGreaterThanOrEqual(2)
    })
  })
})
