import { useState, useRef, useEffect, useCallback } from 'react'
import { chromaToChord, type ChordDetectionResult } from '@/lib/audio/chord-detector'
import { encodeMonoWav } from '@/lib/audio/wav-encoder'
import { apiBaseUrl } from '@/lib/api/config'

const CHORD_OPTIONS = [
  'C',
  'G',
  'Am',
  'F',
  'D',
  'Em',
  'A',
  'E',
  'Dm',
  'Am7',
  'Cmaj7',
  'G7',
  'D7',
  'E7',
  'B7',
  'Bm',
] as const

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

type TranscribeResult = {
  notes: Array<{
    pitch: number
    start_time: number
    end_time: number
    amplitude: number
  }>
  chords: Array<{
    timestamp_sec: number
    pitches: number[]
    detected_name: string
  }>
  duration_seconds: number
}

export function AudioTestBench() {
  const [isListening, setIsListening] = useState(false)
  const [targetChord, setTargetChord] = useState<string>('D')
  const [detectedChord, setDetectedChord] = useState<ChordDetectionResult>({
    chord: 'None',
    confidence: 0,
    bass: 'None',
  })
  const [activeNotes, setActiveNotes] = useState<string[]>([])
  const [chromaEnergies, setChromaEnergies] = useState<number[]>(new Array(12).fill(0))
  const [volumeLevel, setVolumeLevel] = useState<number>(0)

  // 5-second recorder state
  const [isRecordingTake, setIsRecordingTake] = useState(false)
  const [recordingCountdown, setRecordingCountdown] = useState<number>(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeResult, setTranscribeResult] = useState<TranscribeResult | null>(null)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)

  // Web Audio refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const recordedSamplesRef = useRef<Float32Array[]>([])
  const recordingProcessorRef = useRef<ScriptProcessorNode | null>(null)

  // Temporal smoothing and debouncing refs
  const smoothedChromaRef = useRef<number[]>(new Array(12).fill(0))
  const candidateChordRef = useRef<{ chord: string; count: number }>({ chord: 'None', count: 0 })

  const stopListening = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current)
      animFrameIdRef.current = null
    }

    if (recordingProcessorRef.current) {
      recordingProcessorRef.current.disconnect()
      recordingProcessorRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    setIsListening(false)
    setVolumeLevel(0)
    setChromaEnergies(new Array(12).fill(0))
    smoothedChromaRef.current = new Array(12).fill(0)
    candidateChordRef.current = { chord: 'None', count: 0 }
    setActiveNotes([])
    setDetectedChord({ chord: 'None', confidence: 0, bass: 'None' })
  }, [])

  const startListening = async () => {
    try {
      stopListening()

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) {
        alert('Web Audio API is not supported in this browser.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      mediaStreamRef.current = stream

      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      // Use 4096 FFT size for accurate semitone frequency separation in guitar fundamental register
      analyser.fftSize = 4096
      analyser.smoothingTimeConstant = 0.65
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      setIsListening(true)

      const sampleRate = ctx.sampleRate
      const bufferLength = analyser.frequencyBinCount
      const freqData = new Float32Array(bufferLength)
      const timeData = new Float32Array(analyser.fftSize)
      const binHz = (sampleRate / 2) / bufferLength

      const updateLoop = () => {
        if (!analyserRef.current) return

        analyser.getFloatTimeDomainData(timeData)
        analyser.getFloatFrequencyData(freqData)

        // 1. Calculate RMS volume
        let sumSquares = 0
        for (let i = 0; i < timeData.length; i++) {
          const val = timeData[i] ?? 0
          sumSquares += val * val
        }
        const rms = Math.sqrt(sumSquares / timeData.length)
        const currentVolume = Math.min(1.0, rms * 6)
        setVolumeLevel(currentVolume)

        // If below ambient noise floor, decay and clear
        if (currentVolume < 0.02) {
          for (let i = 0; i < 12; i++) {
            smoothedChromaRef.current[i]! *= 0.8
          }
          const maxVal = Math.max(...smoothedChromaRef.current)
          setChromaEnergies(maxVal > 0.05 ? smoothedChromaRef.current.map((v) => v / maxVal) : new Array(12).fill(0))
          candidateChordRef.current = { chord: 'None', count: 0 }
          setDetectedChord({ chord: 'None', confidence: 0, bass: 'None' })
          setActiveNotes([])
          animFrameIdRef.current = requestAnimationFrame(updateLoop)
          return
        }

        // 2. Find maximum magnitude in chord frequency zone (65Hz to 1200Hz)
        const minBin = Math.max(2, Math.floor(65 / binHz))
        const maxBin = Math.min(bufferLength - 2, Math.ceil(1200 / binHz))

        let maxDbInZone = -100
        for (let b = minBin; b <= maxBin; b++) {
          const db = freqData[b] ?? -100
          if (db > maxDbInZone) maxDbInZone = db
        }

        const instantChroma = new Array(12).fill(0)
        // Inspect spectral peaks within 28dB of strongest peak and above -60dB noise gate
        const peakThreshold = Math.max(-60, maxDbInZone - 28)

        for (let b = minBin; b <= maxBin; b++) {
          const prev = freqData[b - 1] ?? -100
          const curr = freqData[b] ?? -100
          const next = freqData[b + 1] ?? -100

          // Local peak detection
          if (curr > prev && curr > next && curr > peakThreshold) {
            // Parabolic interpolation for exact sub-bin frequency detection
            const alpha = Math.pow(10, (prev + 100) / 20)
            const beta = Math.pow(10, (curr + 100) / 20)
            const gamma = Math.pow(10, (next + 100) / 20)
            const denom = alpha - 2 * beta + gamma
            const delta = denom !== 0 ? (0.5 * (alpha - gamma)) / denom : 0
            const trueFreq = (b + delta) * binHz

            if (trueFreq >= 65 && trueFreq <= 1400) {
              const midi = 69 + 12 * Math.log2(trueFreq / 440)
              const pitchClass = ((Math.round(midi) % 12) + 12) % 12
              instantChroma[pitchClass] += beta
            }
          }
        }

        // 3. Exponential moving average smoothing on chroma vector to eliminate frame jitter
        for (let i = 0; i < 12; i++) {
          smoothedChromaRef.current[i] =
            smoothedChromaRef.current[i]! * 0.7 + instantChroma[i] * 0.3
        }

        const maxChroma = Math.max(...smoothedChromaRef.current)
        const normalizedChroma = smoothedChromaRef.current.map((val) =>
          maxChroma > 0.05 ? Math.min(1.0, val / maxChroma) : 0,
        )
        setChromaEnergies(normalizedChroma)

        // Extract active ringing notes with >= 40% energy
        const ringingNotes: string[] = []
        for (let i = 0; i < 12; i++) {
          if (normalizedChroma[i]! >= 0.4) {
            ringingNotes.push(PITCH_NAMES[i]!)
          }
        }
        setActiveNotes(ringingNotes)

        // 4. Resolve chord via chord-detector
        const detection = chromaToChord(smoothedChromaRef.current)
        if (detection.chord !== 'None') {
          if (detection.chord === candidateChordRef.current.chord) {
            candidateChordRef.current.count++
          } else {
            candidateChordRef.current = { chord: detection.chord, count: 1 }
          }

          // Debounce: update once chord is confirmed across 3 consecutive frames
          if (candidateChordRef.current.count >= 3) {
            setDetectedChord(detection)
          }
        } else if (candidateChordRef.current.count > 0) {
          candidateChordRef.current.count--
          if (candidateChordRef.current.count <= 0) {
            setDetectedChord({ chord: 'None', confidence: 0, bass: 'None' })
          }
        }

        animFrameIdRef.current = requestAnimationFrame(updateLoop)
      }

      animFrameIdRef.current = requestAnimationFrame(updateLoop)
    } catch (err) {
      console.error('Failed to initialize microphone listening:', err)
      setIsListening(false)
    }
  }

  // 5-second take recording function
  const start5SecondTake = async () => {
    if (isRecordingTake) return

    setTranscribeError(null)
    setTranscribeResult(null)
    recordedSamplesRef.current = []

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      let ctx = audioContextRef.current
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContextClass()
        audioContextRef.current = ctx
      }

      let stream = mediaStreamRef.current
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        mediaStreamRef.current = stream
      }

      const source = ctx.createMediaStreamSource(stream)
      // Use ScriptProcessorNode to collect raw PCM samples
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      recordingProcessorRef.current = processor

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        recordedSamplesRef.current.push(new Float32Array(inputData))
      }

      source.connect(processor)
      // Connect to zero-gain node to prevent speaker feedback while keeping processor alive
      const silentGain = ctx.createGain()
      silentGain.gain.value = 0
      processor.connect(silentGain)
      silentGain.connect(ctx.destination)

      setIsRecordingTake(true)
      setRecordingCountdown(5)

      let remaining = 5
      const interval = setInterval(() => {
        remaining -= 1
        setRecordingCountdown(remaining)
        if (remaining <= 0) {
          clearInterval(interval)
          finishTake(ctx.sampleRate)
        }
      }, 1000)
    } catch (err) {
      console.error('Failed to start 5-second take recording:', err)
      setIsRecordingTake(false)
      setTranscribeError(err instanceof Error ? err.message : 'Failed to record audio')
    }
  }

  const finishTake = async (sampleRate: number) => {
    setIsRecordingTake(false)

    if (recordingProcessorRef.current) {
      recordingProcessorRef.current.disconnect()
      recordingProcessorRef.current = null
    }

    const chunks = recordedSamplesRef.current
    if (chunks.length === 0) {
      setTranscribeError('No audio data was captured during the take.')
      return
    }

    // Merge captured float arrays
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    // Encode to 16-bit PCM WAV
    const wavBlob = encodeMonoWav(merged, sampleRate)

    // Submit to developer test endpoint
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', wavBlob, 'dev-take.wav')

      let baseUrl = 'http://localhost:8000'
      try {
        baseUrl = apiBaseUrl()
      } catch {
        // Fallback for dev environments
      }

      const res = await fetch(`${baseUrl}/api/audio/test-transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Transcription failed with status ${res.status}`)
      }

      const data: TranscribeResult = await res.json()
      setTranscribeResult(data)
    } catch (err) {
      console.error('Test transcription upload error:', err)
      setTranscribeError(err instanceof Error ? err.message : 'Transcription upload failed')
    } finally {
      setIsTranscribing(false)
    }
  }

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  const isMatched =
    isListening && detectedChord.chord === targetChord && detectedChord.confidence > 0.5

  return (
    <div className="w-full space-y-6 rounded-[24px] border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Dev Testing Playground
            </span>
            <span className="text-xs text-muted-foreground">AudioWorklet + Basic Pitch</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Audio Test Bench
          </h2>
          <p className="text-sm text-muted-foreground">
            Test instrument chord playing directly in the browser with real-time chromagram and deep
            backend transcription.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isListening ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="font-medium text-foreground">
              {isListening ? 'Live Mic Active' : 'Mic Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Target Chord Selector & Controls */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/50 p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="target-chord" className="text-xs font-medium text-muted-foreground">
            Target Chord
          </label>
          <select
            id="target-chord"
            aria-label="Target Chord"
            value={targetChord}
            onChange={(e) => setTargetChord(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {CHORD_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c} Chord
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isListening
                ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled={isRecordingTake || isTranscribing}
            onClick={start5SecondTake}
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-none hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {isRecordingTake ? `Recording Take (${recordingCountdown}s)...` : 'Record 5s Take'}
          </button>
        </div>
      </div>

      {/* Real-Time Detection Display Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Chord Accuracy Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-background/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Chord Detection
            </span>
            {isListening && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isMatched
                    ? 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : detectedChord.chord !== 'None'
                      ? 'border border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'border border-border bg-muted text-muted-foreground'
                }`}
              >
                {isMatched
                  ? 'Matched'
                  : detectedChord.chord !== 'None'
                    ? `Playing ${detectedChord.chord} (Expected ${targetChord})`
                    : `Waiting for ${targetChord}...`}
              </span>
            )}
          </div>

          <div className="my-6 text-center">
            <div className="font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              {detectedChord.chord !== 'None' ? detectedChord.chord : '—'}
            </div>

            {/* Active detected notes badge list */}
            {activeNotes.length > 0 && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Notes Heard:</span>
                {activeNotes.map((note) => (
                  <span
                    key={note}
                    className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-2 text-sm text-muted-foreground">
              {detectedChord.chord !== 'None'
                ? `Confidence: ${(detectedChord.confidence * 100).toFixed(0)}% • Bass: ${detectedChord.bass}`
                : isListening
                  ? 'Play your instrument into the microphone'
                  : 'Click "Start Listening" to begin'}
            </p>
          </div>

          {/* Audio Input Level Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Input Volume Level</span>
              <span>{(volumeLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-primary transition-all duration-75"
                style={{ width: `${Math.min(100, volumeLevel * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 12-Semitone Chromagram Energy Visualizer */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-background/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chromagram Energy (12 Pitch Classes)
            </span>
            <span className="text-xs text-muted-foreground">Parabolic FFT Peak Interpolation</span>
          </div>

          <div className="my-4 grid grid-cols-12 gap-1.5 pt-4">
            {PITCH_NAMES.map((name, idx) => {
              const energy = chromaEnergies[idx] ?? 0
              const isActive = energy > 0.4
              return (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <div className="relative flex h-24 w-full items-end justify-center rounded-md bg-border/40 p-0.5">
                    <div
                      className={`w-full rounded-sm transition-all duration-75 ${
                        isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      style={{ height: `${Math.max(4, energy * 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isActive ? 'font-bold text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {name}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            D, F#, A highlights signify D Major triad presence; harmonic distribution updates with
            temporal smoothing.
          </p>
        </div>
      </div>

      {/* 5-Second Take Deep Transcription Results Card */}
      {(isTranscribing || transcribeResult || transcribeError) && (
        <div className="rounded-xl border border-border bg-background/60 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">
              Deep Spotify Basic Pitch Transcription Results
            </h3>
            {isTranscribing && (
              <span className="text-xs font-medium text-primary animate-pulse">
                Transcribing polyphonic take...
              </span>
            )}
          </div>

          {transcribeError && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {transcribeError}
            </div>
          )}

          {transcribeResult && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="font-semibold text-foreground">
                    {transcribeResult.duration_seconds}s
                  </div>
                  <div className="text-muted-foreground">Take Duration</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="font-semibold text-foreground">
                    {transcribeResult.notes.length}
                  </div>
                  <div className="text-muted-foreground">Detected Notes</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="font-semibold text-foreground">
                    {transcribeResult.chords.length}
                  </div>
                  <div className="text-muted-foreground">Clustered Chords</div>
                </div>
              </div>

              {/* Clustered Chords List */}
              {transcribeResult.chords.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                    Clustered Chords (Strum Window 120ms):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {transcribeResult.chords.map((chord, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs"
                      >
                        <span className="font-bold text-foreground">
                          {chord.detected_name || 'Unknown'}
                        </span>
                        <span className="ml-1 text-muted-foreground">
                          @{chord.timestamp_sec.toFixed(2)}s (MIDI: {chord.pitches.join(', ')})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
