# DISPATCH: Worker M4 (Playwright E2E & Visual Verification)

## Mission
Execute Milestone 4 of the Sonus Adaptive Musical Practice System frontend:
1. Start the Vite development server cleanly for `apps/web`.
2. Author and run an end-to-end Playwright verification script that comprehensively tests all user acceptance criteria:
   - Landing Page parchment/ink aesthetic, `#ink-bleed` SVG filter, and Clerk Auth card.
   - "Audition as Guest" instant entry to 2D Spatial Practice Stand at `(0, 0)`.
   - 2D Spatial Camera Panning:
     - Left to `(-1, 0)` `#history`: Constellation History celestial scatter plot, star nodes, filaments, and marginalia tooltips.
     - Up to `(0, -1)` `#profile`: Composer's Bio treatise frontispiece, woodcut monogram crest, telemetry ledger, and repertoire ledger.
     - Right to `(1, 0)` `#tuning`: Sacred Tuning Astrolabe dial ($320\text{px}$ diameter), needle angle rotation, in-tune resonance halo ($0\text{¢}$ vs $-18\text{¢}$ vs $+24\text{¢}$).
3. Capture high-resolution visual proof screenshots into `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\`:
   - `01_landing_page.png`
   - `02_practice_stand.png`
   - `03_constellation_history.png`
   - `04_composer_profile.png`
   - `05_tuning_astrolabe_in_tune.png`
   - `06_tuning_astrolabe_flat.png`
   - `07_tuning_astrolabe_sharp.png`
4. Confirm 0 console errors and clean server termination / process management.
5. Write `report.md` and `handoff.md` in your working directory.

## Master References
- `d:\Projects\adaptive-music-practice\PROJECT.md`
- `d:\Projects\adaptive-music-practice\DESIGN.md`
- `d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md`
- `d:\Projects\adaptive-music-practice\.agents\teamwork\orchestrator_1\GATE_STATUS.md`

## Mandatory Warning
DO NOT CHEAT. All implementations and tests must be genuine. DO NOT fake screenshots or hardcode test results. A teamwork_preview_auditor will independently inspect your deliverables.


## 2026-10-06T15:20:51Z
You are Worker M4 (Playwright E2E & Visual Verification Worker).
Your working directory is d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m4\
Please read your full instructions in d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m4\DISPATCH.md, d:\Projects\adaptive-music-practice\PROJECT.md, and d:\Projects\adaptive-music-practice\.agents\teamwork\ORIGINAL_REQUEST.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute Milestone 4:
1. Ensure the directory d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\ exists.
2. Verify that `pnpm --dir apps/web run build` succeeds cleanly.
3. Start the Vite dev server (or run it via headless script/background process or programmatic Playwright server). Note: If starting in background, remember to manage process cleanup properly.
4. Author and execute an automated Playwright verification script (e.g. using @playwright/test or playwright package via pnpm or node script) that tests:
   a. Landing Page:
      - Validates presence of `filter#ink-bleed` with genuine SVG turbulence/displacement primitives.
      - Validates "Sonus" calligraphic title with `filter: url(#ink-bleed)`.
      - Validates Latin motto "AUDIRE · DISCERE · EXERCERE" and feature scrolls.
      - Validates Clerk Auth form and zero border radius styling.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\01_landing_page.png`.
   b. Instant Guest Mode Audition:
      - Clicks `[data-testid="guest-audition-btn"]`.
      - Confirms instant navigation into the 2D Spatial Stand `(0, 0)`.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\02_practice_stand.png`.
   c. Spatial Panning to Constellation History:
      - Clicks `[data-testid="nav-history"]` or `← 𝄌 Historia` / `#history`.
      - Confirms 2D camera panned to `(-1, 0)`.
      - Validates celestial scatter plot: star nodes, 86 BPM breakdown horizon, constellation filaments, and marginalia tooltip.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\03_constellation_history.png`.
   d. Spatial Panning to Composer Profile:
      - Clicks `[data-testid="nav-profile"]` or `↑ 𝄞 Persona` / `#profile`.
      - Confirms 2D camera panned to `(0, -1)`.
      - Validates 17th-century treatise frontispiece: woodcut monogram crest, practice telemetry table, dominant microtonal habits, and repertoire ledger.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\04_composer_profile.png`.
   e. Spatial Panning to Sacred Tuning Ritual:
      - Clicks `[data-testid="nav-tuning"]` or `→ 𝄐 Harmonia` / `#tuning`.
      - Confirms 2D camera panned to `(1, 0)`.
      - Validates Sacred Tuning Astrolabe: 320px SVG dial and rotating needle.
      - Tests in-tune equilibrium (clicks `[data-testid="test-in-tune"]` or checks 0¢): asserts needle angle 0.0° and crimson resonance halo illuminated.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\05_tuning_astrolabe_in_tune.png`.
      - Tests flat (clicks `[data-testid="test-flat"]`): asserts needle angle -21.6° and flat indication.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\06_tuning_astrolabe_flat.png`.
      - Tests sharp (clicks `[data-testid="test-sharp"]`): asserts needle angle +28.8° and sharp indication.
      - Takes screenshot: `d:\Projects\adaptive-music-practice\.agents\teamwork\verification_screenshots\07_tuning_astrolabe_sharp.png`.
5. Verify that all 7 screenshots are physically saved, non-empty, and valid PNG files.
6. Verify that 0 console errors were emitted during the entire automated session.
7. Write `report.md` and `handoff.md` in `d:\Projects\adaptive-music-practice\.agents\teamwork\worker_m4\`.
Communicate back via send_message when complete.
