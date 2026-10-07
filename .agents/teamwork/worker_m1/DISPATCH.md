# Dispatch: Worker M1

Target: Milestone 1 — Stitch MCP UI Design Generation & Living Manuscript Design System
Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\
Original request: d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md
Master project spec: d:\Projects\adaptive-music-practice\PROJECT.md

Explorer Reports to Read:
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m1_1\report.md (prompts, tokens, screen blueprints)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m1_2\report.md (execution strategy, circuit breaker, repository layout)
- d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m1_3\report.md (exact schema payloads and enums)

Write Ownership:
You own exclusively:
- `apps/web/src/design-system/` (`tokens.ts`, `screens.ts`, `stitch-manifest.json`, `index.ts`)
- `apps/web/src/styles/theme.css`
- `apps/web/src/components/ui/ink-bleed-filter.tsx`

Objectives:
1. Execute the Dual-Track Stitch strategy:
   - Attempt Track A: Call `StitchMCP/create_project`. If permissions are approved, execute `create_design_system`, `update_design_system`, and `generate_screen_from_text` for the 4 screens (Landing, Tuning, Profile, History) and fetch screen outputs.
   - If interactive permission times out or errors, trip the circuit breaker and proceed to Track B without hanging.
2. Build Track B repository design system:
   - `apps/web/src/design-system/tokens.ts`: Full typed tokens (colors: `#F4F1EA`, `#2C2A29`, `#9A2A2A`, `#E9E4DA`, `#7E7570`; fonts: Playfair Display, Geist Mono, Inter; SMuFL glyphs; motion spring physics).
   - `apps/web/src/design-system/screens.ts`: Detailed structural specifications, layout dimensions, SVG coordinates, and prompt records for Landing Page, Setup/Tuning Ritual, Composer's Bio Profile, and Constellation History.
   - `apps/web/src/design-system/stitch-manifest.json`: Manifest recording tool call attempts, execution status (`STITCH_CLOUD` or `CONTINGENCY_FALLBACK`), and screen metadata.
   - `apps/web/src/design-system/index.ts`: Barrel export.
3. Clean up `apps/web/src/styles/theme.css`: Replace obsolete SaaS/violet tokens with Living Manuscript variables and enforce strict `--radius: 0`.
4. Create `apps/web/src/components/ui/ink-bleed-filter.tsx`: Reusable SVG filter (`#ink-bleed`) with feTurbulence and feDisplacementMap.
5. Verify:
   - Run `pnpm --dir apps/web run build`
   - Run `pnpm --dir apps/web run lint`
   - Confirm 0 errors.
6. Write `report.md` and `handoff.md` in `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-06T09:55:30Z
[Message] timestamp=2026-10-06T09:55:30Z sender=5eaadbb4-8158-47fa-82fc-d97edd4b44b7 priority=MESSAGE_PRIORITY_HIGH
You are Worker M1 (Living Manuscript Design Worker).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\
Please read your full instructions in d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, and d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute Milestone 1:
1. Attempt Stitch MCP cloud generation (Track A) with single-failure circuit breaker.
2. Build Track B repository design system in `apps/web/src/design-system/` (`tokens.ts`, `screens.ts`, `stitch-manifest.json`, `index.ts`).
3. Sanitize `apps/web/src/styles/theme.css` to enforce Living Manuscript tokens and `--radius: 0`.
4. Create `apps/web/src/components/ui/ink-bleed-filter.tsx`.
5. Run build and lint verification commands and report results.
6. Write `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\report.md` and `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m1\handoff.md`.
Communicate back via send_message when done.
