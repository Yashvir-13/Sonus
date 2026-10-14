export type ChordDetectionResult = {
  chord: string
  confidence: number
  bass: string
}

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

type ChordTemplate = {
  suffix: string
  intervals: number[]
  weight: number
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  { suffix: '', intervals: [0, 4, 7], weight: 1.0 }, // Major
  { suffix: 'm', intervals: [0, 3, 7], weight: 1.0 }, // Minor
  { suffix: '7', intervals: [0, 4, 7, 10], weight: 1.1 }, // Dominant 7th
  { suffix: 'maj7', intervals: [0, 4, 7, 11], weight: 1.1 }, // Major 7th
  { suffix: 'm7', intervals: [0, 3, 7, 10], weight: 1.1 }, // Minor 7th
  { suffix: 'dim', intervals: [0, 3, 6], weight: 0.9 }, // Diminished
  { suffix: 'sus4', intervals: [0, 5, 7], weight: 0.95 }, // Sus4
]

/**
 * Maps a 12-semitone chroma energy vector into the most probable chord quality and root.
 * Chroma order: [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
 */
export function chromaToChord(chromaVector: number[]): ChordDetectionResult {
  if (!chromaVector || chromaVector.length !== 12) {
    return { chord: 'None', confidence: 0, bass: 'None' }
  }

  const totalEnergy = chromaVector.reduce((acc, val) => acc + val, 0)
  const maxEnergy = Math.max(...chromaVector)

  if (totalEnergy < 0.2 || maxEnergy < 0.15) {
    return { chord: 'None', confidence: 0, bass: 'None' }
  }

  // Normalize chroma vector
  const norm = Math.sqrt(chromaVector.reduce((sum, v) => sum + v * v, 0)) || 1.0
  const normalizedVector = chromaVector.map((v) => v / norm)

  let bestChord = 'None'
  let bestConfidence = 0.0
  let bestRootIndex = -1

  for (let root = 0; root < 12; root++) {
    for (const tmpl of CHORD_TEMPLATES) {
      // Build binary/weighted template vector
      const templateVector = new Array(12).fill(0)
      for (const interval of tmpl.intervals) {
        const pitchIdx = (root + interval) % 12
        templateVector[pitchIdx] = 1.0
      }

      const tmplNorm = Math.sqrt(tmpl.intervals.length)
      // Dot product cosine similarity
      let dot = 0.0
      let nonChordEnergy = 0.0
      for (let i = 0; i < 12; i++) {
        dot += normalizedVector[i]! * templateVector[i]!
        if (templateVector[i] === 0) {
          nonChordEnergy += normalizedVector[i]!
        }
      }

      // Penalize energy present in non-chord tones
      const cosineSim = (dot / tmplNorm) * tmpl.weight
      const penalty = nonChordEnergy * 0.25
      const score = Math.max(0, cosineSim - penalty)

      if (score > bestConfidence) {
        bestConfidence = score
        bestRootIndex = root
        const rootName = PITCH_CLASSES[root]
        bestChord = `${rootName}${tmpl.suffix}`
      }
    }
  }

  if (bestConfidence < 0.45 || bestRootIndex === -1) {
    return { chord: 'None', confidence: Math.round(bestConfidence * 100) / 100, bass: 'None' }
  }

  const bassName = PITCH_CLASSES[bestRootIndex] ?? 'C'
  return {
    chord: bestChord,
    confidence: Math.min(1.0, Math.round(bestConfidence * 100) / 100),
    bass: bassName,
  }
}
