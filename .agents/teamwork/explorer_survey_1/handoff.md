# Handoff Report: Living Manuscript Design System Survey

**Explorer 1 (Design System Explorer)**  
**Target:** `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_survey_1\handoff.md`  
**Reference Report:** `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_survey_1\report.md`  
**Status:** Hard Handoff (Investigation Complete)

---

## 1. Observation

1. **Foundational Design Document (`DESIGN.md` lines 1–31):**
   - Concept: "An interactive, experimental musical instrument masquerading as sheet music."
   - Colors: Background `#F4F1EA` (high-quality parchment), structural lines/borders/text `#2C2A29` (deep charcoal), accents/active states/errors `#9A2A2A` (rich crimson ink).
   - Typography: Headers in elegant serif (`Playfair Display`), technical data in crisp monospace (`Geist Mono`), body in readable serif/sans.
   - Guidelines: "Avoid generic SaaS UI patterns (standard cards, drop shadows, pill buttons). Use stark lines, high contrast, and structural layouts. Keep the interface minimal to avoid distracting the musician while playing."
   - Iconography: "Use musical glyphs (SMuFL standard where possible) like fermatas, codas, and staccato dots instead of standard UI icons (hamburgers, cogs)."

2. **Project Specification (`Project_proposal.pdf` & `ORIGINAL_REQUEST.md` lines 12–27):**
   - The application is Sonus, an adaptive musical practice system for monophonic instruments that listens via browser microphone, aligns performances using DTW, calculates pitch deviation (cents) and timing error (ms), and tracks habits across sessions.
   - 4 required screens:
     - **Landing Page:** Ink bleed effect, manuscript atmosphere, integrated Clerk auth.
     - **Setup / Tuning Ritual:** Auto-detect Mic vs MIDI, ritualistic/calming tuning, sacred circle / dial feedback.
     - **Constellation History:** Scatter plot with celestial star metaphor, tempo vs accuracy, interactive nodes.
     - **Composer's Bio Profile:** Manuscript layout, illuminated text, musician stats, repertoire ledger.
   - 2D Spatial Single-Page Architecture using Framer Motion (Center: Practice, Up: Profile, Left: History).

3. **Current Frontend Codebase (`apps/web`):**
   - `apps/web/package.json`: Dependencies `@fontsource/playfair-display` (^5.3.0), `@fontsource/geist-mono` (^5.3.0), `@fontsource/inter` (^5.3.0), `framer-motion` (^14.0.0), `tailwindcss` (^4.3.3), `@clerk/react` (^6.1.0).
   - `apps/web/src/styles/index.css` (lines 13–43): Defines `--color-parchment: #F4F1EA`, `--color-charcoal: #2C2A29`, `--color-crimson: #9A2A2A`, `--radius: 0`, and `.staff-bg` (repeating 5-line staff pattern).
   - `apps/web/src/styles/theme.css` (lines 16–34): Contains conflicting leftover tokens from a past template (`--radius-buttons: 9999px`, `--color-void-violet`, `--color-ember-orange`), which must be superseded by the Living Manuscript tokens.
   - `apps/web/src/main.tsx` (lines 25–35): Bypasses the Landing Page by rendering an unstyled `<SignInPage />` directly when signed out, and wrapping `<App />` in a generic `<AuthShell>` when signed in.
   - `apps/web/src/components/live-practice-view.tsx` & `pitch-ribbon.tsx`: Provide prototype implementations of the practice stand, demonstrating how musical glyphs and SVG paths operate in the canvas.

