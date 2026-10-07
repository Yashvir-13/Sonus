# Handoff Report: Navigation Triggers & Context Architecture (Milestone 2)

**Agent**: Explorer M2-2  
**Recipient**: Worker M2 & Orchestrator  
**Working Directory**: `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_2\`  
**Target Milestone**: Milestone 2 — Spatial Single-Page Architecture  

---

## 1. Observation

1. **Tokens and Coordinates**:
   - `apps/web/src/design-system/tokens.ts` lines 92–113:
     ```typescript
     export const SPATIAL_MOTION_CONFIG = {
       spring: { stiffness: 70, damping: 18, mass: 1 },
       coordinates: {
         practice: { x: 0, y: 0 },
         profile: { x: 0, y: 1 },
         history: { x: 1, y: 0 },
         tuning: { x: -1, y: 0 },
       },
     } as const;
     ```
   - `apps/web/src/design-system/tokens.ts` lines 59–84 defines `MUSICAL_GLYPHS`:
     - `fermata: '𝄐'`, `coda: '𝄌'`, `gClef: '𝄞'`, `fClef: '𝄢'`, `natural: '♮'`, `starNode: '✦'`.
   - `apps/web/src/design-system/tokens.ts` lines 9–22 and 37–53 defines colors (`#F4F1EA` parchment, `#2C2A29` charcoal, `#9A2A2A` crimson, `#E9E4DA` warm parchment) and geometry (`radius: '0px'`, `borderHairline: '1px solid #2C2A29'`, `boxShadow: 'none'`).

2. **Interface Contracts & Requirements**:
   - `PROJECT.md` lines 46–59 defines:
     ```typescript
     export type SpatialTarget = 'practice' | 'profile' | 'history' | 'tuning';
     export interface SpatialNavigationContextValue {
       currentTarget: SpatialTarget;
       panTo: (target: SpatialTarget) => void;
       isPanning: boolean;
     }
     ```
   - `PROJECT.md` lines 9–13 mandates:
     - Edge Folio Anchors (`← 𝄌 Historia`, `↑ 𝄞 Persona`, `→ 𝄐 Harmonia`)
     - Keyboard Controls (Arrow keys, WASD, and `Escape` to re-center)
     - Celestial Compass Mini-map (interactive 4-point glyph pad in bottom margin)
     - URL Hash Sync (`#practice`, `#profile`, `#history`, `#tuning`).

3. **Current Codebase State**:
   - `apps/web/src/components/spatial/` does not yet exist.
   - `apps/web/src/app.tsx` lines 18–26 has static placeholder glyph buttons without routing or spatial context.
   - `apps/web/package.json` includes `"framer-motion": "^14.0.0"`, `"react": "^19.2.8"`, `"@clerk/react": "^6.1.0"`.
   - `apps/web/tsconfig.app.json` enforces `"verbatimModuleSyntax": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`.

---

## 2. Logic Chain

1. **Step 1 (State & Context Foundation)**:
   - *Observation 1 & 2*: Navigation requires sharing `currentTarget` between `SpatialContainer` (which animates the canvas), `FolioNavAnchors` (edge links), `CelestialCompass` (minimap), and keyboard handlers.
   - *Inference*: `SpatialProvider` must sit at the root of the spatial view hierarchy in `apps/web/src/components/spatial/spatial-context.tsx`, exporting `useSpatialNavigation()`.

2. **Step 2 (URL Hash Synchronization)**:
   - *Observation 2*: Deep-linking and Playwright verification require `#practice`, `#profile`, `#history`, `#tuning` in the URL.
   - *Inference*: `SpatialProvider` reads `window.location.hash` on mount to initialize `currentTarget`. When `panTo` is called, it updates `window.location.hash`. To support browser Back/Forward buttons and prevent infinite loops, an `isNavigatingRef` guard and `hashchange`/`popstate` listeners ensure deterministic two-way synchronization.

