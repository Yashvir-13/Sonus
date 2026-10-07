/**
 * Living Manuscript Screen Blueprints & Specifications
 * 
 * Detailed structural layouts, SVG mathematics, mock telemetry data,
 * and prompt records for the 4 core screens of the PRISM system:
 * 1. Landing Page (Gateway)
 * 2. Setup / Tuning Ritual (Astrolabe Intonation Dial)
 * 3. Composer's Bio Profile Folio (Physiognomy & Repertoire)
 * 4. Constellation History (Celestial Scatter Plot)
 */

import { LIVING_MANUSCRIPT_COLORS, MUSICAL_GLYPHS } from './tokens';

/**
 * Screen 1: Living Manuscript Landing Page & Entry Gateway
 */
export const LANDING_SCREEN_SPEC = {
  id: 'landing-page',
  title: 'Living Manuscript Landing Page and Gateway',
  latinMotto: 'AUDIRE · DISCERE · EXERCERE',
  telemetryStatus: 'REV. MMXXVI // ACOUSTIC INTELLIGENCE ENGINE // STANDBY',
  masterTitle: 'PRISM',
  opusSubtitle: 'Opus Manuscriptum: Adaptive Musical Practice System',
  proposition:
    'A living musical score that listens to your monophonic playing, detects recurring pitch and timing habits across time, and turns weaknesses into focused mastery.',
  features: [
    {
      numeral: 'I',
      title: 'The Attentive Ear',
      description:
        'Low-latency acoustic pitch ribbon analyzing microtonal intonation deviations in real time.',
      glyph: MUSICAL_GLYPHS.gClef,
    },
    {
      numeral: 'II',
      title: 'The Spatial Canvas',
      description:
        'Continuous 2D treatise navigation panning between Practice, Profile Folio, Tuning, and History.',
      glyph: MUSICAL_GLYPHS.caesura,
    },
    {
      numeral: 'III',
      title: 'The Constellation Memory',
      description:
        'Celestial scatter plot mapping tempo breakdown thresholds and intonation drift over months.',
      glyph: MUSICAL_GLYPHS.starNode,
    },
  ],
  inkBleedFilter: {
    id: 'ink-bleed',
    baseFrequency: 0.04,
    numOctaves: 4,
    scale: 5,
    stdDeviation: 0.6,
  },
  clerkThemeConfig: {
    cardBackground: LIVING_MANUSCRIPT_COLORS.parchment,
    cardBorder: `1px solid ${LIVING_MANUSCRIPT_COLORS.charcoal}`,
    buttonPrimary: LIVING_MANUSCRIPT_COLORS.charcoal,
    buttonPrimaryHover: LIVING_MANUSCRIPT_COLORS.crimson,
    inputBackground: LIVING_MANUSCRIPT_COLORS.parchmentSecondary,
    inputBorder: `1px solid ${LIVING_MANUSCRIPT_COLORS.charcoal}`,
    borderRadius: '0px',
  },
  guestAction: {
    label: 'Audition as Guest (Instant Access)',
    glyph: MUSICAL_GLYPHS.fermata,
    description: 'Bypasses authentication directly to the 2D Spatial Practice Stand.',
  },
  prompt: `Screen: PRISM Living Manuscript Landing Page and Gateway
Device: Desktop (1440x900)
Aesthetic: 'The Living Manuscript' historical sheet music and illuminated treatise aesthetic.
Colors: Parchment paper background #F4F1EA, deep charcoal ink #2C2A29 for lines and typography, rich crimson ink #9A2A2A for accents, recessed vellum #E9E4DA.
Typography: Playfair Display serif for headings, Playfair Display Italic for musical annotations, Geist Mono/JetBrains Mono for technical telemetry. Sharp zero-radius borders everywhere; absolutely no generic SaaS pill buttons, modern glassmorphism, or drop shadows.
Layout & Structure:
1. Outer Frame: Elegant double-ruled charcoal hairline border (2px outer, 1px inner) with classical corner flourishes and Latin marginalia: 'AUDIRE · DISCERE · EXERCERE' on top left, and monospace system status 'REV. MMXXVI // ACOUSTIC ENGINE // STANDBY' on top right.
2. Center Hero: A dramatic calligraphic ink bleed bloom spreading outward. Prominent master title 'PRISM' in 80px Playfair Display, subtitle 'Opus Manuscriptum: Adaptive Musical Practice System' in 24px Playfair Display Italic, and an editorial proposition describing a living musical score that listens to acoustic playing and turns weaknesses into mastery.
3. Authentication Folio Ledger: An illuminated parchment card framed in 1px solid charcoal. Inside, bespoke Clerk authentication fields with sharp zero-radius inputs on #E9E4DA background. A primary action button in solid #2C2A29 with #F4F1EA text reading 'Enter the Sanctuary'. Immediately below, an authentic secondary hairline button reading 'Audition as Guest (Instant Entry)' flanked by a fermata glyph (𝄐).
4. Bottom Features Footer: Aligned to a subtle 5-line musical staff watermark across the base, three vintage manuscript columns: 'I. The Attentive Ear' (pitch ribbon analysis), 'II. The Spatial Canvas' (2D continuous movement), and 'III. The Constellation Memory' (celestial habit diagnosis).`,
} as const;

