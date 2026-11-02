# Archival Music Desk Design System (`apps/web`)

Activation: files under `apps/web/src/**/*.{ts,tsx,css}`
Figma Origin: `https://www.figma.com/design/zY5UlhIZAQxmeBcW9MTq1q` (Direction 1: Archival Music Desk)

## 1. Aesthetic Mandate

- **Visual Theme**: 19th-Century Conservatory Music Desk & Urtext Engraving.
- **Core Mood**: Austere instrumental craftsmanship, tactile paper & brass, quiet practice discipline.
- **Strict Anti-Patterns**:
  - NEVER use cyber/neon gradients, laser lines, dark-mode purple/cyan glows, or saturated tech-blue SaaS elements.
  - NEVER output marketing hyperbole or AI buzzwords ("revolutionary neural music coach"). Describe audio engineering and MIR telemetry plainly.
  - NEVER prompt or access user microphones unprompted on page load (ADR 0001 acoustic privacy).

---

## 2. Color Tokens & Textures

### Light Mode (Pressed Cotton Ivory Parchment)
- **Canvas / Background**: `#F7F5F0` (Pressed Cotton Ivory)
- **Cards & Elevated Stands**: `#FAF8F3` (Linen Parchment), `#FCFBF8` (Elevated White), `#EFECE6` (Muted Linen)
- **Primary Ink**: `#242321` (Iron Gall Charcoal Ink)
- **Secondary Ink / Labels**: `#736E65` (Muted Driftwood), `#A09A8F` (Subtle Fog)
- **Hairline Borders**: `#E2DDD3` (Ash Hairline), `#D9D3C7` (Subtle Ash)
- **Canvas Stipple Texture**: `radial-gradient(#E8E3D9 1px, transparent 1px) 24px 24px`

### Dark Mode (Smoked Ebony Conservatory Nocturne)
- **Canvas / Background**: `#141312` (Smoked Ebony)
- **Cards & Elevated Stands**: `#1E1C1A` (Walnut Charcoal), `#24221F` (Elevated Ebony)
- **Primary Ink**: `#EDE8DF` (Ivory Pearl)
- **Secondary Ink / Labels**: `#A39C8F` (Warm Driftwood), `#857F73` (Fog Grey)
- **Hairline Borders**: `#38342E` (Charcoal Hairline)
- **Canvas Stipple Texture**: `radial-gradient(#2A2723 1px, transparent 1px) 24px 24px`

### Functional Accents (Universal)
- **Caliper Playhead / Zero-Latency Hit Point**: `#9A2A2A` / `#A04B32` (Bookbinder Terracotta)
- **Left-Hand (LH) Piano Voicings**: `#A04B32` (Bookbinder Terracotta)
- **Right-Hand (RH) Piano Voicings**: `#3B6E57` (Patina Jade / Muted Sage)
- **Verified Intonation / On-Pitch Badges**: `#4A6B5B` (Muted Sage Green), text `#246A38`, badge bg `#EAF2EC`
- **Timing Drag (+ms) / Caution Alerts**: `#A36B24` (Ochre Warning), text `#9A6214`, badge bg `#FFF4E5`
- **Hardware / Knobs / Tuning Fork / Metronome Inlays**: `#C5A059` (Burnished Brass), light `#DFC07A`, dark `#8F7239`

### Paper Vellum Texture Overlay
- SVG inline fractal noise filter overlay with `feTurbulence` (`baseFrequency="0.75"`, `numOctaves="3"`, `stitchTiles="stitch"`), fixed full-bleed with `opacity-[0.032]` (light) and `opacity-[0.022]` (dark).

---

## 3. Typography Pairings