3. **Step 3 (Directional Keyboard Navigation)**:
   - *Observation 1 & 2*: Spatial layout has Profile at Up `(0, -1)`, History at Left `(-1, 0)`, and Tuning at Right `(1, 0)` relative to Center `(0, 0)`.
   - *Inference*: From Center (`practice`), `Up`/`W` moves to `profile`, `Left`/`A` moves to `history`, `Right`/`D` moves to `tuning`. When at peripheral folios, inverse keys (`Down`/`S` from Profile, `Right`/`D` from History, `Left`/`A` from Tuning) or `Escape` return the camera to Center (`practice`). Form inputs (`<input>`, `<textarea>`) and modifier keys (`Ctrl`, `Meta`, `Alt`) must be protected.

4. **Step 4 (Folio Margin Anchors & Dynamic Return Triggers)**:
   - *Observation 1 & 2*: Margin links provide ambient spatial affordances.
   - *Inference*: Fixed margin anchors on the perimeter (`z-30`) display `↑ 𝄞 Persona` at the top, `← 𝄌 Historia` at the left, and `→ 𝄐 Harmonia` at the right when at `practice`. When at peripheral screens, the opposite margin flips into a return anchor (`Praxis 𝄐 →`, `← 𝄐 Praxis`, `↓ 𝄐 Praxis`).

5. **Step 5 (Celestial Compass Minimap Pad)**:
   - *Observation 1 & 2*: Bottom margin requires a 4-point glyph pad (`Rosa Harmonica`).
   - *Inference*: A 3x2 / cross grid pad renders North (`𝄞`), West (`𝄌`), Center (`♮`/`✦`), and East (`𝄐`). Clicking any node dispatches `panTo(target)`. The active target is illuminated with charcoal `#2C2A29` background and crimson `#9A2A2A` hairline border, accompanied by a live coordinate telemetry readout.

---

## 3. Caveats

1. **Animation Completion Synchronization**: While `SpatialProvider` includes an 800ms fallback timer to reset `isPanning`, `SpatialContainer` (implemented by Worker M2 per Explorer M2-1's spec) should ideally call `setIsPanning(false)` inside its Framer Motion `onAnimationComplete` handler for sub-millisecond precision.
2. **Mobile / Touch Viewports**: The primary target in `DESIGN.md` and `screens.ts` is desktop (1440x900). Touch gestures (swipe-to-pan) are not currently required by R2, but the button and keyboard triggers work across all screen sizes.
3. **No External Route Dependencies**: Routing relies strictly on native browser URL hash (`#target`) rather than React Router, strictly fulfilling R2.

---

## 4. Conclusion

The architectural blueprint for Milestone 2 navigation is completely formulated and documented in `report.md`:
- `apps/web/src/components/spatial/spatial-context.tsx`
- `apps/web/src/components/spatial/folio-nav-anchors.tsx`
- `apps/web/src/components/spatial/celestial-compass.tsx`
- `apps/web/src/components/spatial/index.ts`
All components adhere strictly to the Living Manuscript design system (`Playfair Display`, `Geist Mono`, zero border radius, hairline charcoal borders, SMuFL musical glyphs). Worker M2 can implement these specifications directly without ambiguity.

---

## 5. Verification Method

1. **Static Analysis & Type Check**:
   - Run in web directory:
     ```bash
     cd apps/web && pnpm run lint && pnpm exec tsc -b
     ```
   - Must pass with 0 errors under `"verbatimModuleSyntax": true`.
2. **Interactive Manual & Playwright Verification**:
   - Start Vite dev server: `pnpm run app:web dev`.
   - Verify initial URL `http://localhost:5173/#profile` pans to Profile.
   - Verify pressing `Escape` or `S` returns to Center `#practice`.
   - Verify pressing `A` / `ArrowLeft` pans to History `#history`, and clicking `Praxis 𝄐 →` returns to `#practice`.
   - Verify pressing `D` / `ArrowRight` pans to Tuning `#tuning`, and clicking `← 𝄐 Praxis` returns to `#practice`.
   - Verify typing inside an input element does not trigger camera panning.
   - Verify clicking points on the Celestial Compass pad in the bottom margin immediately triggers smooth camera transit.