/**
 * Screen 2: Setup / Tuning Ritual (Harmonic Astrolabe)
 */
export const TUNING_RITUAL_SPEC = {
  id: 'tuning-ritual',
  title: 'Setup & Sacred Tuning Ritual',
  directive: 'Accordatura: Moderato e tranquillo',
  subtitle: 'Harmonic Calibration of the Living Reed',
  dialGeometry: {
    diameter: 320,
    radius: 160,
    viewBox: '0 0 320 320',
    center: { x: 160, y: 160 },
    needleLength: 110,
    arcMinCents: -50,
    arcMaxCents: 50,
    arcMinAngleDeg: -60,
    arcMaxAngleDeg: 60,
  },
  /**
   * Needle angle calculation:
   * θ = (centsDeviation / 50) * 60°
   * -50 cents = -60° (Flat)
   *   0 cents =   0° (In Tune)
   * +50 cents = +60° (Sharp)
   */
  calculateNeedleAngle: (centsDeviation: number): number => {
    const clamped = Math.max(-50, Math.min(50, centsDeviation));
    return (clamped / 50) * 60;
  },
  isInTune: (centsDeviation: number): boolean => Math.abs(centsDeviation) <= 3,
  pitchStandards: [
    { label: '415 Hz', name: 'Baroque Pitch', hz: 415.0 },
    { label: '440 Hz', name: 'Modern Standard (A4)', hz: 440.0, default: true },
    { label: '442 Hz', name: 'European Symphonic', hz: 442.0 },
  ],
  instrumentRegisters: [
    { name: 'Violin', clef: MUSICAL_GLYPHS.gClef, range: 'G3 – E7', openStrings: ['G3', 'D4', 'A4', 'E5'] },
    { name: 'Viola', clef: MUSICAL_GLYPHS.cClef, range: 'C3 – A6', openStrings: ['C3', 'G3', 'D4', 'A4'] },
    { name: 'Cello', clef: MUSICAL_GLYPHS.fClef, range: 'C2 – A5', openStrings: ['C2', 'G2', 'D3', 'A3'] },
    { name: 'Flute', clef: MUSICAL_GLYPHS.gClef, range: 'C4 – D7', openStrings: [] },
    { name: 'Voice', clef: MUSICAL_GLYPHS.gClef, range: 'A2 – C6', openStrings: [] },
  ],
  prompt: `Screen: PRISM Setup & Sacred Tuning Ritual
Device: Desktop (1440x900)
Aesthetic: 'The Living Manuscript' Renaissance harmonic astrolabe and musical calibration stand.
Colors: Parchment background #F4F1EA, deep charcoal ink #2C2A29, crimson ink accents #9A2A2A, recessed paper #E9E4DA.
Typography: Playfair Display for headings and note names, Geist Mono for frequency and cents telemetry. Sharp 0px corners, no modern drop shadows.
Layout & Structure:
1. Header: Elegant classical margin header with Italian directive 'Accordatura: Moderato e tranquillo' in Playfair Display Italic, and subtitle 'Harmonic Calibration of the Living Reed'.
2. Centerpiece - The Sacred Astrolabe Intonation Dial: A prominent circular dial (diameter 320px) featuring concentric charcoal engraved rings, radial degree ticks, and an intonation deviation arc (-50 cents flat with ♭ marker to +50 cents sharp with ♯ marker). In the center of the dial, display a large detected note 'A4' in 64px Playfair Display, accompanied by '440.0 Hz · 0 cents' in Geist Mono. A delicate charcoal needle points vertically, illuminated by a glowing crimson ink ring (#9A2A2A) signifying resonant harmonic purity.
3. Left Panel - Hardware Auto-Detection: Framed parchment box showing acoustic microphone auto-detection: 'MIC: Built-in Audio Input (48.0 kHz, 12ms)' with a live audio waveform ripple rendered in charcoal ink, alongside a standby option for 'MIDI Interface (WebMIDI)'.
4. Right Panel - Calibration Ledger: Pitch standard selection switches (415 Hz Baroque, 440 Hz Standard, 442 Hz Symphonic) and instrument selection (Violin, Voice, Flute) showing the instrument's playable register on a miniature 5-line staff.
5. Bottom Action: Ceremonial action button styled as a crimson wax seal (#9A2A2A) with a musical clef stamp, reading 'Seal Tuning & Mount Stand'.`,
} as const;

