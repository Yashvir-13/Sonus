# Handoff Report: Constellation History & Composer Profile Architecture

**Target**: Milestone 3 — Constellation History & Composer Profile Implementation Architecture  
**Explorer**: Explorer M3-3 (Gen 2)  
**Parent Agent ID**: `5eaadbb4-8158-47fa-82fc-d97edd4b44b7`  
**Date**: 2026-10-06  

---

## 1. Observation

1. **Design System & Blueprint Specifications**:
   - `apps/web/src/design-system/screens.ts` (lines 141–209) details `COMPOSER_PROFILE_SPEC`:
     - Monogram woodcut crest diameter: `88`
     - Performer: `Maestro Yash`, `Soloist in Residence · Violin & Voice`
     - Practice physiognomy: `48.4` hours, `32490` notes, `91.4%` intonation purity, `±14ms` timing precision, `112 BPM` max controlled, `120 BPM` breakdown horizon.
     - Dominant habits: ascending leading tone sharpness (`+5 cents`), fourth-finger flat extensions, and post-rest rushing (`+4%`).
     - Repertoire list: Bach BWV 1004 Chaconne, Telemann Fantasia 1, Paganini Caprice 24.
   - `apps/web/src/design-system/screens.ts` (lines 214–331) details `CONSTELLATION_HISTORY_SPEC`:
     - ViewBox: `0 0 1000 600`, padding `X: 80, Y: 60`, usable width `840`, usable height `480`.
     - Tempo bounds: `60 – 160 BPM`, Accuracy bounds: `60% – 100%`.
     - Session duration radius mapping: $R \in [4\text{px}, 14\text{px}]$.
     - Critical breakdown threshold: `86 BPM`.
     - Sample session takes with detailed `editorNote` marginalia.

2. **Spatial Viewport Slots & Integration Points**:
   - `apps/web/src/components/spatial/spatial-container.tsx` (lines 7–13 & 214–235):
     ```tsx
     export interface SpatialContainerProps {
       children?: ReactNode
       practiceScreen?: ReactNode
       profileScreen?: ReactNode
       historyScreen?: ReactNode
       tuningScreen?: ReactNode
       className?: string
     }
     ```
     Viewport containers at `viewport-profile` (`left: 0vw, top: -100vh`) and `viewport-history` (`left: -100vw, top: 0vh`) currently render `DefaultProfilePlaceholder` and `DefaultHistoryPlaceholder` when `profileScreen` and `historyScreen` props are undefined.
   - `apps/web/src/app.tsx` (line 50–52) currently only passes `practiceScreen`:
     ```tsx
     <SpatialContainer
       practiceScreen={<PracticeStandView isGuest={isGuest} onExitGuest={onExitGuest} />}
     />
     ```

3. **Clerk and Guest State Handling**:
   - `apps/web/src/components/auth/sign-in-page.tsx` supports guest mode via `sessionStorage.getItem('Sonus_guest_mode')` and passes `isGuest={true}` to `App`.
   - `@clerk/react` exports `useUser` and `useClerk`. In guest mode, `useUser().isSignedIn` returns `false`, which requires safe fallbacks to prevent runtime exceptions.

4. **Build & Linter Baseline**:
   - `oxlint` executed cleanly on 20 files with 116 rules: `Found 0 warnings and 0 errors.`
   - `tsc -b && vite build` built production client in 724ms with 0 type errors.

---

## 2. Logic Chain

1. **Aesthetic Fidelity to "Living Manuscript"**:
   - Following Observation 1 and `PROJECT.md`, the UI replaces standard dashboard cards with historical treatise conventions:
     - The Constellation History viewport transforms session analytics into a Keplerian astronomical chart (*Harmonices Mundi*) with faint planetary orbits, 5-line musical staff watermarks, and dashed filaments connecting chronological takes of identical opuses.
     - The Composer Profile viewport adopts a 17th-century printed treatise frontispiece (*Tractatus Physionomiae et Praxis*) featuring an engraved circular woodcut crest, Latin marginalia, and a two-column folio separating kinetic practice pathology from repertoire conquest.
   - Strict adherence to design tokens: zero border radius (`rounded-none`), zero drop shadows (`shadow-none`), `#F4F1EA` parchment background, `#2C2A29` charcoal ink, and `#9A2A2A` rubricated crimson.

