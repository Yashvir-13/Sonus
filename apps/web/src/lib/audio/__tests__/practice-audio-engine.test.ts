import { describe, it, expect, beforeEach } from 'vitest'
import { PracticeAudioEngine } from '../practice-audio-engine'

describe('PracticeAudioEngine', () => {
  let engine: PracticeAudioEngine

  beforeEach(() => {
    engine = new PracticeAudioEngine()
  })

  it('instantiates cleanly and exposes interface methods', () => {
    expect(engine).toBeDefined()
    expect(typeof engine.unlock).toBe('function')
    expect(typeof engine.playClick).toBe('function')
    expect(typeof engine.playChord).toBe('function')
    expect(typeof engine.dispose).toBe('function')
  })

  it('runs playClick and playChord without throwing in test environment', () => {
    expect(() => engine.playClick(true)).not.toThrow()
    expect(() => engine.playClick(false)).not.toThrow()
    expect(() => engine.playChord('G')).not.toThrow()
    expect(() => engine.playChord('D', [50, 57, 62, 66])).not.toThrow()
    expect(() => engine.dispose()).not.toThrow()
  })
})