/**
 * Screen 3: Composer's Bio Profile Folio
 */
export const COMPOSER_PROFILE_SPEC = {
  id: 'composer-profile',
  title: "Composer's Bio Profile Folio",
  spatialCoordinates: { x: 0, y: -1 }, // Panned UP
  folioHeader: {
    woodcutCrestDiameter: 88,
    crestGlyph: MUSICAL_GLYPHS.gClef,
    defaultName: 'Maestro Yash',
    title: 'Soloist in Residence · Violin & Voice',
    authVerification: 'REGISTRY: USR_MMXXVI // STATUS: AUTHENTICATED // DISCIPLINE ACTIVE',
  },
  defaultPhysiognomy: {
    totalPracticeHours: 48.4,
    totalNotesArticulated: 32490,
    consecutiveStreakDays: 14,
    intonationPurityPercent: 91.4,
    timingPrecisionMs: 14,
    maxControlledTempoBpm: 112,
    breakdownHorizonBpm: 120,
    dominantHabits: [
      'Tends sharp (+5 cents) on ascending leading tones before tonic resolutions.',
      'Slightly flat on sustained fourth-finger extensions in higher positions.',
      'Rushes tempo by 4% immediately following whole-measure rests.',
    ],
  },
  defaultRepertoire: [
    {
      title: 'Partita No. 2 in D minor (BWV 1004) - Chaconne',
      composer: 'J.S. Bach',
      difficulty: 'IV',
      masteryPercent: 78,
      lastPracticed: 'Anno MMXXVI · Oct 5',
      status: 'In Active Discipline',
      targetTempoBpm: 60,
    },
    {
      title: '12 Fantasias for Solo Violin (No. 1 in B-flat)',
      composer: 'G.P. Telemann',
      difficulty: 'II',
      masteryPercent: 96,
      lastPracticed: 'Anno MMXXVI · Oct 3',
      status: 'Conquered',
      targetTempoBpm: 92,
    },
    {
      title: '24 Caprices for Solo Violin (Op. 1, No. 24 in A minor)',
      composer: 'N. Paganini',
      difficulty: 'V',
      masteryPercent: 64,
      lastPracticed: 'Anno MMXXVI · Sep 29',
      status: 'Experimental Sanctuary',
      targetTempoBpm: 120,
    },
  ],
  returnAnchor: {
    label: '↓ Return to Practice Stand',
    glyph: MUSICAL_GLYPHS.fermata,
  },
  prompt: `Screen: PRISM Composer's Bio Profile Folio
Device: Desktop (1440x900)
Aesthetic: 'The Living Manuscript' 17th-century printed treatise frontispiece and illuminated folio.
Colors: Parchment background #F4F1EA, deep charcoal ink #2C2A29, rubricated crimson ink accents #9A2A2A.
Typography: Playfair Display for headings and opus titles, Geist Mono for technical telemetry and ledger tables. Sharp zero-radius borders with double hairline framing.
Layout & Structure:
1. Frontispiece Header: Double-ruled charcoal border framing the top. An illuminated circular woodcut crest with a treble clef (𝄞), performer name 'Maestro Yash' in 40px Playfair Display, title 'Soloist in Residence · Violin & Voice', and Clerk authentication seal 'ID: usr_2026_prism // STATUS: VERIFIED' in crisp monospace.
2. Left Column - 'The Physiognomy of Practice': Structured telemetry ledger displaying practice analytics in clean monospace tables: Discipline (48h 20m total, 32,490 notes articulated, 14-day streak), Intonation Purity (91.4%), Timing Precision (±14ms variance), and written analytical diagnoses of player habits ('Tends sharp (+5 cents) on leading tones; rushes tempo by 4% after rests').
3. Right Column - 'The Repertoire Ledger': Classical catalog of studied masterworks (Bach Partita No. 2, Telemann Fantasia No. 1, Paganini Caprice No. 24) featuring difficulty ratings in Roman numerals, hand-drawn ink mastery progress bars, current tempo milestones, and crimson wax status stamps ('Conquered', 'In Active Discipline').
4. Footer & Navigation: Actions for 'Export Folio Ledger', 'Audio Settings', and 'Depart Sanctuary' (Sign Out). At the bottom center, a subtle manuscript margin navigation anchor reading '↓ Return to Practice Stand' with a fermata glyph (𝄐).`,
} as const;

