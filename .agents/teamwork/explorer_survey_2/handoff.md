# Handoff Report — Explorer 2 (Frontend Codebase & Architecture)

**Date:** 2026-10-06  
**Agent:** Explorer 2 (Frontend Codebase Explorer)  
**Working Directory:** `.agents/teamwork/explorer_survey_2/`  
**Handoff Type:** Hard (Survey Complete)

---

## 1. Observation

1. **Root Configuration & Runner:**
   - `package.json` lines 9–19: Defines scripts `"dev"`, `"app:web"`, `"service:api"`, `"db:create"`, `"db:make"`, `"db:upgrade"`.
   - `scripts/run.py` lines 364–370: Dispatches `app:web` to `pnpm --dir apps/web run <args>`.
2. **`apps/web/package.json` Dependencies:**
   - Lines 12–24:
     - `"@clerk/react": "^6.1.0"`
     - `"framer-motion": "^14.0.0"`
     - `"react": "^19.2.8"`, `"react-dom": "^19.2.8"`
     - `"clsx": "^2.1.1"`, `"tailwind-merge": "^3.7.0"`
     - `@fontsource/` packages installed: `dm-sans` (^5.3.0), `geist-mono` (^5.3.0), `inter` (^5.3.0), `playfair-display` (^5.3.0), `space-grotesk` (^5.3.0).
   - Lines 25–35:
     - `"@tailwindcss/vite": "^4.3.3"`, `"tailwindcss": "^4.3.3"`
     - `"oxlint": "^1.81.0"`
     - `"typescript": "~6.0.2"`, `"vite": "^8.3.0"`
   - Dependency Gaps: `lucide-react` is not installed; no 3rd-party charting library (`recharts`, `chart.js`, `d3`) is installed; no 3rd-party audio/MIDI library (`tone`, `webmidi`) is installed.
3. **Current Entry Point & Navigation Structure:**
   - `apps/web/src/main.tsx` lines 15–35: Verifies `VITE_CLERK_PUBLISHABLE_KEY` from `apps/web/.env`. When signed out, renders `<SignInPage />`; when signed in, renders `<AuthShell><App /></AuthShell>`.
   - `apps/web/src/components/auth/auth-shell.tsx` lines 10–19: Renders a traditional top header `<header className="flex items-center justify-between border-b border-border px-5 py-3">` with `"Blueprint"` text and `<UserButton />`.
   - `apps/web/src/app.tsx` lines 5–35: Renders static title `"Opus Manuscriptum"` and directly hosts `<LivePracticeView />`.
   - `apps/web/src/components/live-practice-view.tsx` & `pitch-ribbon.tsx`: Implement 5-line staff pattern (`.staff-bg`), SVG path with glow filter `<filter id="glow">`, dynamic pitch cents deviation animation, and musical glyph buttons (`𝄐`, `▶`, `■`).
4. **Build & Lint Verification:**
   - Command `pnpm --dir apps/web run build` executed `tsc -b && vite build`: Exited code 0 in 3.54s, transforming 499 modules into `dist/assets/index-QFagl8lm.js` (478.12 kB) and `dist/assets/index-CHU-dDJV.css` (131.62 kB).
   - Command `pnpm --dir apps/web run lint` executed `oxlint`: Exited code 0, 0 warnings, 0 errors across 10 files with 116 rules in 112ms.
