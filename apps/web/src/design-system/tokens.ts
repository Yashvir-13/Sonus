/**
 * Living Manuscript Design Tokens
 * 
 * Foundational tokens for the PRISM Adaptive Musical Practice System.
 * Combines 17th-century printed music treatises, Renaissance manuscripts,
 * dynamic iron gall ink, and high-precision acoustic telemetry.
 */

export const LIVING_MANUSCRIPT_COLORS = {
  /** Unbleached calfskin parchment canvas background */
  parchment: '#F4F1EA',
  /** Aged vellum, recessed inputs, ledger trough */
  parchmentSecondary: '#E9E4DA',
  /** Iron gall / lampblack charcoal ink for structural lines & typography */
  charcoal: '#2C2A29',
  /** Rubricated cochineal crimson ink for active needles, errors & wax seals */
  crimson: '#9A2A2A',
  /** Faint graphite wash for measure numbers and telemetry labels */
  mutedInk: '#7E7570',
  /** Beaten gold leaf accent for pristine take aureoles */
  goldLeaf: '#C8A858',
} as const;

export type LivingManuscriptColor = keyof typeof LIVING_MANUSCRIPT_COLORS;

export const LIVING_MANUSCRIPT_FONTS = {
  /** Editorial serif for titles, opus designations, performer names */
  serif: "'Playfair Display', Georgia, serif",
  /** Monospace font for telemetry, frequencies, cents, and timestamps */
  mono: "'Geist Mono', monospace",
  /** Clean neutral sans-serif for functional UI labels */
  sans: "'Inter', sans-serif",
  /** Secondary editorial serif */
  newsreader: "'Newsreader', Georgia, serif",
} as const;

export const LIVING_MANUSCRIPT_GEOMETRY = {
  /** Strict zero border radius: sharp, guillotine-trimmed paper edges */
  radius: '0px',
  /** Structural hairline borders */
  borderHairline: '1px solid #2C2A29',
  /** Classical double rules */
  borderDouble: '3px double #2C2A29',
  /** Outer concentric frame border */
  borderConcentricOuter: '2px solid #2C2A29',
  /** Inner concentric frame border */
  borderConcentricInner: '1px solid #2C2A29',
  /** Zero modern SaaS drop shadows */
  boxShadow: 'none',
  /** 5-line musical staff spacing in pixels */
  staffLineSpacing: 20,
  staffTotalHeight: 100, // 5 lines * 20px
} as const;

/**
 * Standard SMuFL and Unicode musical glyphs used across the application
 * in place of generic modern SaaS iconography.
 */
export const MUSICAL_GLYPHS = {
  /** Fermata: pause, hold, return anchor */
  fermata: '𝄐',
  /** Caesura: break, gap, disconnect */
  caesura: '𝄩',
  /** G-Clef (Treble): Persona, Voice, Violin */
  gClef: '𝄞',
  /** F-Clef (Bass): Historia, Cello, Archive */
  fClef: '𝄢',
  /** C-Clef (Alto/Tenor): Harmonia, Viola, Calibration */
  cClef: '𝄡',
  /** Natural: in tune (±3 cents), harmonic equilibrium */
  natural: '♮',
  /** Sharp: high deviation (+ cents) */
  sharp: '♯',
  /** Flat: low deviation (- cents) */
  flat: '♭',
  /** Coda: jump target, section anchor */
  coda: '𝄌',
  /** Segno: sign marker */
  segno: '𝄋',
  /** Pristine practice take star node */
  starNode: '✦',
  /** Moderate practice take star node */
  starHollow: '✧',
} as const;

export type MusicalGlyphKey = keyof typeof MUSICAL_GLYPHS;

/**
 * 2D Spatial Single-Page Motion Physics & Camera Coordinates
 * Powering Framer Motion 2D camera panning on the infinite manuscript canvas.
 */
export const SPATIAL_MOTION_CONFIG = {
  /** Physics configuration for smooth, deliberate treatise page turning */
  spring: {
    stiffness: 70,
    damping: 18,
    mass: 1,
  },
  /**
   * Screen plane translation units.
   * Camera coordinates pan the canvas container:
   * - Practice (Center): (0, 0)
   * - Profile (Up): Container translates down (y: 100vh) to reveal upper screen
   * - History (Left): Container translates right (x: 100vw) to reveal left screen
   * - Tuning (Right): Container translates left (x: -100vw) to reveal right screen
   */
  coordinates: {
    practice: { x: 0, y: 0 },
    profile: { x: 0, y: 1 },
    history: { x: 1, y: 0 },
    tuning: { x: -1, y: 0 },
  },
} as const;

export type SpatialScreenTarget = keyof typeof SPATIAL_MOTION_CONFIG.coordinates;
