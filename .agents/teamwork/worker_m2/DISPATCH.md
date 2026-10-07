# Dispatch: Worker M2

Target: Milestone 2 — Spatial Single-Page Architecture Implementation
Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\
Original request: d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md
Master project spec: d:\Projects\adaptive-music-practice\PROJECT.md
Design System: d:\Projects\adaptive-music-practice\apps\web\src\design-system\

Explorer Reports to Read:
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_1\report.md (spatial container, camera math, spring physics)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_2\report.md (spatial context, folio anchors, compass minimap, keyboard/hash sync)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_3\report.md (app shell integration, viewport placement, guest audition pathway)

Write Ownership:
You own exclusively:
- `apps/web/src/components/spatial/` (`spatial-container.tsx`, `spatial-context.tsx`, `folio-nav-anchors.tsx`, `celestial-compass.tsx`, `index.ts`)
- `apps/web/src/app.tsx`
- `apps/web/src/components/auth/sign-in-page.tsx`
- `apps/web/src/components/auth/auth-shell.tsx`

Objectives:
1. Implement `apps/web/src/components/spatial/`:
   - `spatial-context.tsx`: Navigation context provider, hook `useSpatialNavigation()`, URL hash sync (`#practice`, `#profile`, `#history`, `#tuning`), keyboard listeners (Arrows, WASD, Escape to re-center).
   - `spatial-container.tsx`: Framer Motion 2D camera viewport with spring physics (`stiffness: 70, damping: 18, mass: 1`), camera translation math ($T_x = -X_w \times 100\text{vw}, T_y = -Y_w \times 100\text{vh}$), mounting 4 viewports: Center (Practice), Up (Profile placeholder/wrapper), Left (History placeholder/wrapper), Right (Tuning Ritual placeholder/wrapper).
   - `folio-nav-anchors.tsx`: Fixed margin anchors with Living Manuscript typography and SMuFL glyphs (`← 𝄌 Historia`, `↑ 𝄞 Persona`, `→ 𝄐 Harmonia`), and dynamic return triggers when panned away from center.
   - `celestial-compass.tsx`: 4-point glyph pad in bottom margin with active indicator and coordinate telemetry.
   - `index.ts`: Barrel export.
2. Update `apps/web/src/app.tsx`: Mount `SpatialProvider`, `SpatialContainer`, `FolioNavAnchors`, and `CelestialCompass`, hosting `LivePracticeView` at Center.
3. Update `apps/web/src/components/auth/sign-in-page.tsx` and `auth-shell.tsx`:
   - Add "Audition as Guest" CTA and guest session support (`sessionStorage`, `#guest`) so musicians and Playwright can enter the 2D music stand cleanly.
   - Remove legacy fixed SaaS navbar in `auth-shell.tsx` to provide immersive full-screen spatial music stand experience.
4. Verify:
   - Run `pnpm --dir apps/web run build` (`tsc -b && vite build`)
   - Run `pnpm --dir apps/web run lint` (`oxlint`)
   - Confirm 0 errors.
5. Write `report.md` and `handoff.md` in `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-10-06T10:29:03Z
[Message] timestamp=2026-10-06T10:29:03Z sender=5eaadbb4-8158-47fa-82fc-d97edd4b44b7 priority=MESSAGE_PRIORITY_HIGH content=You are Worker M2 (Spatial Architecture Worker).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\
Please read your full instructions in d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, and d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute Milestone 2:
1. Implement apps/web/src/components/spatial/ (spatial-container.tsx, spatial-context.tsx, folio-nav-anchors.tsx, celestial-compass.tsx, index.ts).
2. Integrate 2D Spatial Architecture into apps/web/src/app.tsx.
3. Update apps/web/src/components/auth/sign-in-page.tsx and auth-shell.tsx to add the Guest Audition pathway and remove legacy SaaS headers.
4. Run build and lint verification commands and report results.
5. Write report.md and handoff.md in d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m2\.
Communicate back via send_message when done.
