import { describe, it, expect } from 'vitest'
import { chromaToChord } from '../chord-detector'

describe('chromaToChord', () => {
  it('identifies C Major from pure C, E, G chroma energy', () => {
    // 12-semitone array: C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7...
    const vector = [1.0, 0, 0, 0, 0.9, 0, 0, 0.95, 0, 0, 0, 0]
    const result = chromaToChord(vector)
    expect(result.chord).toBe('C')
    expect(result.confidence).toBeGreaterThan(0.8)
    expect(result.bass).toBe('C')
  })

  it('identifies A minor 7th', () => {
    // A=9, C=0, E=4, G=7
    const vector = [0.9, 0, 0, 0, 0.85, 0, 0, 0.8, 0, 1.0, 0, 0]
    const result = chromaToChord(vector)
    expect(result.chord).toBe('Am7')
    expect(result.confidence).toBeGreaterThan(0.7)
    expect(result.bass).toBe('A')
  })

  it('handles low energy / silence gracefully', () => {
    const vector = [0.01, 0.02, 0, 0, 0, 0.01, 0, 0, 0, 0, 0, 0]
    const result = chromaToChord(vector)
    expect(result.chord).toBe('None')
    expect(result.confidence).toBeLessThan(0.3)
  })

  it('exports worklet processor code and name correctly', async () => {
    const { CHROMA_PROCESSOR_CODE, CHROMA_PROCESSOR_NAME } = await import('../chroma-processor')
    expect(CHROMA_PROCESSOR_NAME).toBe('chroma-audio-processor')
    expect(CHROMA_PROCESSOR_CODE).toContain('registerProcessor')
  })
})

