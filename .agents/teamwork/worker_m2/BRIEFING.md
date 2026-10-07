# BRIEFING — 2026-10-06T10:42:00Z

## Mission
Implement Milestone 2: 2D Spatial Single-Page Architecture using Framer Motion (Continuous 2D plane with Practice at Center, Profile Up, History Left, Tuning Right), Navigation triggers (Folio Nav Anchors, Celestial Compass minimap, URL hash sync, keyboard listeners), Guest Audition pathway, and Auth shell refinement.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\
- Original parent: 5eaadbb4-8158-47fa-82fc-d97edd4b44b7
- Milestone: Milestone 2 — Spatial Single-Page Architecture

## 🔒 Key Constraints
- Exclusive write ownership:
  - `apps/web/src/components/spatial/` (`spatial-container.tsx`, `spatial-context.tsx`, `folio-nav-anchors.tsx`, `celestial-compass.tsx`, `index.ts`)
  - `apps/web/src/app.tsx`
  - `apps/web/src/components/auth/sign-in-page.tsx`
  - `apps/web/src/components/auth/auth-shell.tsx`
- Do NOT edit other directories without authorization.
- Zero border radius (`rounded-none`), zero modern drop shadows, structural hairline borders (`1px solid #2C2A29`), Living Manuscript palette and typography (`Playfair Display`, `Geist Mono`, `Inter`).
- SMuFL / Unicode musical glyphs (`𝄐`, `𝄩`, `𝄞`, `𝄢`, `𝄡`, `♮`, `♯`, `♭`, `𝄌`).
- Spring physics: `stiffness: 70, damping: 18, mass: 1`.
- Camera math: $T_x = -X_w \times 100\text{vw}, T_y = -Y_w \times 100\text{vh}$.
- Strict TypeScript: no `any`, strict null checks.
- Verification: `pnpm --dir apps/web run build` and `pnpm --dir apps/web run lint` with 0 errors.

## Current Parent
- Conversation ID: 5eaadbb4-8158-47fa-82fc-d97edd4b44b7
- Updated: not yet

## Task Summary
- **What to build**:
  1. `apps/web/src/components/spatial/types.ts`: Spatial type declarations and target validator.
  2. `apps/web/src/components/spatial/spatial-context.tsx`: Navigation context, `useSpatialNavigation()`, URL hash sync, keyboard listeners (Arrow keys, WASD, Esc).
  3. `apps/web/src/components/spatial/spatial-container.tsx`: Framer Motion 2D camera viewport with spring physics and screen slots with `aria-hidden` / `inert`.
  4. `apps/web/src/components/spatial/folio-nav-anchors.tsx`: Fixed margin anchors with Living Manuscript typography and SMuFL glyphs (`← 𝄌 Historia`, `↑ 𝄞 Persona`, `→ 𝄐 Harmonia`) and return triggers.
  5. `apps/web/src/components/spatial/celestial-compass.tsx`: 4-point glyph pad in bottom margin with active indicator and coordinate telemetry.
  6. `apps/web/src/components/spatial/index.ts`: Barrel export.
  7. `apps/web/src/app.tsx`: Mount `SpatialProvider`, `SpatialContainer`, `FolioNavAnchors`, and `CelestialCompass`, hosting `LivePracticeView` at Center.
  8. `apps/web/src/components/auth/sign-in-page.tsx` and `auth-shell.tsx`: Add Guest Audition pathway (`sessionStorage`, `#guest`) and strip legacy SaaS header.
- **Success criteria**:
  - `pnpm --dir apps/web run build` passes with 0 errors (COMPLETED).
  - `pnpm --dir apps/web run lint` passes with 0 errors (COMPLETED).
  - Full adherence to Living Manuscript design tokens and interface contracts in `PROJECT.md`.
- **Interface contracts**: `PROJECT.md` § Interface Contracts: Spatial Coordinates ↔ Canvas Container
- **Code layout**: `apps/web/src/components/spatial/`

## Key Decisions Made
- Camera coordinate math follows `SPATIAL_MOTION_CONFIG.coordinates` in `tokens.ts`.
- Inactive screen slots use `aria-hidden="true"` and `inert={true}` to prevent focus trapping when outside viewport.
- Keyboard listeners check `document.activeElement` to ignore typing inside inputs and textareas.
- Guest mode is handled in `sign-in-page.tsx` via `sessionStorage` and `#guest` hash to allow Playwright and musicians without Clerk credentials instant access to the 2D music stand while preserving Clerk compliance in `main.tsx`.
- Removed legacy fixed SaaS header in `auth-shell.tsx` for borderless, full-screen spatial immersion.

## Change Tracker
- `apps/web/src/components/spatial/types.ts`: Types, interfaces, and validator.
- `apps/web/src/components/spatial/spatial-context.tsx`: Spatial navigation provider, hook, URL hash sync, and keyboard navigation.
- `apps/web/src/components/spatial/spatial-container.tsx`: Framer Motion spring canvas with 4-viewport layout and Living Manuscript placeholders.
- `apps/web/src/components/spatial/folio-nav-anchors.tsx`: Fixed margin navigation anchors with SMuFL glyphs and return triggers.
- `apps/web/src/components/spatial/celestial-compass.tsx`: 4-point astrolabe minimap with active highlights and telemetry readout.
- `apps/web/src/components/spatial/index.ts`: Spatial module barrel export.
- `apps/web/src/app.tsx`: Wires spatial provider and container around LivePracticeView.
- `apps/web/src/components/auth/sign-in-page.tsx`: Guest audition pathway and Living Manuscript styled login.
- `apps/web/src/components/auth/auth-shell.tsx`: Stripped SaaS navbar for full-screen spatial experience.

## Quality Status
- **Build status**: Pass (`tsc -b && vite build` completed cleanly).
- **Lint status**: Pass (0 warnings, 0 errors in `oxlint`).
- **Tests added/modified**: E2E scheduled for M4.

## Artifact Index
- `BRIEFING.md` — persistent situational awareness index.
- `progress.md` — heartbeat and execution steps.
- `report.md` — implementation summary.
- `handoff.md` — 5-component handoff report.
