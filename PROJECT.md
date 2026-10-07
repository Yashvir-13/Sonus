# Project: PRISM Adaptive Musical Practice System

## Architecture
- **2D Spatial Single-Page Architecture**: Replaces traditional routing with a continuous 2D plane powered by Framer Motion (`stiffness: 70, damping: 18`).
  - **Center `(0, 0)`**: Practice Stand (`LivePracticeView`, pitch ribbon, real-time performance feedback).
  - **Up `(0, -1)`**: Composer's Bio Profile (`ComposerProfileFolio`, rehearsal physiognomy, repertoire ledger).
  - **Left `(-1, 0)`**: Constellation History (`ConstellationHistoryView`, tempo vs. accuracy celestial scatter plot).
  - **Right `(1, 0)`**: Setup / Tuning Ritual (`TuningRitualView`, Sacred Astrolabe intonation dial, Mic vs. MIDI detection).
- **Navigation Modalities**:
  - Edge Folio Anchors (subtle manuscript margin links with musical glyphs: `← 𝄌 Historia`, `↑ 𝄞 Persona`, `→ 𝄐 Harmonia`).
  - Keyboard Controls (Arrow keys, WASD, and `Escape` to re-center).
  - Celestial Compass Mini-map (interactive 4-point glyph pad in bottom margin).
  - URL Hash Sync (`#practice`, `#profile`, `#history`, `#tuning`).
- **Authentication & Entry Gateway**:
  - Signed-out state presents the Living Manuscript Landing Page (`LandingPage`) with dynamic SVG ink bleed bloom (`#ink-bleed`), historical marginalia, and Clerk `<SignIn />` with custom Living Manuscript theme.
  - "Audition as Guest" CTA enables instant entry to the 2D Spatial Stand for unauthenticated musicians and automated Playwright test verification.
- **Design System ("Living Manuscript")**:
  - Strict zero border radius (`--radius: 0`), zero SaaS drop shadows, structural hairline borders (`1px solid #2C2A29`).
  - Colors: Parchment `#F4F1EA`, Charcoal `#2C2A29`, Crimson `#9A2A2A`, Warm Parchment `#E9E4DA`, Muted Ink `#7E7570`.
  - Typography: `Playfair Display` (editorial serif headings), `Geist Mono` (telemetry/monospaced data), `Inter` (body labels).
  - Musical Glyphs: SMuFL standard / Unicode glyphs (`𝄐`, `𝄩`, `𝄞`, `𝄢`, `𝄡`, `♮`, `♯`, `♭`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stitch UI Generation | Generate UI screen designs via Google Stitch MCP for Landing, Tuning, Profile, History | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Spatial Single-Page Canvas | Framer Motion 2D spatial panning camera container, coordinate state, and navigation triggers | M2 | ORIGINAL_REQUEST §R2 |
| 3 | Living Manuscript Landing Page | Ink bleed bloom effect, atmospheric manuscript typography, marginalia, and styled Clerk Auth | M3 | ORIGINAL_REQUEST §R3 |
| 4 | Setup & Tuning Ritual | Sacred Astrolabe intonation dial (-50 to +50 cents needle), Mic vs MIDI auto-detection, A4 pitch standard | M3 | ORIGINAL_REQUEST §R3 |
| 5 | Constellation History | Celestial scatter plot (tempo vs accuracy), interactive star nodes, constellation filaments, editor note tooltips | M3 | ORIGINAL_REQUEST §R3 |
| 6 | Composer's Bio Profile | 17th-century printed treatise layout, illuminated crest, practice telemetry, and repertoire ledger | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Playwright E2E & Visual Proof | Agent-as-Judge automated testing, clean Vite dev server run, and screenshot captures of all acceptance criteria | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Stitch MCP UI Design Generation | Generate designs for Landing, Tuning Ritual, Profile, and History via Stitch MCP | none | DONE |
| 2 | Spatial Single-Page Architecture | Build Framer Motion 2D panning canvas, coordinate controller, edge folio anchors, keyboard listeners, minimap | M1 | DONE |
| 3 | Core Screens Implementation | Implement Landing Page (ink bleed + Clerk), Tuning Ritual (astrolabe + mic/midi), Constellation History (scatter plot), Composer's Bio | M2 | DONE |
| 4 | Playwright E2E & Visual Verification | Run Vite dev server, execute Playwright agent-as-judge tests, capture screenshots of all acceptance criteria | M3 | DONE |

## Interface Contracts

### Spatial Coordinates ↔ Canvas Container
```typescript
export type SpatialTarget = 'practice' | 'profile' | 'history' | 'tuning';

export interface SpatialPosition {
  x: number; // in -100vw units: center=0, left=100vw, right=-100vw
  y: number; // in -100vh units: center=0, up=100vh
  target: SpatialTarget;
}

export interface SpatialNavigationContextValue {
  currentTarget: SpatialTarget;
  panTo: (target: SpatialTarget) => void;
  isPanning: boolean;
}
```

### Tuning Ritual ↔ Audio Hardware
```typescript
export type AudioInputMode = 'mic' | 'midi';

export interface TuningState {
  mode: AudioInputMode;
  detectedPitch: string | null;     // e.g. "A4"
  detectedFrequency: number | null; // e.g. 440.2
  centsDeviation: number;           // -50 to +50
  targetFrequency: number;          // default 440.0
  inTune: boolean;                  // abs(centsDeviation) <= 3
  signalLevel: number;              // 0 to 1
}
```

### Constellation History ↔ Practice Data
```typescript
export interface PracticeSessionNode {
  id: string;
  pieceTitle: string;
  composer: string;
  date: string;
  tempoBpm: number;        // X axis: 60 - 160
  accuracyPercent: number; // Y axis: 60 - 100
  durationMinutes: number; // Node radius: 4 - 14px
  pitchPurity: number;     // %
  timingPrecision: number; // ms
  editorNote?: string;
}
```

### Profile Folio ↔ User State
```typescript
export interface ComposerProfile {
  name: string;
  monogram: string;
  title: string;
  totalPracticeHours: number;
  totalNotesArticulated: number;
  overallIntonationPurity: number; // e.g. 94.2%
  dominantHabits: string[];
  repertoire: Array<{
    title: string;
    composer: string;
    masteryPercent: number;
    lastPracticed: string;
  }>;
}
```

## Code Layout
- `apps/web/src/components/spatial/`:
  - `spatial-container.tsx`: Framer Motion 2D camera viewport
  - `folio-nav-anchors.tsx`: Marginal edge navigation links (`← Historia`, `↑ Persona`, `→ Harmonia`)
  - `celestial-compass.tsx`: 4-point glyph minimap pad
  - `spatial-context.tsx`: Navigation context provider and hooks
- `apps/web/src/components/screens/`:
  - `landing-screen.tsx`: Landing page with ink bleed filter and styled Clerk `<SignIn />`
  - `tuning-ritual-screen.tsx`: Sacred Astrolabe dial and Mic vs MIDI detector
  - `constellation-history-screen.tsx`: Celestial scatter plot and session nodes
  - `composer-profile-screen.tsx`: Manuscript folio profile and repertoire ledger
- `apps/web/src/components/ui/`:
  - `ink-bleed-filter.tsx`: SVG turbulence & displacement filter `#ink-bleed`
  - `illuminated-card.tsx`: Zero-radius border card with manuscript corners
- `apps/web/src/types/`: Shared TypeScript interface definitions
- `apps/web/src/tests/` / `e2e/`: Playwright verification scripts and test artifacts
