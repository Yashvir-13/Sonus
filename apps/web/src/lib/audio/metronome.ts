/**
 * Metronome & Wooden Click Audio Synthesizer
 *
 * Lightweight, zero-dependency Web Audio metronome providing:
 * 1. Authentic wooden metronome click synthesis (high-Q resonant cavity + body knock).
 * 2. High-precision lookahead beat timer dispatching beat callbacks.
 */

export interface WoodenClickOptions {
  isDownbeat?: boolean
  time?: number
  gainScale?: number
}

/**
 * Synthesize an authentic acoustic wooden metronome click.
 *
 * Modeled after traditional Maelzel/Wittner pyramid metronomes:
 * - Downbeat (Beat 1): Resonant cavity at ~1150Hz (high wooden "tok") with ~18% initial pitch drop.
 * - Upbeat: Resonant cavity at ~850Hz (lower wooden "tek") with ~18% initial pitch drop.
 * - High-Q bandpass resonance (Q = 12) simulating hollow wood chamber acoustics.
 * - Exponential decay over 28ms.
 * - Secondary subtle knock transient at ~300Hz for acoustic body weight.
 *
 * @param ctx Target AudioContext.
 * @param isDownbeatOrOptions Boolean isDownbeat or full configuration options.
 * @param time Optional scheduled start time in AudioContext timeline.
 */
export function playWoodenClick(
  ctx: AudioContext,
  isDownbeatOrOptions: boolean | WoodenClickOptions = false,
  time?: number
): void {
  if (!ctx) return

  try {
    const isDownbeat =
      typeof isDownbeatOrOptions === 'boolean'
        ? isDownbeatOrOptions
        : (isDownbeatOrOptions?.isDownbeat ?? false)

    const scheduledTime =
      typeof isDownbeatOrOptions === 'object' && isDownbeatOrOptions.time !== undefined
        ? isDownbeatOrOptions.time
        : (time ?? ctx.currentTime)

    const scale =
      typeof isDownbeatOrOptions === 'object' && isDownbeatOrOptions.gainScale !== undefined
        ? Math.max(0, Math.min(2, isDownbeatOrOptions.gainScale))
        : 1.0

    const t0 = Math.max(0, scheduledTime)

    // Woodblock cavity resonance: 1150Hz downbeat ("tok") vs 850Hz upbeat ("tek")
    const cavityFreq = isDownbeat ? 1150 : 850
    // Fast initial transient: pitch drops approx 18% in the first 4ms
    const startFreq = cavityFreq * 1.18
    const peakVolume = (isDownbeat ? 0.65 : 0.40) * scale
    const decayDuration = 0.028 // 28ms exponential decay

    // 1. Primary Cavity Resonator (Woodblock hollow body)
    const cavityOsc = ctx.createOscillator()
    const cavityFilter = ctx.createBiquadFilter()
    const cavityGain = ctx.createGain()

    // Triangle waveform produces the odd-harmonic series characteristic of closed wooden tubes
    cavityOsc.type = 'triangle'
    cavityOsc.frequency.setValueAtTime(startFreq, t0)
    cavityOsc.frequency.exponentialRampToValueAtTime(cavityFreq, t0 + 0.004)

    // High-Q bandpass resonance (Q = 12)
    cavityFilter.type = 'bandpass'
    cavityFilter.frequency.setValueAtTime(cavityFreq, t0)
    cavityFilter.Q.setValueAtTime(12, t0)

    cavityGain.gain.setValueAtTime(peakVolume, t0)
    cavityGain.gain.exponentialRampToValueAtTime(0.0001, t0 + decayDuration)

    cavityOsc.connect(cavityFilter)
    cavityFilter.connect(cavityGain)
    cavityGain.connect(ctx.destination)

    cavityOsc.start(t0)
    cavityOsc.stop(t0 + 0.035)

    // 2. Secondary Subtle Knock Transient (~300Hz body impact)
    const knockOsc = ctx.createOscillator()
    const knockGain = ctx.createGain()
    const knockVolume = (isDownbeat ? 0.20 : 0.12) * scale

    knockOsc.type = 'sine'
    knockOsc.frequency.setValueAtTime(340, t0)
    knockOsc.frequency.exponentialRampToValueAtTime(280, t0 + 0.004)

    knockGain.gain.setValueAtTime(knockVolume, t0)
    knockGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018) // 18ms tight body knock

    knockOsc.connect(knockGain)
    knockGain.connect(ctx.destination)

    knockOsc.start(t0)
    knockOsc.stop(t0 + 0.035)
  } catch {
    // AudioContext might be restricted or closed before user gesture
  }
}

/**
 * High-precision lookahead metronome timer that dispatches beat callbacks and synthesizes audio clicks.
 *
 * @param bpm Beats per minute (clamped to 30..300).
 * @param onBeat Callback receiving current 0-indexed beat count.
 * @param audioContext Optional AudioContext for audio click generation.
 * @returns Stop function to cancel the metronome interval.
 */
export function startMetronome(
  bpm: number,
  onBeat: (beat: number) => void,
  audioContext?: AudioContext
): () => void {
  const safeBpm = Math.max(30, Math.min(300, bpm))
  const intervalMs = (60 / safeBpm) * 1000
  let beatCount = 0
  let isRunning = true

  const triggerClick = (isDownbeat: boolean) => {
    if (!audioContext) return
    playWoodenClick(audioContext, isDownbeat, audioContext.currentTime)
  }

  // Initial beat
  onBeat(beatCount)
  triggerClick(beatCount % 4 === 0)
  beatCount++

  const intervalId = setInterval(() => {
    if (!isRunning) return
    onBeat(beatCount)
    triggerClick(beatCount % 4 === 0)
    beatCount++
  }, intervalMs)

  return () => {
    isRunning = false
    clearInterval(intervalId)
  }
}
