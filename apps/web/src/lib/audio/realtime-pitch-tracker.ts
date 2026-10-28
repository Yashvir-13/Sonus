import type { VoicingDefinition } from '../music/chord-voicings'

export type PitchDetectionResult = {
  detectedFreqHz: number | null
  detectedNote: string | null
  centsDeviation: number
  rmsDb: number
  voicingCompleteness: number // 0.0 to 1.0
  matchedPitchClasses: number[]
  missingPitchClasses: number[]
  timingDeltaMs: number
  isSoundDetected: boolean
  clarityScore: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export class RealtimePitchTracker {
  private readonly sampleRate: number
  private readonly minFreq: number
  private readonly maxFreq: number
  public noiseGateDb: number
  public clarityThreshold: number
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private animFrameId: number | null = null

  constructor(sampleRate = 44100, minFreq = 70, maxFreq = 1200, noiseGateDb = -34, clarityThreshold = 0.35) {
    this.sampleRate = sampleRate
    this.minFreq = minFreq
    this.maxFreq = maxFreq
    this.noiseGateDb = noiseGateDb
    this.clarityThreshold = clarityThreshold
  }

  /**
   * Starts a live microphone stream and continuously invokes onFrame with Float32Array time-domain data.
   */
  public async startMicrophoneStream(
    onFrame: (timeData: Float32Array) => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      this.mediaStream = stream
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      this.audioContext = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)
      const poll = () => {
        analyser.getFloatTimeDomainData(buffer)
        onFrame(buffer)
        this.animFrameId = requestAnimationFrame(poll)
      }
      this.animFrameId = requestAnimationFrame(poll)
    } catch (err) {
      onError?.(err)
    }
  }

  /**
   * Stops live microphone stream and cleans up Web Audio resources.
   */
  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }

  /**
   * Computes the RMS signal amplitude in decibels.
   */
  public computeRmsDb(timeData: Float32Array): number {
    let sumSquares = 0
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i]
    }
    const rms = Math.sqrt(sumSquares / timeData.length)
    if (rms < 1e-5) return -100
    return 20 * Math.log10(rms)
  }

  /**
   * Real-time fundamental pitch detection via normalized autocorrelation
   * with parabolic interpolation.
   */
  public detectPitch(
    timeData: Float32Array
  ): { freq: number; cents: number; note: string; clarity: number } | null {
    const rmsDb = this.computeRmsDb(timeData)
    // Strict noise gate: ambient room noise / unvoiced whisper rejected
    if (rmsDb < this.noiseGateDb) {
      return null
    }

    const maxLag = Math.floor(this.sampleRate / this.minFreq)
    const minLag = Math.floor(this.sampleRate / this.maxFreq)
    const bufferSize = timeData.length

    if (maxLag >= bufferSize) {
      return null
    }

    // Precompute cumulative squared energy for exact Pearson normalization
    const energy = new Float32Array(bufferSize + 1)
    for (let i = 0; i < bufferSize; i++) {
      energy[i + 1] = energy[i] + timeData[i] * timeData[i]
    }

    const corrs = new Float32Array(maxLag + 2)
    let globalMax = -1

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0
      const overlap = bufferSize - lag
      for (let i = 0; i < overlap; i++) {
        corr += timeData[i] * timeData[i + lag]
      }
      const e0 = energy[overlap]
      const e1 = energy[bufferSize] - energy[lag]
      const normFactor = Math.sqrt(e0 * e1)
      const normCorr = normFactor > 1e-6 ? corr / normFactor : 0
      corrs[lag] = normCorr
      if (normCorr > globalMax) {
        globalMax = normCorr
      }
    }

    // Harmonic clarity check: reject unvoiced murmur, breath, or room rumble
    if (globalMax < this.clarityThreshold) {
      return null
    }

    // Pick the FIRST local peak that is within 85% of the global peak
    // This prevents picking harmonic multiples (e.g. 5x period = octave drop)
    const threshold = globalMax * 0.85
    let bestLag = -1
    let maxCorr = -1

    for (let lag = minLag + 1; lag < maxLag; lag++) {
      if (corrs[lag] > corrs[lag - 1] && corrs[lag] >= corrs[lag + 1]) {
        if (corrs[lag] >= threshold) {
          bestLag = lag
          maxCorr = corrs[lag]
          break
        }
      }
    }

    if (bestLag === -1) {
      // Fallback to highest peak if no local peak satisfied threshold
      for (let lag = minLag; lag <= maxLag; lag++) {
        if (corrs[lag] === globalMax) {
          bestLag = lag
          maxCorr = corrs[lag]
          break
        }
      }
    }

    if (bestLag <= 0) {
      return null
    }

    // Parabolic interpolation around the peak lag
    let fineLag = bestLag
    if (bestLag > minLag && bestLag < maxLag) {
      let prevCorr = 0
      const prevOverlap = bufferSize - (bestLag - 1)
      for (let i = 0; i < prevOverlap; i++) {
        prevCorr += timeData[i] * timeData[i + (bestLag - 1)]
      }
      prevCorr /= prevOverlap

      let nextCorr = 0
      const nextOverlap = bufferSize - (bestLag + 1)
      for (let i = 0; i < nextOverlap; i++) {
        nextCorr += timeData[i] * timeData[i + (bestLag + 1)]
      }
      nextCorr /= nextOverlap

      const denom = 2 * (2 * maxCorr - prevCorr - nextCorr)
      if (Math.abs(denom) > 1e-9) {
        const delta = (nextCorr - prevCorr) / denom
        if (Math.abs(delta) < 1) {
          fineLag += delta
        }
      }
    }

    const freq = this.sampleRate / fineLag
    if (freq < this.minFreq || freq > this.maxFreq) {
      return null
    }

    // MIDI and Note conversion
    const midiFloat = 12 * Math.log2(freq / 440) + 69
    const midiRound = Math.round(midiFloat)
    const cents = Math.round((midiFloat - midiRound) * 100)

    const octave = Math.floor(midiRound / 12) - 1
    const noteIndex = ((midiRound % 12) + 12) % 12
    const note = `${NOTE_NAMES[noteIndex]}${octave}`

    return { freq, cents, note, clarity: globalMax }
  }

  /**
   * Compares detected live microphone audio against expected active chord voicings.
   */
  public evaluateChordMatch(
    timeData: Float32Array,
    expected: VoicingDefinition,
    targetTimestampMs: number,
    currentTimestampMs: number
  ): PitchDetectionResult {
    const pitch = this.detectPitch(timeData)
    const rmsDb = this.computeRmsDb(timeData)
    const timingDeltaMs = currentTimestampMs - targetTimestampMs

    if (!pitch) {
      return {
        detectedFreqHz: null,
        detectedNote: null,
        centsDeviation: 0,
        rmsDb,
        voicingCompleteness: 0,
        matchedPitchClasses: [],
        missingPitchClasses: expected.pitchClasses,
        timingDeltaMs: 0,
        isSoundDetected: false,
        clarityScore: 0,
      }
    }

    // Pitch class of the detected fundamental
    const detectedMidi = Math.round(12 * Math.log2(pitch.freq / 440) + 69)
    const detectedPc = ((detectedMidi % 12) + 12) % 12

    const matchedPitchClasses: number[] = []
    const missingPitchClasses: number[] = []

    for (const pc of expected.pitchClasses) {
      if (pc === detectedPc) {
        matchedPitchClasses.push(pc)
      } else {
        missingPitchClasses.push(pc)
      }
    }

    const voicingCompleteness =
      expected.pitchClasses.length > 0 ? matchedPitchClasses.length / expected.pitchClasses.length : 0

    return {
      detectedFreqHz: pitch.freq,
      detectedNote: pitch.note,
      centsDeviation: pitch.cents,
      rmsDb,
      voicingCompleteness,
      matchedPitchClasses,
      missingPitchClasses,
      timingDeltaMs,
      isSoundDetected: true,
      clarityScore: pitch.clarity,
    }
  }
}
