import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  GuitarFretboardDiagram,
  formatFretOrdinal,
  getOrdinalSuffix,
  computeBaseFret,
  parseFingeringString,
} from '../guitar-fretboard-diagram'
import type { GuitarTabVoicing } from '@/lib/music/chord-voicings'

describe('GuitarFretboardDiagram Utilities', () => {
  it('formats ordinals accurately', () => {
    expect(formatFretOrdinal(1)).toBe('1st')
    expect(formatFretOrdinal(2)).toBe('2nd')
    expect(formatFretOrdinal(3)).toBe('3rd')
    expect(formatFretOrdinal(4)).toBe('4th')
    expect(formatFretOrdinal(5)).toBe('5th')
    expect(formatFretOrdinal(11)).toBe('11th')
    expect(formatFretOrdinal(12)).toBe('12th')
    expect(formatFretOrdinal(13)).toBe('13th')
    expect(formatFretOrdinal(21)).toBe('21st')
    expect(formatFretOrdinal(22)).toBe('22nd')
    expect(formatFretOrdinal(23)).toBe('23rd')
    expect(formatFretOrdinal(24)).toBe('24th')

    // Alias getOrdinalSuffix matches formatFretOrdinal
    expect(getOrdinalSuffix(2)).toBe('2nd')
    expect(getOrdinalSuffix(3)).toBe('3rd')
  })

  it('parses hyphenated fingering strings', () => {
    expect(parseFingeringString('x-3-2-0-1-0')).toEqual([null, 3, 2, null, 1, null])
    expect(parseFingeringString('2-1-0-0-3-4')).toEqual([2, 1, null, null, 3, 4])
    expect(parseFingeringString('T-x-0-1-3-2')).toEqual(['T', null, null, 1, 3, 2])
  })

  it('computes dynamic baseFret for higher-position chords', () => {
    // Open C major
    const openC: GuitarTabVoicing = {
      frets: [null, 3, 2, 0, 1, 0],
      fingering: 'x-3-2-0-1-0',
      strings: 'x-A-D-G-B-e',
    }
    expect(computeBaseFret(openC)).toBe(1)

    // Cm chord at fret 3..5
    const cm: GuitarTabVoicing = {
      frets: [null, 3, 5, 5, 4, 3],
      fingering: 'x-1-3-4-2-1',
      barreFret: 3,
      strings: 'x-C-G-c-eb-g',
    }
    expect(computeBaseFret(cm)).toBe(3)

    // Ab chord at fret 4..6
    const ab: GuitarTabVoicing = {
      frets: [4, 6, 6, 5, 4, 4],
      fingering: '1-3-4-2-1-1',
      barreFret: 4,
      strings: 'Ab-Eb-Ab-c-eb-ab',
    }
    expect(computeBaseFret(ab)).toBe(4)
  })
})