| Role | Family | Variable / Class | Visual Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Scores & Headlines** | Cormorant Garamond | `--font-serif`, `font-serif` | 400 / 600 / 700 / Italic | Piece titles, epigraphs, section headlines |
| **Telemetry & HUD** | Geist Mono | `--font-mono`, `font-mono` | 400 / 500 / 600 | BPM, pitch cents, frets, latency ms, chord formulas |
| **Brand Wordmark** | Space Grotesk | `--font-brand`, `font-bold` | 700 Bold | Logo (`§ SONUS`), chapter numbers, step numerals |
| **Body & UI Controls** | Inter & DM Sans | `--font-sans`, `--font-display` | 300 / 400 / 500 | Navigation links, descriptions, button labels |
| **Musical Notation** | SMuFL standard | Vector SVG | Engraved | Clefs, braces, noteheads, accidentals |

---

## 4. Multi-Instrument Rendering Invariants

### Guitar Tablature & Fretboard Diagrams
1. **Fret Coordinates vs. Finger Separation**:
   - Never combine frets with finger numbering into one ambiguous string (e.g. G chord frets are `3-2-0-0-0-3`, fingers are `2-1-0-0-0-3`).
   - Store and handle `frets: Array<number | null>` and `fingers: Array<number | 'T' | null>` independently.
2. **Vector Indicators Above Nut**:
   - Open strings: Vector circle `O` above nut line.
   - Muted strings: Vector cross `X` above nut line.
3. **Fret Dots & Barre Spans**:
   - Embed finger digit (`1`, `2`, `3`, `4`, `T`) centered inside circular fret dot.
   - Barre chords: Render continuous rounded capsule pill spanning fretted strings.
4. **Base Fret Ordinals**:
   - When base fret > 1, show English ordinal suffix (e.g. `1st`, `2nd`, `3rd`, `4th`).

### Piano Keyboard & Grand Staff Notation
1. **Instrument Isolation**:
   - NEVER display a guitar fretboard diagram in Piano mode. Route through `<ActiveVoicingDisplay />`.
2. **2-Pass SVG Keyboard Stacking**:
   - Pass 1: Render all 15 white keys with Ivory fill (`#F7F5F0`).
   - Pass 2: Render all 10 black keys with Ebony fill (`#1E1C1A`) over white keys to guarantee black keys layer on top without clipping.
3. **Polyphonic Hand Distinction**:
   - Left Hand (LH): Terracotta fill (`#A04B32`) with white badge/label.
   - Right Hand (RH): Patina Jade fill (`#3B6E57`) with white badge/label.
4. **Middle C Anchor**:
   - Render distinctive white indicator dot on Middle C (MIDI 60 / $C_4$).
5. **Grand Staff Rendering**:
   - Render Treble Clef and Bass Clef staves joined by calligraphic brace.
   - Calculate notehead coordinates ($y = 218 - 5 \times \text{step}$) with dynamic ledger line synthesis.
   - Provide sub-tab toggles: `[KEYBOARD | STAFF | BOTH]`.

---

## 5. Interaction & Physical Modeling Audio Invariants

1. **Staff Scroll Progress Bar**:
   - Fixed at top of viewport; 5 delicate staff lines carry a gliding burnished brass G-clef tracking scroll progress with spring physics.
2. **Smooth Scrolling**:
   - Driven by Lenis smooth scroll with 60fps rAF and `useReducedMotion()` accessibility support.
3. **Physical Modeling Synthesis**:
   - Guitar: Karplus-Strong string synthesis (fractional delay lines, windowed excitation bursts, frequency damping).
   - Piano: Multi-partial additive synthesis with Fletcher-Rossing inharmonicity dispersion ($f_k = k f_0 \sqrt{1 + B k^2}$) across up to 8 partials, velocity strike curves, and dual-stage decay.
   - Metronome Click: Dual-cavity wooden block resonance ($1150\text{ Hz} / 850\text{ Hz}$, $Q=12$).
   - A440 Tuning Fork: Pure sine wave oscillator with physical exponential vibrational decay.
4. **Safety & Permission**:
   - Web Audio AudioContext is suspended until first user gesture (`audioEngine.unlock()`).
