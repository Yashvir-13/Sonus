# BRIEFING — 2026-10-06T10:28:00Z

## Mission
Investigate how `apps/web/src/app.tsx` and the app shell should mount the 2D grid viewports (Center: Practice, Up: Profile, Left: History, Right: Tuning Ritual) and integrate with Clerk/Guest entry pathways.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_3\
- Original parent: 5eaadbb4-8158-47fa-82fc-d97edd4b44b7
- Milestone: Milestone 2 — App Shell Integration & Screen Viewport Placement

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Spatial Single-Page Architecture: 2D grid viewports (Center: Practice (0,0), Up: Profile (0,-1), Left: History (-1,0), Right: Tuning Ritual (1,0))
- Clerk/Guest entry pathways
- Output files in own directory: report.md, handoff.md, progress.md, BRIEFING.md, DISPATCH.md

## Current Parent
- Conversation ID: 5eaadbb4-8158-47fa-82fc-d97edd4b44b7
- Updated: 2026-10-06T10:28:00Z

## Investigation State
- **Explored paths**:
  - `apps/web/src/app.tsx`
  - `apps/web/src/main.tsx`
  - `apps/web/src/components/auth/sign-in-page.tsx`
  - `apps/web/src/components/auth/auth-shell.tsx`
  - `apps/web/src/components/live-practice-view.tsx`
  - `apps/web/src/design-system/tokens.ts`
  - `apps/web/src/design-system/screens.ts`
  - `apps/web/src/styles/index.css`
  - `PROJECT.md` & `ORIGINAL_REQUEST.md`
- **Key findings**:
  - Viewports must be positioned with `w-screen h-screen absolute top-0 left-0` and CSS transforms (`-translate-y-full` for Profile, `-translate-x-full` for History, `translate-x-full` for Tuning, `0` for Practice).
  - World container moves with opposite sign $\mathbf{T} = -\mathbf{P}$ matching `SPATIAL_MOTION_CONFIG` in `tokens.ts`.
  - Outer container requires `w-screen h-screen overflow-hidden relative bg-[var(--background)]` to avoid scrollbars and viewport jitter.
  - Clerk Auth and "Audition as Guest" CTA should be cleanly unified in `components/auth/sign-in-page.tsx`, preserving strict `AGENTS.md` rules for `main.tsx` while allowing unauthenticated guest access via button click and `#guest` hash.
  - `AuthShell` should be stripped of legacy 48px topbars to provide a clean full-screen canvas for signed-in users.
- **Unexplored areas**: Milestone 3 internal screen implementations (Astrolabe canvas, Constellation scatter plot SVG, Repertoire ledger).

## Key Decisions Made
- Formulated the exact DOM stacking order and CSS classes for `app.tsx`.
- Architected the dual-entry pathway (Clerk vs Guest) in `sign-in-page.tsx` to maintain 100% compliance with `AGENTS.md`.
- Formulated concrete implementation blueprints for Worker M2.

## Artifact Index
- DISPATCH.md — Task assignment and instructions
- BRIEFING.md — Persistent memory and identity
- progress.md — Liveness heartbeat
- report.md — Comprehensive investigation report & code blueprints
- handoff.md — 5-component handoff report