/**
 * Screen 4: Constellation History (Celestial Star Map)
 */
export const CONSTELLATION_HISTORY_SPEC = {
  id: 'constellation-history',
  title: 'Chronicle of Sessions: The Constellation',
  spatialCoordinates: { x: -1, y: 0 }, // Panned LEFT
  telemetryBar: 'CONSTELLATION LEDGER // 48 TAKES RECORDED // TOTAL DISCIPLINE: 16.4 HRS // CRITICAL THRESHOLD: 86 BPM',
  canvasDimensions: {
    viewBox: '0 0 1000 600',
    width: 1000,
    height: 600,
    paddingX: 80,
    paddingY: 60,
    usableWidth: 840,
    usableHeight: 480,
    minTempoBpm: 60,
    maxTempoBpm: 160,
    minAccuracyPercent: 60,
    maxAccuracyPercent: 100,
  },
  /**
   * Canvas Coordinate Mapping Functions
   */
  mapTempoToX: (tempoBpm: number): number => {
    const min = 60;
    const max = 160;
    const clamped = Math.max(min, Math.min(max, tempoBpm));
    return 80 + ((clamped - min) / (max - min)) * 840;
  },
  mapAccuracyToY: (accuracyPercent: number): number => {
    const min = 60;
    const max = 100;
    const clamped = Math.max(min, Math.min(max, accuracyPercent));
    // Y axis is inverted: 100% at top (y: 60), 60% at bottom (y: 540)
    return 540 - ((clamped - min) / (max - min)) * 480;
  },
  mapDurationToRadius: (durationMinutes: number): number => {
    const clamped = Math.max(5, Math.min(45, durationMinutes));
    return 4 + ((clamped - 5) / (45 - 5)) * 10; // 4px to 14px
  },
  sampleSessions: [
    {
      id: 'take-01',
      pieceTitle: 'BWV 1004 Allemande',
      composer: 'J.S. Bach',
      date: 'Anno MMXXVI · Oct 5, 19:42',
      tempoBpm: 88,
      accuracyPercent: 94.1,
      durationMinutes: 22,
      pitchPurity: 95.2,
      timingPrecision: 12,
      editorNote: 'Measure 14: F5–G5 transition slipped flat by 14 cents at 88 BPM. Recommendation: Isolate bars 12–16 at 76 BPM.',
    },
    {
      id: 'take-02',
      pieceTitle: 'BWV 1004 Allemande',
      composer: 'J.S. Bach',
      date: 'Anno MMXXVI · Oct 4, 18:15',
      tempoBpm: 80,
      accuracyPercent: 97.4,
      durationMinutes: 30,
      pitchPurity: 98.1,
      timingPrecision: 9,
      editorNote: 'Pristine harmonic poise. Leading tone in tune within ±2 cents across all repetitions.',
    },
    {
      id: 'take-03',
      pieceTitle: 'BWV 1004 Allemande',
      composer: 'J.S. Bach',
      date: 'Anno MMXXVI · Oct 2, 21:00',
      tempoBpm: 96,
      accuracyPercent: 78.3,
      durationMinutes: 15,
      pitchPurity: 79.0,
      timingPrecision: 24,
      editorNote: 'Breakdown horizon detected. Left hand tension caused sharp fourth finger placement at 96 BPM.',
    },
    {
      id: 'take-04',
      pieceTitle: 'Telemann Fantasia 1',
      composer: 'G.P. Telemann',
      date: 'Anno MMXXVI · Oct 3, 16:30',
      tempoBpm: 92,
      accuracyPercent: 96.0,
      durationMinutes: 25,
      pitchPurity: 96.8,
      timingPrecision: 11,
      editorNote: 'Vivace passage executed with buoyant bow articulation and clean string crosses.',
    },
    {
      id: 'take-05',
      pieceTitle: 'Paganini Caprice 24',
      composer: 'N. Paganini',
      date: 'Anno MMXXVI · Sep 30, 20:10',
      tempoBpm: 112,
      accuracyPercent: 82.5,
      durationMinutes: 18,
      pitchPurity: 83.1,
      timingPrecision: 19,
      editorNote: 'Arpeggio variation: left hand shift to 7th position rushed by 35ms on downbeat.',
    },
  ],
  returnAnchor: {
    label: 'Return to Practice Stand →',
    glyph: MUSICAL_GLYPHS.fermata,
  },
  prompt: `Screen: PRISM Constellation History Scatter Plot
Device: Desktop (1440x900)
Aesthetic: 'The Living Manuscript' celestial star chart and Renaissance astronomical map on parchment.
Colors: Parchment background #F4F1EA, charcoal ink #2C2A29 for grid lines and pristine stars, crimson ink #9A2A2A for error stars and editor marks.
Typography: Playfair Display for piece titles, Geist Mono for coordinate axes (BPM, Accuracy %, Timestamps). Sharp zero-radius boxes.
Layout & Structure:
1. Top Telemetry Ledger: Minimalist header bar with monospace stats: 'CONSTELLATION LEDGER // 48 TAKES RECORDED // TOTAL DISCIPLINE: 16.4 HRS // CRITICAL THRESHOLD: 86 BPM' and filter toggles with musical glyph icons.
2. Full Canvas Celestial Scatter Plot: An astronomical coordinate map with circular declination rings and faint 5-line musical staves.
   - Horizontal Axis (X): Tempo in BPM ranging from 60 BPM to 140 BPM.
   - Vertical Axis (Y): Pitch Intonation Accuracy ranging from 60% to 100%.
   - Celestial Star Nodes: Practice sessions plotted as charcoal stars (✦, ✧) and crimson nebula dots (#9A2A2A), with star diameter proportional to session duration. Delicate dashed constellation filament lines connect takes of the same opus piece across different tempos.
3. Active Star Inspector Folio: An illuminated parchment inspection card hovering adjacent to a selected star node, detailing 'J.S. Bach - BWV 1004 Allemande', Tempo: 88 BPM, Duration: 01:42, Accuracy: 94.1%, accompanied by a handwritten crimson ink editor's mark: 'Measure 14: F5-G5 transition slipped flat by 14 cents above 84 BPM. Recommendation: Isolate bars 12-16 at 76 BPM.'
4. Spatial Return Anchor: On the right margin, a subtle manuscript link reading 'Return to Practice Stand →' with a fermata glyph (𝄐).`,
} as const;