4. **Stitch MCP Server Schema (`C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\`):**
   - `create_design_system.json` accepts `headlineFont: "PLAYFAIR_DISPLAY"`, `bodyFont: "NEWSREADER"` / `"INTER"`, `labelFont: "GEIST"`, `customColor: "#2C2A29"`, `overrideNeutralColor: "#F4F1EA"`, `overrideSecondaryColor: "#9A2A2A"`, and `designMd`.
   - `generate_screen_from_text.json` requires `projectId`, `prompt`, and optional `deviceType` ("DESKTOP").

---

## 2. Logic Chain

1. **Aesthetic Consistency:**
   - From `DESIGN.md`, the aesthetic requires zero radius (`--radius: 0`), no drop shadows, and high contrast parchment/charcoal/crimson.
   - Therefore, any component generated via Stitch or implemented in React must explicitly avoid rounded pill buttons or floating SaaS card shadows.
2. **Landing Page Architecture:**
   - From `ORIGINAL_REQUEST.md` (R3 & Acceptance Criteria), the Landing Page must render parchment/ink aesthetic and Clerk Auth components.
   - Current `apps/web/src/main.tsx` routes signed-out users directly to a bare `SignIn` box.
   - Therefore, the signed-out state must render the full Landing Page, within which Clerk Auth is embedded as an illuminated folio card with custom `appearance` styling matching parchment `#F4F1EA` and charcoal `#2C2A29`.
3. **Setup / Tuning Ritual Component:**
   - From `DESIGN.md` and `ORIGINAL_REQUEST.md`, tuning is not a settings modal but a pre-flight ritual.
   - A circular astrolabe/dial with an animated pitch deviation needle (-50 to +50 cents) provides direct visual resonance (crimson ring at ±3 cents).
   - Hardware detection switches between Acoustic Microphone (live audio wave) and WebMIDI.
4. **Constellation History Component:**
   - From `Project_proposal.pdf` (Section 3.3, 4.3), practice history must highlight patterns like "timing accuracy drops above 85 BPM" or "upper register intonation".
   - Structuring history as a scatter plot (X: Tempo in BPM, Y: Intonation Accuracy in %, Node Size: Duration) with connecting constellation lines between takes of the same piece directly satisfies the requirement.
5. **Composer's Bio Profile Component:**
   - Modeled after Renaissance printed musical treatises (two-column folio with double-ruled charcoal borders).
   - Left column holds practice physiognomy (hours, note count, intonation purity, diagnosed habits); right column holds the repertoire ledger (mastered works, progress).
6. **Spatial Panning Alignment:**
   - Framer Motion panned canvas requires Center `(0, 0)` for Practice Stand, Left `(-100vw, 0)` for Constellation History, and Up `(0, -100vh)` for Composer's Bio Profile.

---

## 3. Caveats

- **AudioWorklet & WebMIDI Real Audio Execution:** This investigation focused on visual and interactive design specifications. Audio DSP backend integration (e.g. YIN pitch detection worklet and DTW alignment) is mocked on the frontend ribbon scaffold and should be connected to real audio feeds in subsequent implementation phases.
- **Clerk Publishable Key in Local Dev:** Clerk requires `VITE_CLERK_PUBLISHABLE_KEY`. In test environments or when running Playwright, mock auth or a test key may be required to render both signed-out Landing and signed-in Spatial Canvas.
- **No Caveats on Design Specifications:** Visual tokens, typography rules, iconography, and screen-by-screen specifications are complete and documented in `report.md`.

---

## 4. Conclusion

The Living Manuscript design system is fully specified and ready for Stitch generation and Vite+React implementation:
1. **Design Tokens & Rules:** Defined in `report.md` Section 2 (Parchment `#F4F1EA`, Charcoal `#2C2A29`, Crimson `#9A2A2A`, zero border radius, 5-line staff grid).
2. **Screen Specifications & Stitch Prompts:** Detailed layouts and production-ready Stitch prompts for all 4 required screens are provided in `report.md` Sections 3, 4, 5, and 6.
3. **Spatial Navigation & Layout:** 2D Cartesian coordinates (Center `[0,0]`, Left `[-100vw, 0]`, Up `[0, -100vh]`) and musical glyph navigation triggers are defined in Section 7.
4. **Implementation Blueprint:** Token hygiene recommendations and reusable UI component primitives are documented in Section 8.

---

## 5. Verification Method

To independently verify the findings in this report:
1. **Inspect Report & Guidelines:**
   - Open and review `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_survey_1\report.md`.
   - Compare color codes, typography, and glyphs against `d:\Projects\adaptive-music-practice\DESIGN.md`.
2. **Inspect Existing Styles:**
   - View `d:\Projects\adaptive-music-practice\apps\web\src\styles\index.css` to confirm `@theme` tokens (`--color-parchment: #F4F1EA`, `--color-charcoal: #2C2A29`, `--color-crimson: #9A2A2A`).
3. **Run Web Dev Server Verification:**
   - In terminal (pwsh):
     ```powershell
     cd d:\Projects\adaptive-music-practice\apps\web
     pnpm run build
     ```
   - Confirms that fonts (`@fontsource/playfair-display`, `@fontsource/geist-mono`) and Tailwind v4 build without syntax errors.
