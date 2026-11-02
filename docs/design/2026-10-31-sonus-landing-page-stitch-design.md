# SONUS: Precision Landing Page Specification & Google Stitch Design System

**Project**: SONUS (`projects/4513414872048669454`)  
**Document**: Landing Page UI Design Specification & Screen Artifacts  
**Date**: 2026-10-31  
**Aesthetic**: Archival Conservatory (Ivory Parchment, Iron Gall Charcoal, Bookbinder Terracotta, Muted Sage)  
**Strict Mandate**: Zero AI hype / verbosity. Zero neon or cyberpunky colors. Pure instrumental craftsmanship with smooth animations.

---

## 1. Executive Intent & Design Philosophy

The SONUS landing page is designed for serious instrumentalists (acoustic/electric guitarists and pianists) who demand austere, distraction-free practice tools. Traditional music education values focus, precision, and tactile authenticity; typical modern SaaS landing pages are crowded with marketing hyperbole, badges, and cyber gradients.

SONUS rejects this:
- **No Overhyped AI Bullshit**: No claims of "revolutionary neural genius" or paragraphs of robotic marketing text. We state the instrument engineering plainly: real-time acoustic pitch detection, synchronized flowing tablature and grand staff, and habit telemetry.
- **Traditional Palette & Paper Texture**:
  - Pressed Cotton Ivory (`#F7F5F0`) as the primary paper surface.
  - Linen Panels (`#FAF8F3`, `#FCFBF8`, `#EFECE6`) for elevated score cards.
  - Deep Iron Gall Charcoal Ink (`#242321`) for high-contrast legible engraving.
  - Bookbinder Terracotta (`#9A2A2A`) for playhead calipers and tactile emphasis.
  - Muted Sage (`#4A6B5B`) for verified intonation and on-pitch hit indicators.
  - Soft hairline borders (`#E2DDD3`, `#D9D3C7`) with 1px engraved stipple canvas dotting.
- **Conservatory Nocturne (Dark Mode)**:
  - Smoked Ebony (`#141312`) and Walnut Charcoal (`#1E1C1A`).
  - Warm antique brass and ivory pearl typography (`#EDE8DF`).
  - Never neon, never cyan/magenta lasers.
- **Smooth Analog Mechanics**:
  - Horizontally flowing score teaser gliding beneath a center caliper playhead.
  - Analog VU needle responding to acoustic input.
  - Tactile segmented buttons for instrument mode (`GUITAR TAB` / `PIANO STAFF`).
  - Clerk-ready authentication triggers ("Open Music Stand", "Enter Conservatory").

---

## 2. Google Stitch Project & Screen Specifications

### 2.1 Stitch Project Identification
- **Stitch Project ID**: `projects/4513414872048669454` (`SONUS`)
- **Stitch Workspace Channel**: `Landing Page v1 - Archival Parchment`

### 2.2 Generated Screen Artifacts

| Screen Name | File Path | Aspect Ratio | Focus |
| :--- | :--- | :--- | :--- |
| **Hero & Flowing Stand Preview** | `docs/design/screens/sonus_landing_hero_ivory.jpg` | 16:9 | Archival ivory hero, monospace navigation, flowing score ribbon teaser, center terracotta playhead caliper, analog VU meter, ±4ms intonation badge. |
| **Craftsmanship & Telemetry Pillars** | `docs/design/screens/sonus_landing_craftsmanship.jpg` | 16:9 | Triad cards: Continuous Ribbon (score engraving), Live Acoustic Detection (microtonal tuning & latency), Habit Pattern Telemetry, woodcut Bm barre fretboard. |
| **Conservatory Nocturne (Dark Mode)** | `docs/design/screens/sonus_landing_dark_nocturne.jpg` | 16:9 | Evening chamber atmosphere, warm reading lamp, smoked ebony background, warm brass hardware knobs, gold-ivory flowing grand staff and tabs. |

*Web static copies are also placed at `apps/web/public/screens/`.*

---

## 3. Stitch Design Tokens (`DESIGN.md` Reference)

