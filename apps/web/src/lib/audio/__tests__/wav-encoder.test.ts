import { describe, it, expect } from 'vitest'
import { encodeMonoWav } from '../wav-encoder'

describe('encodeMonoWav', () => {
  it('creates valid 16-bit PCM WAV container', async () => {
    const samples = new Float32Array(44100) // 1 second of audio
    const blob = encodeMonoWav(samples, 44100)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 44100 * 2) // 44 header bytes + 2 bytes per sample

    const arrayBuffer = await blob.arrayBuffer()
    const view = new DataView(arrayBuffer)

    // Check RIFF header: "RIFF"
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    expect(riff).toBe('RIFF')

    // Check format: "WAVE"
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
    expect(wave).toBe('WAVE')

    // Check channels (1 = mono)
    expect(view.getUint16(22, true)).toBe(1)

    // Check sample rate (44100)
    expect(view.getUint32(24, true)).toBe(44100)

    // Check bits per sample (16)
    expect(view.getUint16(34, true)).toBe(16)
  })
})
