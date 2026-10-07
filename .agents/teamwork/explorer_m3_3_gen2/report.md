# Architectural Report: Constellation History & Composer Profile Screens

**Milestone**: Milestone 3 — Core Screens Implementation Architecture  
**Explorer**: Explorer M3-3 (Gen 2)  
**Parent Agent ID**: `5eaadbb4-8158-47fa-82fc-d97edd4b44b7`  
**Date**: 2026-10-06  

---

## Executive Summary

This report establishes the complete architecture, geometric coordinate mathematics, visual design system compliance, and drop-in code blueprints for the two primary analytical viewports in the Sonus Adaptive Musical Practice System:

1. **`ConstellationHistoryScreen`** (`apps/web/src/components/screens/constellation-history-screen.tsx`):
   - **Spatial Location**: Left Viewport `(-100vw, 0)` / Spatial target `'history'`
   - **Metaphor**: Renaissance astronomical celestial chart (*Harmonices Mundi*, Johannes Kepler 1619) on unbleached calfskin parchment (`#F4F1EA`).
   - **Coordinate Plane**: SVG viewBox `0 0 1000 600`, X-axis: Tempo Velocity (60–160 BPM), Y-axis: Performance Accuracy (60%–100% inverted).
   - **Visual Elements**: Charcoal (`#2C2A29`) and Crimson (`#9A2A2A`) star nodes whose radius scales dynamically with session duration ($4\text{px}$ to $14\text{px}$), dashed constellation filament paths grouping takes of identical opuses across practicing tempos, and a critical breakdown horizon marker at 86 BPM.
   - **Interaction**: Interactive node hover and selection revealing an illuminated marginalia inspection card featuring rubricated crimson handwritten editor notes (`Nota Editoris`).

2. **`ComposerProfileScreen`** (`apps/web/src/components/screens/composer-profile-screen.tsx`):
   - **Spatial Location**: Upper Viewport `(0, -100vh)` / Spatial target `'profile'`
   - **Metaphor**: 17th-century printed music treatise frontispiece (*Tractatus Physionomiae et Praxis*) framed by double-ruled hairline borders with classical corner bracket flourishes.
   - **Emblem**: Circular illuminated woodcut crest with concentric astronomical graduation rings, 8-point compass ticks, and central calligraphic treble clef (`𝄞`) with crimson accent mark.
   - **Two-Column Folio**:
     - *Column 1 ("The Physiognomy of Practice")*: Rehearsal telemetry ledger (Total discipline hours, articulated notes count, 14-day daily streak, intonation purity %, timing onset variance) and analytical pathology diagnosing 3 distinct player kinetic/pitch habits with microtonal badges (`♯ +5¢`, `♭ -4¢`, `𝄩 +4%`).
     - *Column 2 ("The Repertoire Ledger")*: Catalogus of studied masterworks (Bach BWV 1004 Chaconne, Telemann Fantasia 1, Paganini Caprice 24) with Roman numeral difficulty badges (`II`, `IV`, `V`), 0px radius hand-engraved progress bars, and authentic wax status stamps (`CONQUERED`, `IN ACTIVE DISCIPLINE`, `EXPERIMENTAL SANCTUARY`).
   - **Integration**: Real-time integration with Clerk auth (`useUser()`, `useClerk()`) with graceful guest audition fallback, export ledger summary action, and spatial return trigger (`panTo('practice')`).

---

## 1. Design System & Aesthetic Foundation

Both screens strictly uphold the **"Living Manuscript"** design rules established in `PROJECT.md`, `DESIGN.md`, and `apps/web/src/design-system/`:

