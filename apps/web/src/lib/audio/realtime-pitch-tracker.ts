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
  private sampleRate: number
  private readonly minFreq: number
  private readonly maxFreq: number
  public noiseGateDb: number
  public clarityThreshold: number
  public concertPitchHz: number
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private animFrameId: number | null = null
  private pitchHistory: number[] = []

  constructor(
    sampleRate = 44100,
    minFreq = 70,
    maxFreq = 1200,
    noiseGateDb = -34,
    clarityThreshold = 0.35,
    concertPitchHz = 440
  ) {
    this.sampleRate = sampleRate
    this.minFreq = minFreq
    this.maxFreq = maxFreq
    this.noiseGateDb = noiseGateDb
    this.clarityThreshold = clarityThreshold
    this.concertPitchHz = concertPitchHz
  }

  public getSampleRate(): number {
    return this.sampleRate
  }

  public setSampleRate(rate: number): void {
    if (rate > 0) {
      this.sampleRate = rate
    }
  }

  public clearPitchHistory(): void {
    this.pitchHistory = []
  }

  /**
   * Applies a rolling median filter over recent pitch estimates to suppress octave jumps and transient jitter.
   */
  public getSmoothedPitch(rawFreq: number, maxHistory = 5): number {
    if (rawFreq <= 0 || !Number.isFinite(rawFreq)) {
      return rawFreq
    }
    this.pitchHistory.push(rawFreq)
    if (this.pitchHistory.length > maxHistory) {
      this.pitchHistory.shift()
    }
    const sorted = this.pitchHistory.toSorted((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 !== 0) {
      return sorted[mid]!
    }
    const lower = sorted[mid - 1]!
    const upper = sorted[mid]!
    // If the two middle estimates are within 6% (same musical pitch), average them for smooth fine-tuning cents.
    // If they diverge (e.g. octave harmonic or glitch jump), select the median without synthesizing a phantom note.
    if (Math.abs(upper - lower) / lower <= 0.06) {
      return (lower + upper) / 2
    }
    return upper
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
      // Synchronize sampleRate with actual audio hardware context (e.g. 48000 Hz vs 44100 Hz)
      this.sampleRate = ctx.sampleRate
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
    this.clearPitchHistory()
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

    // Collect all local positive correlation peaks
    type LocalPeak = { lag: number; corr: number }
    const localPeaks: LocalPeak[] = []
    let globalPeakLag = -1
    let globalPeakVal = -1

    for (let lag = minLag + 1; lag < maxLag; lag++) {
      if (corrs[lag] > corrs[lag - 1] && corrs[lag] >= corrs[lag + 1] && corrs[lag] > 0) {
        localPeaks.push({ lag, corr: corrs[lag] })
        if (corrs[lag] > globalPeakVal) {
          globalPeakVal = corrs[lag]
          globalPeakLag = lag
        }
      }
    }

    if (localPeaks.length === 0 || globalPeakLag <= 0) {
      return null
    }

    // Fundamental selection with harmonic sub-multiple rejection:
    // A smaller lag L is only chosen if it is NOT a sub-multiple (harmonic) of a larger lag with
    // higher or equal correlation. If an integer multiple k*L (k=2,3,4) has a peak with higher
    // correlation than L, then L is a harmonic (e.g. 2nd or 3rd harmonic), NOT the fundamental.
    const threshold = globalPeakVal * 0.85
    let bestLag = globalPeakLag
    let maxCorr = globalPeakVal

    for (const p of localPeaks) {
      if (p.corr < threshold) continue

      let isHarmonic = false
      for (let k = 2; k <= 4; k++) {
        const multLag = Math.round(p.lag * k)
        if (multLag > maxLag) break

        for (const other of localPeaks) {
          if (Math.abs(other.lag - multLag) <= Math.max(2, Math.round(other.lag * 0.04))) {
            if (other.corr > p.corr + 0.03) {
              isHarmonic = true
              break
            }
          }
        }
        if (isHarmonic) break
      }

      if (!isHarmonic) {
        bestLag = p.lag
        maxCorr = p.corr
        break
      }
    }

    if (bestLag <= 0) {
      return null
    }

    // Parabolic interpolation around the peak lag using consistent normalized correlation values
    let fineLag = bestLag
    if (bestLag > minLag && bestLag < maxLag) {
      const prevCorr = corrs[bestLag - 1] ?? 0
      const nextCorr = corrs[bestLag + 1] ?? 0
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
    const midiFloat = 12 * Math.log2(freq / this.concertPitchHz) + 69
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
        isSoundDetected: rmsDb >= this.noiseGateDb,
        clarityScore: 0,
      }
    }

    // Pitch class of the detected fundamental
    const detectedMidi = Math.round(12 * Math.log2(pitch.freq / this.concertPitchHz) + 69)
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
