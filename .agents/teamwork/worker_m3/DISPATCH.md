# Dispatch: Worker M3

Target: Milestone 3 — Core Screens Implementation
Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m3\
Original request: d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md
Master project spec: d:\Projects\adaptive-music-practice\PROJECT.md
Design System: d:\Projects\adaptive-music-practice\apps\web\src\design-system\

Explorer Blueprints to Consume:
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_1_gen2\report.md (Landing Page blueprint with ink-bleed filter, Clerk auth, guest audition, marginalia)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_2_gen2\report.md (Device Setup & Tuning Ritual blueprint with Sacred Astrolabe dial, needle math, Mic vs MIDI detection)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_constellation_history.tsx (Constellation History blueprint with celestial scatter plot, star nodes, filaments, marginalia tooltips)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_3_gen2\blueprint_composer_profile.tsx (Composer Profile blueprint with 17th-century treatise layout, crest, practice telemetry, repertoire ledger)

Write Ownership:
You own exclusively:
- `apps/web/src/components/screens/` (`landing-screen.tsx`, `tuning-ritual-screen.tsx`, `constellation-history-screen.tsx`, `composer-profile-screen.tsx`, `index.ts`)
- `apps/web/src/components/auth/sign-in-page.tsx`
- `apps/web/src/app.tsx`

Objectives:
1. Create `apps/web/src/components/screens/`:
   - `landing-screen.tsx`: Hero title "Sonus" with `<InkBleedFilter />` bloom, Latin marginalia (*Audire · Discere · Exercere*), 3 feature scrolls, styled Clerk `<SignIn />`, instant "Audition as Guest" button.
   - `tuning-ritual-screen.tsx`: Sacred Astrolabe dial (320px diameter, needle angle $\theta = \frac{\text{clamp}(\text{cents}, -50, 50)}{50} \times 60^\circ$, ±3 cents crimson glow), Web Audio Mic + WebMIDI detection with headless test simulation fallback triggers, pitch standards 415/440/442Hz, return to stand trigger.
   - `constellation-history-screen.tsx`: Celestial scatter plot (tempo vs accuracy), star duration nodes, constellation filaments, interactive marginalia tooltips with crimson editor marks, return trigger.
   - `composer-profile-screen.tsx`: 17th-century treatise frontispiece layout, illuminated woodcut crest, practice telemetry, repertoire ledger, return trigger.
   - `index.ts`: Barrel export.
2. Update `apps/web/src/components/auth/sign-in-page.tsx`: Mount `<LandingScreen onEnterGuest={...} />`.
3. Update `apps/web/src/app.tsx`: Mount `profileScreen={<ComposerProfileScreen />} `, `historyScreen={<ConstellationHistoryScreen />} `, and `tuningScreen={<TuningRitualScreen />} ` into `SpatialContainer`.
4. Verify:
   - Run `pnpm --dir apps/web run build` (`tsc -b && vite build`)
   - Run `pnpm --dir apps/web run lint` (`oxlint`)
   - Confirm 0 errors and 0 warnings.
5. Write `report.md` and `handoff.md` in `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m3\`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-06T14:52:17Z
You are Worker M3 (Core Screens Worker).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m3\
Please read your full instructions in d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m3\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, and d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute Milestone 3:
1. Create `apps/web/src/components/screens/` containing `landing-screen.tsx`, `tuning-ritual-screen.tsx`, `constellation-history-screen.tsx`, `composer-profile-screen.tsx`, and `index.ts` using the detailed explorer blueprints.
2. Update `apps/web/src/components/auth/sign-in-page.tsx` to render `<LandingScreen />`.
3. Update `apps/web/src/app.tsx` to mount all core screens into `SpatialContainer`.
4. Run `pnpm --dir apps/web run build` and `pnpm --dir apps/web run lint` to verify clean compilation.
5. Write `report.md` and `handoff.md` in `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m3\`.
Communicate back via send_message when done.