| Dimension | Living Manuscript Specification | Implementation in Screens |
| :--- | :--- | :--- |
| **Canvas Background** | Unbleached parchment `#F4F1EA` | Root background `bg-[#F4F1EA]`, card troughs `bg-[#E9E4DA]/40` |
| **Structural Borders** | Iron gall ink `#2C2A29`, hairline rules | `border border-[#2C2A29]`, `border-2 border-[#2C2A29]`, double-rules |
| **Rubrication / Accents** | Cochineal crimson `#9A2A2A` | Breakdown horizons, error stars, wax status seals, critical notes |
| **Typography Mix** | Editorial Serif + Crisp Monospace | Headings in `Playfair Display`, telemetry in `Geist Mono`, body in `Inter` |
| **Corner Geometry** | Zero border radius (`0px`) | Strict `rounded-none`, zero modern drop shadows (`shadow-none`) |
| **Iconography** | SMuFL & Unicode Musical Glyphs | `𝄐` (Fermata return), `𝄩` (Caesura), `𝄞` (G-Clef), `✦` (Star node), `✧` (Hollow star) |

---

## 2. Architecture: `ConstellationHistoryScreen`

### 2.1 Coordinate Space & SVG Geometry

The celestial chart is rendered in a responsive SVG with `viewBox="0 0 1000 600"`:

```
(0, 0) ------------------------------------------------------------- (1000, 0)
|  Padding Top: 60px                                                         |
|  (80, 60) [100% Accuracy] --------------------- (920, 60)                  |
|     |                                              |                       |
|     |     Usable Width: 840px                      |                       |
|     |     Usable Height: 480px                     |                       |
|     |                                              |                       |
|  (80, 540) [60% Accuracy] --------------------- (920, 540)                 |
|  [60 BPM]                                       [160 BPM]                  |
|  Padding Bottom: 60px                                                      |
(0, 600) ----------------------------------------------------------- (1000, 600)
```

#### Mapping Equations:
1. **Horizontal Tempo Mapping ($X$)**:
   $$\text{clampedTempo} = \max(60, \min(160, \text{bpm}))$$
   $$X = 80 + \left(\frac{\text{clampedTempo} - 60}{160 - 60}\right) \times 840$$
   - $60\text{ BPM} \to X = 80\text{px}$
   - $86\text{ BPM (Breakdown Horizon)} \to X = 80 + \frac{26}{100} \times 840 = 298.4\text{px}$
   - $110\text{ BPM} \to X = 80 + \frac{50}{100} \times 840 = 500\text{px}$
   - $160\text{ BPM} \to X = 920\text{px}$

2. **Vertical Accuracy Mapping ($Y$)** (Inverted Cartesians):
   $$\text{clampedAcc} = \max(60, \min(100, \text{accuracy}))$$
   $$Y = 540 - \left(\frac{\text{clampedAcc} - 60}{100 - 60}\right) \times 480$$
   - $100\% \text{ Accuracy} \to Y = 60\text{px}$ (Highest point)
   - $90\% \text{ Accuracy} \to Y = 540 - \frac{30}{40} \times 480 = 180\text{px}$
   - $80\% \text{ Accuracy} \to Y = 540 - \frac{20}{40} \times 480 = 300\text{px}$
   - $60\% \text{ Accuracy} \to Y = 540\text{px}$ (Base point)

3. **Duration to Star Radius Mapping ($R$)**:
   $$\text{clampedMins} = \max(5, \min(45, \text{durationMinutes}))$$
   $$R = 4 + \left(\frac{\text{clampedMins} - 5}{45 - 5}\right) \times 10 \quad (4\text{px} \le R \le 14\text{px})$$

### 2.2 Constellation Filaments

Takes belonging to the same composition (`pieceTitle`) are grouped and ordered by tempo velocity. SVG `<path>` elements trace the trajectory of execution:
- **Baseline Styling**: `stroke="#2C2A29" strokeOpacity="0.35" strokeDasharray="4 3" strokeWidth="1.25"`
- **Active / Focused Piece**: When an opus is selected or hovered, the path illuminates with `stroke="#9A2A2A" strokeOpacity="0.9" strokeWidth="2" strokeDasharray="none"`
- **Sequence Indicators**: Midpoints along each segment display miniature sequence badges (`seq.1`, `seq.2`) in `Geist Mono`.

### 2.3 Star Node Taxonomy