```yaml
tokens:
  color:
    surface:
      canvas: "#F7F5F0"
      panel_primary: "#FAF8F3"
      panel_elevated: "#FCFBF8"
      panel_muted: "#EFECE6"
      border_hairline: "#E2DDD3"
      border_subtle: "#D9D3C7"
    dark_surface:
      canvas: "#141312"
      panel_primary: "#1E1C1A"
      panel_elevated: "#24221F"
      border_hairline: "#38342E"
    ink:
      primary: "#242321"
      muted: "#736E65"
      subtle: "#A09A8F"
      dark_primary: "#EDE8DF"
      dark_muted: "#A39C8F"
    accent:
      terracotta: "#9A2A2A"
      sage_green: "#4A6B5B"
      antique_brass: "#C2A675"
      ochre_warning: "#A36B24"
  typography:
    brand: "Space Grotesk, sans-serif"
    display: "DM Sans, serif"
    ui: "Inter, sans-serif"
    telemetry: "Geist Mono, monospace"
  texture:
    canvas_stipple: "radial-gradient(#E8E3D9 1px, transparent 1px) 24px 24px"
    dark_stipple: "radial-gradient(#2A2723 1px, transparent 1px) 24px 24px"
```

---

## 4. Page Architecture & Section Decomposition

### 4.1 Austere Top Navigation Bar
- **Wordmark**: `§ SONUS` in letterspaced bold monospace.
- **Section Links**: `Music Stand`, `Library & Repertoire`, `Telemetry & MIR`, `Method`.
- **Theme Switcher**: Tactile Ivory / Smoked Ebony toggle.
- **Action CTA**: Tactile terracotta button `Enter Conservatory` (connected to Clerk authentication).

### 4.2 Hero Section: The Music Stand for Serious Instrumentalists
- **Eyebrow Tag**: `§ SONUS CONSERVATORY • PRECISION ADAPTIVE PRACTICE`
- **Headline**: *The Music Stand for Serious Instrumentalists*
- **Subhead**: *Continuous flowing notation with real-time acoustic pitch and timing verification. Zero distractions, zero marketing clutter.*
- **Interactive Teaser Stand**:
  - Horizontal musical ribbon with live animated glide effect.
  - Dual instrument preview: 6-line Guitar Tablature and Piano Grand Staff.
  - Center caliper playhead in bookbinder terracotta (`#9A2A2A`).
  - Active hit registration badge: `✓ +3ms VERIFIED` in muted sage (`#4A6B5B`).
  - Analog VU meter showing microtonal intonation (`D4 293.7Hz ±0c`, `±4ms Heritage Steady`).
- **Tactile CTAs**:
  - Primary: `Open Music Stand` (Clerk auth or direct studio launch).
  - Secondary: `Explore Repertoire Library` (browses Bach, Satie, Shostakovich, Pachelbel).

### 4.3 Three Pillars of Precision Craftsmanship
1. **01 Continuous Flowing Ribbon**:
   - Both 6-line guitar tablature with string-by-string fret indices and piano grand staff with dual clefs.
   - Synchronized to true audio context clocks and BPM without stutter.
2. **02 Live Acoustic Microtonal MIR**:
   - Zero-latency (<20ms) microphone analysis.
   - Real-time intonation delta ($\pm\text{cents}$) and temporal attack latency ($\pm\text{ms}$).
   - Ephemeral in-memory audio processing with strict acoustic privacy (ADR 0001).
3. **03 Longitudinal Habit Telemetry**:
   - Bayesian Knowledge Tracing of chord voicings.
   - Diagnoses tempo rushing, dragging, and transitional string drops.

### 4.4 Woodcut Chord & Fretboard Anatomy
- High-contrast engraved chord diagram (`Bm Barre 2nd Fret`).
- String-by-string fingering notation (`1-3-4-2-1`), muting glyphs (`x`), and pitch spelling (`Formula: 1 - b3 - 5`).

### 4.5 Repertoire Showcase
- Real classical and jazz progressions:
  - *Gymnopédie No. 1* — Erik Satie (Piano Grand Staff)
  - *Shostakovich Waltz No. 2* — Dmitri Shostakovich (Piano Grand Staff)
  - *Autumn Leaves* — Jazz Standard (Guitar Tablature)
  - *Knockin' Cadence* — Folk Anthem (Guitar Tablature)

### 4.6 Quiet Conservatory Footer
- Monospace edition markings: `§ SONUS DIGITAL STAND • BUILT FOR INSTRUMENTAL MASTERY`.
- Privacy note: `Acoustic audio is processed ephemerally in-memory and never retained on servers.`
