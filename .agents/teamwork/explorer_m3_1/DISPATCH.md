# Dispatch: Explorer M3-1

Target: Milestone 3 — Landing Page & Ink Bleed Effect Implementation Architecture
Working directory: d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_1\
Original request: d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md
Master project spec: d:\Projects\adaptive-music-practice\PROJECT.md
Design System: d:\Projects\adaptive-music-practice\apps\web\src\design-system\

Objectives:
1. Review `LANDING_PAGE_SPEC` in `apps/web/src/design-system/screens.ts` and `apps/web/src/components/ui/ink-bleed-filter.tsx`.
2. Formulate implementation architecture for `apps/web/src/components/screens/landing-screen.tsx`:
   - Hero section featuring calligraphic ink title "Sonus" with reactive ink-bleed bloom using `<InkBleedFilter />` and SVG filter `#ink-bleed`
   - Historical Latin marginalia (*Audire · Discere · Exercere*)
   - Three illuminated parchment feature scrolls (Adaptive Intonation, Temporal DTW Alignment, Celestial Constellation History)
   - Embedded Clerk `<SignIn />` within an illuminated manuscript border with Living Manuscript theme variables
   - Direct "Audition as Guest (Instant Access)" button that sets `sessionStorage` and triggers entry into `<App isGuest={true} />`
3. Prepare concrete code blueprint and specifications for Worker M3.
4. Write `report.md` and `handoff.md`. Communicate back via `send_message`.


## 2026-10-06T11:00:55Z
You are Explorer M3-1 (Landing Page & Ink Bleed Architecture).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_1\
Read d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m3_1\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, and examine d:\Projects\adaptive-music-practice\apps\web\src\design-system\.

Formulate the architecture and concrete implementation blueprint for apps/web/src/components/screens/landing-screen.tsx (ink bleed effect with InkBleedFilter, calligraphic Sonus title, Latin marginalia, Clerk auth integration, and Guest Audition instant access).
Write report.md and handoff.md. Communicate back via send_message when complete.
