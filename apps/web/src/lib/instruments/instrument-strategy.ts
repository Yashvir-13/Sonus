import { MusicalChord } from '../music/musical-chord'

export interface InstrumentSynthesisProfile {
  preset: string
  inharmonicity: number
  releaseSec: number
  stereoWidth: number
}

export interface InstrumentEvaluationWeights {
  voicingWeight: number
  timingWeight: number
  strictOctaveMatch: boolean
}

export interface InstrumentStrategy {
  readonly instrument: 'guitar' | 'piano'
  readonly label: string
  readonly defaultClef: 'treble' | 'grand'
  readonly defaultPrimaryVoicing: 'fretboard' | 'keyboard'
  readonly supportsWaterfall: boolean
  readonly supportsTablature: boolean

  getSynthesisProfile(): InstrumentSynthesisProfile
  getEvaluationWeights(): InstrumentEvaluationWeights
  getExpectedPitches(chord: MusicalChord | string): number[]
}

export class GuitarStrategy implements InstrumentStrategy {
  readonly instrument = 'guitar' as const
  readonly label = 'Acoustic Guitar'
  readonly defaultClef = 'treble' as const
  readonly defaultPrimaryVoicing = 'fretboard' as const
  readonly supportsWaterfall = false
  readonly supportsTablature = true

  getSynthesisProfile(): InstrumentSynthesisProfile {
    return {
      preset: 'acoustic-steel-guitar',
      inharmonicity: 0.0001,
      releaseSec: 1.2,
      stereoWidth: 0.6,
    }
  }

  getEvaluationWeights(): InstrumentEvaluationWeights {
    return {
      voicingWeight: 0.5,
      timingWeight: 0.5,
      strictOctaveMatch: false,
    }
  }

  getExpectedPitches(chord: MusicalChord | string): number[] {
    const musicalChord = typeof chord === 'string' ? new MusicalChord(chord) : chord
    return musicalChord.getExpectedMidiPitches('guitar')
  }
}

export class PianoStrategy implements InstrumentStrategy {
  readonly instrument = 'piano' as const
  readonly label = 'Concert Grand Piano'
  readonly defaultClef = 'grand' as const
  readonly defaultPrimaryVoicing = 'keyboard' as const
  readonly supportsWaterfall = true
  readonly supportsTablature = false

  getSynthesisProfile(): InstrumentSynthesisProfile {
    return {
      preset: 'acoustic-grand-piano',
      inharmonicity: 0.0004,
      releaseSec: 2.4,
      stereoWidth: 0.8,
    }
  }

  getEvaluationWeights(): InstrumentEvaluationWeights {
    return {
      voicingWeight: 0.6,
      timingWeight: 0.4,
      strictOctaveMatch: true,
    }
  }

  getExpectedPitches(chord: MusicalChord | string): number[] {
    const musicalChord = typeof chord === 'string' ? new MusicalChord(chord) : chord
    return musicalChord.getExpectedMidiPitches('piano')
  }
}

const guitarStrategyInstance = new GuitarStrategy()
const pianoStrategyInstance = new PianoStrategy()

export function getInstrumentStrategy(instrument: 'guitar' | 'piano'): InstrumentStrategy {
  return instrument === 'piano' ? pianoStrategyInstance : guitarStrategyInstance
}