Nodes are categorized into three historical celestial classifications:
1. **Pristine Auric Stars** ($\ge 95\%$ accuracy):
   - Outer golden halo ring `<circle r={R+4} stroke="#C8A858" strokeWidth="1" />`
   - Center filled star glyph `✦` in `#C8A858`
2. **Disciplined Charcoal Stars** ($85\% - 94\%$ accuracy):
   - Solid charcoal circle `#2C2A29` with contrasting center glyph
3. **Breakdown / Critical Nebula Stars** ($<85\%$ accuracy or exceeding breakdown horizon):
   - Rubricated crimson circle `#9A2A2A`
   - Outer pulsating dashed ring `<circle r={R+8} stroke="#9A2A2A" strokeDasharray="3 3" />`
   - Center star glyph `✦` in `#F4F1EA`

### 2.4 Illuminated Marginalia Tooltip Folio

The inspection folio (`Folium Inspectionis Stellae`) is rendered in an illuminated manuscript card framed with 1px charcoal lines:
- **Heading**: Opus Title (`Playfair Display`), Composer, Date, and Take ID badge.
- **Telemetry Matrix**: 2x2 grid displaying Tempo (BPM), Accuracy (%), Pitch Purity (%), and Timing Precision (ms).
- **Rubricated Editor Note** (`Nota Editoris`):
  > *"Measure 14: F5–G5 transition slipped flat by 14 cents at 88 BPM. Recommendation: Isolate bars 12–16 at 76 BPM."*
- **Action**: "Rehearse Passage on Practice Stand" button invoking `useSpatialNavigation().panTo('practice')`.

---

## 3. Architecture: `ComposerProfileScreen`

### 3.1 Frontispiece Layout & Heraldic Crest

The screen embodies a 17th-century printed treatise frontispiece (*Tractatus Physionomiae et Praxis*):
1. **Double Outer Border**: 2px outer charcoal border with internal hairline rule and classical corner brackets (`⌜ ⌝ ⌞ ⌟`).
2. **Woodcut Monogram Crest**:
   - An 88px SVG circular emblem engraved with 3 concentric rings, 8-point astrolabe graduation lines, and an inner parchment disc.
   - Centerpiece: SMuFL G-Clef (`𝄞`) with `MMXXVI` crimson rubrication.
3. **Performer Bio & Auth Seal**:
   - Name: `Maestro Yash` (integrated with Clerk `useUser()`, fallback to guest virtuoso).
   - Monospace verification: `REGISTRY: USR_MMXXVI // STATUS: AUTHENTICATED // DISCIPLINE ACTIVE`.
   - Epigraph: *"Virtus in arte non nisi assiduo labore et studio comparatur."*

### 3.2 Two-Column Folio Structure

#### Column 1: The Physiognomy of Practice (*Physiognomia Exercitationis*)
- **Discipline Ledger Grid**:
  - Total Practice: `48.4 hrs` (`32,490 notes articulated`)
  - Daily Constancy: `14 Days` (`Non omisso die`)
  - Intonation Purity: `91.4%` (Harmonic poise $\pm 3\text{ cents}$)
  - Timing Precision: `±14 ms` (Mean onset latency)
- **Velocity Horizons**:
  - Max Controlled Tempo: `112 BPM`
  - Breakdown Horizon: `120 BPM` (Crimson highlighted)
- **Diagnosed Habitus & Kinetic Biases**:
  Analytical findings rendered with rubricated microtonal tags:
  1. `[♯ +5¢]` *Tends sharp (+5 cents) on ascending leading tones before tonic resolutions.*
  2. `[♭ -4¢]` *Slightly flat on sustained fourth-finger extensions in higher positions.*
  3. `[𝄩 +4%]` *Rushes tempo by 4% immediately following whole-measure rests.*