2. **Mathematical Precision in Coordinate Transformations**:
   - Following Observation 1, the scatter plot maps $(X, Y)$ within the bounding box $[80, 60] \to [920, 540]$:
     - $X = 80 + \frac{\text{tempo} - 60}{100} \times 840$
     - $Y = 540 - \frac{\text{accuracy} - 60}{40} \times 480$ (inverting the Cartesian Y-axis so $100\%$ accuracy resides at the top coordinate $Y = 60$).
     - The critical breakdown threshold at $86\text{ BPM}$ renders at $X = 298.4\text{px}$ with a vertical rubricated dashed stroke.
     - Star radius maps duration linearly: $R = 4 + \frac{\text{mins} - 5}{40} \times 10$ ($4\text{px} \le R \le 14\text{px}$).

3. **Seamless Multi-Modal Navigation & State Safety**:
   - Following Observation 2, both screens integrate with `useSpatialNavigation()`:
     - `ConstellationHistoryScreen` provides a `Return to Practice Stand →` trigger calling `panTo('practice')`.
     - `ComposerProfileScreen` provides a `↓ Return to Practice Stand` trigger calling `panTo('practice')`.
   - Following Observation 3, `ComposerProfileScreen` queries Clerk's `useUser()`: if authenticated, it displays the musician's full name and Clerk ID in the registry seal; if in guest mode, it renders `Maestro Yash` and `REGISTRY: GUEST_MMXXVI // STATUS: AUDITION VIRTUS` without crashing.

4. **Worker-Ready Blueprints**:
   - To enable instant, error-free implementation by Worker M3, complete drop-in TSX blueprint files were created in this folder:
     - `blueprint_constellation_history.tsx`
     - `blueprint_composer_profile.tsx`
   - These files import existing design system tokens and types, use typed interfaces, and compile without synthetic dependencies.

---

## 3. Caveats

1. **Mock Take Persistence**: The sample session takes in `ConstellationHistoryScreen` and practice metrics in `ComposerProfileScreen` currently use the static datasets defined in `screens.ts`. In future backend milestones, these will bind to the FastAPI practice session endpoints.
2. **Clipboard Permissions in Headless Browsers**: The `handleExportFolio` method uses `navigator.clipboard.writeText`, which requires clipboard write permissions; a graceful check prevents runtime crashes if the API is restricted during Playwright headless runs.

---

## 4. Conclusion

The implementation architecture and concrete blueprints for Milestone 3's `ConstellationHistoryScreen` and `ComposerProfileScreen` are complete, mathematically validated, and fully compliant with the "Living Manuscript" design system. Worker M3 can directly apply `blueprint_constellation_history.tsx` and `blueprint_composer_profile.tsx` into `apps/web/src/components/screens/` and mount them in `apps/web/src/app.tsx`.

---

## 5. Verification Method

To independently verify these architecture blueprints:

1. **Inspect Blueprint Files**:
   - `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_constellation_history.tsx`
   - `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_composer_profile.tsx`
   - `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\report.md`

2. **Downstream Worker M3 Application Command**:
   Worker M3 copies the blueprints to:
   - `apps/web/src/components/screens/constellation-history-screen.tsx`
   - `apps/web/src/components/screens/composer-profile-screen.tsx`
   and adds them to `apps/web/src/app.tsx`.

3. **Type & Build Verification**:
   ```bash
   pnpm --dir apps/web run lint
   pnpm --dir apps/web run build
   ```
   *Expected Output*: `oxlint` returns 0 warnings/errors, and `tsc -b && vite build` succeeds with Exit Code 0.

4. **Invalidation Conditions**:
   - Deviation from zero-radius or introduction of SaaS drop shadows.
   - Coordinate calculation errors in scatter plot axes mapping.
   - Unhandled Clerk exceptions when running in unauthenticated Guest mode.
