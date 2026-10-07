# Dispatch: Explorer M2-3

Target: Milestone 2 — App Shell Integration & Screen Viewport Placement
Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_3\
Original request: d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md
Master project spec: d:\Projects\adaptive-music-practice\PROJECT.md
Design System: d:\Projects\adaptive-music-practice\apps\web\src\design-system\

Objectives:
1. Investigate how `apps/web/src/app.tsx` and `apps/web/src/main.tsx` should integrate the Spatial Single-Page Architecture:
   - Ensure the practice stand (`LivePracticeView`) remains at Center `(0, 0)`
   - Mount screen containers at Up `(0, -1)`, Left `(-1, 0)`, and Right `(1, 0)` with clean interfaces ready for M3 core screens
   - Ensure Clerk Auth integration remains clean and unblocked
2. Verify CSS layout rules:
   - Outer container: `w-screen h-screen overflow-hidden relative bg-parchment`
   - World container: translates smoothly using Framer Motion `motion.div`
   - Absolute positioning of viewports: each `w-screen h-screen absolute top-0 left-0` with `translate-x` and `translate-y` grid offsets
3. Formulate implementation specifications for Worker M2.
4. Write `report.md` and `handoff.md`. Communicate back via `send_message`.

## 2026-10-06T10:20:33Z
You are Explorer M2-3 (App Shell Integration & Viewport Placement).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_3\
Read d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m2_3\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md, and examine d:\Projects\adaptive-music-practice\apps\web\src\design-system\.

Investigate how `apps/web/src/app.tsx` and the app shell should mount the 2D grid viewports (Center: Practice, Up: Profile, Left: History, Right: Tuning Ritual) and integrate with Clerk/Guest entry pathways.
Write `report.md` and `handoff.md`. Communicate back via send_message when complete.