#### Column 2: The Repertoire Ledger (*Index Operum & Catalogus*)
- **Catalog Filter**: `[ All (3) ]`, `[ Active (2) ]`, `[ Conquered (1) ]`
- **Repertoire Entries**:
  1. **Bach**: *Partita No. 2 in D minor (BWV 1004) - Chaconne*
     - Difficulty: `Gradus IV` | Mastery: `78%` | Target: `60 BPM` | Last: `Anno MMXXVI · Oct 5`
     - Status: `IN ACTIVE DISCIPLINE` (Crimson wax stamp)
  2. **Telemann**: *12 Fantasias for Solo Violin (No. 1 in B-flat)*
     - Difficulty: `Gradus II` | Mastery: `96%` | Target: `92 BPM` | Last: `Anno MMXXVI · Oct 3`
     - Status: `CONQUERED` (Charcoal wax stamp)
  3. **Paganini**: *24 Caprices for Solo Violin (Op. 1, No. 24 in A minor)*
     - Difficulty: `Gradus V` | Mastery: `64%` | Target: `120 BPM` | Last: `Anno MMXXVI · Sep 29`
     - Status: `EXPERIMENTAL SANCTUARY` (Muted ink stamp)
- **Mastery Progress Bars**: Zero-radius hairline rectangular troughs with solid ink fill percentage.

### 3.3 Colophon & Actions

- **Export Folio Ledger**: Copies formatted text summary to clipboard with feedback toast (`✓ Folio Copied`).
- **Audio Calibration**: Navigates to tuning viewport (`panTo('tuning')`).
- **Depart Sanctuary**: Dynamically triggers `onExitGuest()` in guest mode or Clerk `signOut()` if authenticated.
- **Center Return Anchor**: Prominent `↓ Return to Practice Stand [S / Esc]` button.

---

## 4. Integration Blueprint for Worker M3

### 4.1 Target File Locations

| File | Purpose |
| :--- | :--- |
| `apps/web/src/components/screens/constellation-history-screen.tsx` | Celestial Scatter Plot Viewport |
| `apps/web/src/components/screens/composer-profile-screen.tsx` | 17th-Century Treatise Profile Viewport |
| `apps/web/src/components/screens/index.ts` | Barrel exports for screen modules |
| `apps/web/src/app.tsx` | Mount screens into `SpatialContainer` slots |

### 4.2 Blueprint for `apps/web/src/components/screens/index.ts`

```typescript
export * from './constellation-history-screen'
export * from './composer-profile-screen'
```

### 4.3 Wiring into `apps/web/src/app.tsx`

```tsx
import { LivePracticeView } from '@/components/live-practice-view'
import {
  SpatialProvider,
  SpatialContainer,
  FolioNavAnchors,
  CelestialCompass,
} from '@/components/spatial'
import {
  ConstellationHistoryScreen,
  ComposerProfileScreen,
} from '@/components/screens'

export interface AppProps {
  isGuest?: boolean
  onExitGuest?: () => void
}

function PracticeStandView({ isGuest, onExitGuest }: AppProps) {
  // ... existing PracticeStandView ...
}

function AppCanvas({ isGuest, onExitGuest }: AppProps) {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#F4F1EA] text-[#2C2A29] select-none">
      {/* Continuous 2D Framer Motion Spatial Canvas */}
      <SpatialContainer
        practiceScreen={<PracticeStandView isGuest={isGuest} onExitGuest={onExitGuest} />}
        profileScreen={<ComposerProfileScreen isGuest={isGuest} onExitGuest={onExitGuest} />}
        historyScreen={<ConstellationHistoryScreen />}
      />

      {/* Fixed Marginal Triggers & Celestial Astrolabe Minimap */}
      <FolioNavAnchors />
      <CelestialCompass />
    </div>
  )
}

export default function App(props: AppProps) {
  return (
    <SpatialProvider>
      <AppCanvas {...props} />
    </SpatialProvider>
  )
}
```

---

## 5. Artifact Manifest

All code blueprints have been generated and validated in this workspace:
- `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_constellation_history.tsx`
- `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_composer_profile.tsx`
- `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\report.md`
- `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\handoff.md`
