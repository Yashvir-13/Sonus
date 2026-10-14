/**
 * High-precision lookahead metronome timer that dispatches beat callbacks and synthesizes audio clicks.
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

  const playClick = (isDownbeat: boolean) => {
    if (!audioContext) return
    try {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(isDownbeat ? 880 : 440, audioContext.currentTime)
      gain.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.start()
      osc.stop(audioContext.currentTime + 0.05)
    } catch {
      // Audio context might be suspended or closed
    }
  }

  // Initial beat
  onBeat(beatCount)
  playClick(beatCount % 4 === 0)
  beatCount++

  const intervalId = setInterval(() => {
    if (!isRunning) return
    onBeat(beatCount)
    playClick(beatCount % 4 === 0)
    beatCount++
  }, intervalMs)

  return () => {
    isRunning = false
    clearInterval(intervalId)
  }
}