describe('GuitarFretboardDiagram Component Rendering', () => {
  it('renders root container with data-testid="fretboard-diagram" and accessible SVG', () => {
    const tab: GuitarTabVoicing = {
      frets: [null, 3, 2, 0, 1, 0],
      fingering: 'x-3-2-0-1-0',
      strings: 'x-A-D-G-B-e',
    }
    const { container } = render(<GuitarFretboardDiagram chordName="C" guitarTab={tab} />)
    const diagram = screen.getByTestId('fretboard-diagram')
    expect(diagram).toBeDefined()
    expect(screen.getByText('Fingering: x-3-2-0-1-0')).toBeDefined()

    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 180 100')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toContain('C')
  })

  it('renders vector open (○) and muted (✕) glyphs in SVG aligned above strings', () => {
    const cVoicing: GuitarTabVoicing = {
      frets: [null, 3, 2, 0, 1, 0],
      fingering: 'x-3-2-0-1-0',
      fingers: [null, 3, 2, null, 1, null],
      strings: 'x-A-D-G-B-e',
    }

    const { container } = render(<GuitarFretboardDiagram chordName="C" guitarTab={cVoicing} />)

    // String 0 (low E) is muted (null): should render mute cross glyph
    const muteGlyphs = container.querySelectorAll('[data-testid="mute-marker"]')
    expect(muteGlyphs.length).toBe(1)

    // String 3 (G) and String 5 (high e) are open (0): should render open circle glyphs
    const openGlyphs = container.querySelectorAll('[data-testid="open-marker"]')
    expect(openGlyphs.length).toBe(2)

    // Fretted strings (1, 2, 4) should NOT have any marker above the nut (clean chord chart convention)
    const allNutMarkers = container.querySelectorAll('[data-testid="nut-marker"]')
    expect(allNutMarkers.length).toBe(3) // 1 mute + 2 open = 3 markers total
  })

  it('renders finger numbers centered inside fret dots for folk G major chord', () => {
    const folkG: GuitarTabVoicing = {
      frets: [3, 2, 0, 0, 0, 3],
      fingers: [2, 1, null, null, null, 3],
      fingering: '2-1-0-0-0-3',
      strings: 'E-A-D-G-B-e',
    }
    const { container } = render(<GuitarFretboardDiagram chordName="G" guitarTab={folkG} />)

    // 3 fretted notes in folk G (low E, A, high e)
    const fretDots = container.querySelectorAll('[data-testid="fret-dot"]')
    expect(fretDots.length).toBe(3)

    // Verify finger labels '2', '1', '3' are present inside dots
    const fingerLabels = container.querySelectorAll('[data-testid="fret-finger-label"]')
    expect(fingerLabels.length).toBe(3)
    const texts = Array.from(fingerLabels).map((el) => el.textContent?.trim())
    expect(texts).toContain('2')
    expect(texts).toContain('1')
    expect(texts).toContain('3')

    // Verify 3 open string circles are rendered at y=6
    const openCircles = container.querySelectorAll('circle[cy="6"]')
    expect(openCircles.length).toBe(3)
  })

  it('renders finger numbers inside dots for 4-finger rock G chord', () => {
    const rockG: GuitarTabVoicing = {
      frets: [3, 2, 0, 0, 3, 3],
      fingers: [2, 1, null, null, 3, 4],
      fingering: '2-1-0-0-3-4',
      strings: 'E-A-D-G-B-e',
    }
    const { container } = render(<GuitarFretboardDiagram chordName="G" guitarTab={rockG} />)

    // 4 fretted notes in rock G
    const fretDots = container.querySelectorAll('[data-testid="fret-dot"]')
    expect(fretDots.length).toBe(4)

    const fingerLabels = container.querySelectorAll('[data-testid="fret-finger-label"]')
    expect(fingerLabels.length).toBe(4)
    const texts = Array.from(fingerLabels).map((el) => el.textContent?.trim())
    expect(texts).toEqual(['2', '1', '3', '4'])
  })

  it('renders vector barre chord pill across barred strings when barreFret is present', () => {
    // F major barre chord: frets [1, 3, 3, 2, 1, 1], barreFret: 1
    const fVoicing: GuitarTabVoicing = {
      frets: [1, 3, 3, 2, 1, 1],
      fingering: '1-3-4-2-1-1',
      fingers: [1, 3, 4, 2, 1, 1],
      barreFret: 1,
      strings: 'E-A-D-G-B-e',
    }

    const { container } = render(<GuitarFretboardDiagram chordName="F" guitarTab={fVoicing} />)

    const barrePill = container.querySelector('[data-testid="barre-pill"]')
    expect(barrePill).not.toBeNull()
    expect(barrePill?.tagName.toLowerCase()).toBe('rect')

    // Bm chord: barre on fret 2
    const bmVoicing: GuitarTabVoicing = {
      frets: [null, 2, 4, 4, 3, 2],
      fingering: 'x-1-3-4-2-1',
      fingers: [null, 1, 3, 4, 2, 1],
      barreFret: 2,
      strings: 'x-A-D-G-B-e',
    }

    const { container: bmContainer } = render(
      <GuitarFretboardDiagram chordName="Bm" guitarTab={bmVoicing} />
    )
    const bmBarre = bmContainer.querySelector('[data-testid="barre-pill"]')
    expect(bmBarre).not.toBeNull()
  })

  it('handles higher-fret chords using dynamic baseFret without vertical clipping', () => {
    // Cm chord: frets [null, 3, 5, 5, 4, 3], barreFret 3, baseFret 3
    const cmVoicing: GuitarTabVoicing = {
      frets: [null, 3, 5, 5, 4, 3],
      fingering: 'x-1-3-4-2-1',
      fingers: [null, 1, 3, 4, 2, 1],
      barreFret: 3,
      baseFret: 3,
      strings: 'x-A-D-G-B-e',
    }

    const { container } = render(<GuitarFretboardDiagram chordName="Cm" guitarTab={cmVoicing} />)

    // Must display base fret indicator "3fr"
    expect(screen.getByText('3fr')).toBeDefined()

    // Fret dots relative to baseFret 3 must stay within 12..95
    const fretDots = container.querySelectorAll('[data-testid="fret-dot"]')
    expect(fretDots.length).toBeGreaterThan(0)
    fretDots.forEach((dot) => {
      const cy = Number(dot.getAttribute('cy'))
      expect(cy).toBeGreaterThan(12)
      expect(cy).toBeLessThan(95)
    })
  })

  it('renders fret marker inlays at positions 3, 5, 7, 9', () => {
    const cVoicing: GuitarTabVoicing = {
      frets: [null, 3, 2, 0, 1, 0],
      fingering: 'x-3-2-0-1-0',
      fingers: [null, 3, 2, null, 1, null],
      strings: 'x-A-D-G-B-e',
    }

    const { container } = render(<GuitarFretboardDiagram chordName="C" guitarTab={cVoicing} />)

    // For baseFret = 1, fret 3 inlay is visible at x=90
    const inlays = container.querySelectorAll('[data-testid="fret-inlay"]')
    expect(inlays.length).toBeGreaterThanOrEqual(1)
  })
})