5. **Playwright MCP Tooling:**
   - Tool schemas verified at `C:\Users\yashv\.gemini\antigravity\mcp\playwright\`: 25 schema definitions available including `browser_navigate.json`, `browser_take_screenshot.json`, `browser_click.json`, `browser_press_key.json`, and `browser_wait_for.json`.

---

## 2. Logic Chain

1. From **Observation 2** (`framer-motion: ^14.0.0` is already installed and compatible with React 19) and **Observation 3** (`pitch-ribbon.tsx` successfully leverages motion components), it follows that no additional animation library is required; Framer Motion is fully equipped to drive the 2D spatial panning camera.
2. From **Observation 2** (`lucide-react` is absent) and `DESIGN.md` Section 4 (*"Icons: Use musical glyphs (SMuFL standard where possible) like fermatas, codas, and staccato dots instead of standard UI icons"*), it follows that installing `lucide-react` is not only unnecessary but would contradict the design specification. Native Unicode/SMuFL glyphs and custom SVG ink icons should be utilized instead.
3. From **Observation 3** (`main.tsx` renders bare `<SignInPage />` on signed-out, and `auth-shell.tsx` renders a standard SaaS top bar on signed-in), it follows that the current routing violates both `DESIGN.md` (which mandates an immersive digital music stand without traditional navbars) and `ORIGINAL_REQUEST.md` (which requires a Living Manuscript Landing Page with ink bleed effect).
4. From **Observation 3 & 4**, to reconcile Clerk authentication with the Spatial Single-Page Architecture and enable headless Playwright verification:
   - The signed-out view must become the Living Manuscript Landing Page featuring the reactive ink bleed effect and a custom-styled Clerk `<SignIn />` card.
   - An "Audition as Guest" CTA / demo mode must be provided so that musicians and automated Playwright test agents can immediately enter the 2D Spatial Music Stand without encountering an external OAuth wall.
   - The signed-in state must eliminate the generic `AuthShell` header and house user profile details inside the `Up` (Composer's Bio) folio.
5. From **Observation 5**, the local Playwright MCP tools allow the agent team to verify every visual and functional requirement (landing page rendering, spatial panning via button click or arrow keys, tuning ritual, constellation history) directly through headless browser navigation and screenshots.

---

## 3. Caveats

1. **Audio Device Access in Headless Environments:** Real audio capture via `navigator.mediaDevices.getUserMedia` and MIDI via `navigator.requestMIDIAccess` may be restricted or have dummy devices in headless Playwright sessions. The Tuning Ritual component must handle permission prompts gracefully and fall back to simulated acoustic resonance / detected device states for testing.
2. **Clerk Live Network:** Clerk's test key in `.env` connects to `pleased-manatee-9174.clerk.accounts.dev`. In sandboxed or offline environments, Clerk JS could experience network latency. Providing the Guest Audition pathway ensures 100% test reliability regardless of external network conditions.
3. **Screen Coordinates Convention:** While Up is geometrically negative in CSS `transform: translateY`, we model grid coordinates where Center = `(0, 0)`, Up = `(0, -1)`, Left = `(-1, 0)`, Right = `(1, 0)` so the world container translates by `-gx * 100vw` and `-gy * 100vh`.

---

## 4. Conclusion

The `apps/web` project is structurally sound, compiles cleanly with zero warnings, and possesses all required core dependencies (`framer-motion`, `@tailwindcss/vite`, `@clerk/react`). 

The recommended implementation architecture:
1. **Spatial Container:** Implement `apps/web/src/components/spatial/spatial-container.tsx` using Framer Motion 2D spring physics (`stiffness: 70, damping: 18`) to pan between Center (Practice), Up (Profile), Left (History), and Right (Tuning Ritual).
2. **Navigation Controls:** Provide marginal folio markers (`← History`, `↑ Profile`, `→ Tuning`), global keyboard listeners (`ArrowLeft`, `ArrowUp`, `ArrowRight`, `Escape`), and a bottom-corner celestial compass mini-map.
3. **Living Manuscript Landing Page:** Render when signed-out with an animated SVG ink bleed filter and Clerk `<SignIn />` themed with parchment `#F4F1EA`, charcoal `#2C2A29`, and crimson `#9A2A2A`. Include a direct "Audition as Guest" button for immediate stand access.
4. **Verification Protocol:** Use Playwright MCP tools (`browser_navigate`, `browser_take_screenshot`) to capture visual evidence of each screen and spatial pan transition.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Build Verification:**
   ```bash
   pnpm --dir apps/web run build
   ```
   *Expected:* Exit code 0, outputting compiled assets in `apps/web/dist/` in < 4.0s.
2. **Lint Verification:**
   ```bash
   pnpm --dir apps/web run lint
   ```
   *Expected:* Exit code 0, 0 errors, 0 warnings.
3. **Dependency Inspection:**
   Inspect `apps/web/package.json` to verify `framer-motion` (^14.0.0), `@clerk/react` (^6.1.0), and `@tailwindcss/vite` (^4.3.3).
4. **Playwright Tool Availability:**
   Check directory `C:\Users\yashv\.gemini\antigravity\mcp\playwright\` to verify presence of 25 MCP schema definitions.
