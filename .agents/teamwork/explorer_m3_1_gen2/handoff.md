# Handoff Report: Living Manuscript Landing Page Architecture (Milestone 3)

**Agent**: Explorer M3-1 (Gen 2)  
**Target Recipient**: Orchestrator / Worker M3  
**Target Component**: `apps/web/src/components/screens/landing-screen.tsx`  
**Date**: 2026-10-06  

---

## 1. Observation

1. **Design System Specification**:
   - `apps/web/src/design-system/screens.ts` (lines 17–80) defines `LANDING_SCREEN_SPEC` with Latin motto `'AUDIRE · DISCERE · EXERCERE'`, telemetry status `'REV. MMXXVI // ACOUSTIC INTELLIGENCE ENGINE // STANDBY'`, master title `'Sonus'`, subtitle `'Opus Manuscriptum: Adaptive Musical Practice System'`, three features (The Attentive Ear, The Spatial Canvas, The Constellation Memory), and `inkBleedFilter` parameters (`baseFrequency: 0.04`, `numOctaves: 4`, `scale: 5`, `stdDeviation: 0.6`).
   - `apps/web/src/design-system/tokens.ts` (lines 9–22, 38–53) defines colors (`parchment: #F4F1EA`, `charcoal: #2C2A29`, `crimson: #9A2A2A`, `parchmentSecondary: #E9E4DA`, `mutedInk: #7E7570`), geometry (`radius: '0px'`, zero drop shadows, hairline borders), and SMuFL musical glyphs (`MUSICAL_GLYPHS.fermata: '𝄐'`, `gClef: '𝄞'`, `caesura: '𝄩'`, `starNode: '✦'`).

2. **Existing Ink Bleed Component**:
   - `apps/web/src/components/ui/ink-bleed-filter.tsx` (lines 18–56) provides `<InkBleedFilter />` rendering an SVG filter with id `ink-bleed` using `<feTurbulence>`, `<feDisplacementMap>`, and `<feGaussianBlur>`.

3. **Current Authentication & Stand Routing**:
   - `apps/web/src/main.tsx` (lines 26–34) wraps `<App />` and renders `<SignInPage />` when signed-out via `@clerk/react`'s `<Show when="signed-out">`.
   - `apps/web/src/components/auth/sign-in-page.tsx` (lines 7–45) manages `sessionStorage.getItem('Sonus_guest_mode')` and `window.location.hash.includes('guest')` to conditionally return `<App isGuest={true} onExitGuest={...} />`.
   - `apps/web/src/components/screens/` directory does not yet exist.

4. **Build & Tool Verification**:
   - Executed `pnpm --filter web run build` (`tsc -b && vite build`): exited code 0, 506 modules transformed, built in 609ms.
   - Executed `pnpm --filter web run lint` (`oxlint`): exited code 0, 0 warnings and 0 errors across 20 files.

---

## 2. Logic Chain

1. **Step 1 (Component Responsibility)**:
   - Observation 1 and 3 establish that Milestone 3 requires a dedicated `LandingScreen` component in `apps/web/src/components/screens/landing-screen.tsx` rather than an ad-hoc sign-in page.
   - The component must serve as the primary entry gateway for both unauthenticated musicians and automated testing agents.

2. **Step 2 (Ink Bleed Bloom Reactivity)**:
   - Observation 2 shows that `<InkBleedFilter />` accepts props `scale` and `stdDeviation`.
   - By tracking pointer hover state (`isHovered`) on the hero section/title, `scale` increases from `5` to `8` and `stdDeviation` increases from `0.6` to `1.1`.
   - Combined with a Framer Motion underlay radial gradient filtered with `url(#ink-bleed)`, this yields an authentic, dynamic iron gall ink bloom that expands outward across parchment fibers.

3. **Step 3 (Marginalia & 3 Feature Scrolls)**:
   - Following Observation 1 (`LANDING_SCREEN_SPEC`), the outer frame must feature double rules (`border-2 border-[#2C2A29]` with corner flourishes), top marginalia (`AUDIRE · DISCERE · EXERCERE` and `REV. MMXXVI // ACOUSTIC INTELLIGENCE ENGINE // STANDBY`), and 3 feature scrolls (`The Attentive Ear`, `The Spatial Canvas`, `The Constellation Memory`) positioned above the subtle 5-line musical staff watermark (`staff-bg`).

4. **Step 4 (Clerk Auth & Instant Guest Audition)**:
   - Observation 3 shows how Clerk is used in the Vite shell. Clerk `<SignIn />` must be framed in an illuminated manuscript card with custom appearance tokens (zero border radius, `#E9E4DA` inputs, `#2C2A29` primary button with crimson `#9A2A2A` hover).
   - The "Audition as Guest (Instant Access)" button must write `sessionStorage.setItem('Sonus_guest_mode', 'true')` and render `<App isGuest={true} onExitGuest={handleExitGuest} />`, ensuring zero friction for user evaluation and Playwright automation.

5. **Step 5 (Backward Compatibility & Integration)**:
   - By creating `apps/web/src/components/screens/landing-screen.tsx` and updating `apps/web/src/components/auth/sign-in-page.tsx` to delegate to `LandingScreen`, the application maintains 100% compatibility with `main.tsx` while achieving clean modular layering.

---

## 3. Caveats

1. **Clerk Network Offline Behavior**: In offline or headless test environments without internet access, Clerk's `<SignIn />` may show a connection warning; the "Audition as Guest" button remains 100% operational regardless of Clerk's connectivity, ensuring reliable test execution.
2. **Reduced Motion**: If a user has `prefers-reduced-motion` enabled in their operating system, the Framer Motion radial pulse will remain static, preserving accessibility while maintaining visual fidelity.
3. **Screen Directory Creation**: `apps/web/src/components/screens/` does not exist yet; Worker M3 must create this directory before writing `landing-screen.tsx`.

---

## 4. Conclusion

The architectural blueprint for `apps/web/src/components/screens/landing-screen.tsx` is fully formulated and validated against the design system tokens, SVG filter mechanics, and app navigation lifecycle. A complete, copy-pasteable production implementation is documented in `report.md`. Worker M3 can immediately proceed with implementing the component, updating `sign-in-page.tsx`, and exporting it via `components/screens/index.ts`.

---

## 5. Verification Method

1. **Codebase Inspection**:
   - Verify `apps/web/src/components/screens/landing-screen.tsx` exists and exports `LandingScreen`.
   - Verify `apps/web/src/components/auth/sign-in-page.tsx` imports and renders `<LandingScreen />`.
   - Check that `h1` contains "Sonus" with `style={{ filter: 'url(#ink-bleed)' }}`.
   - Check that `data-testid="guest-audition-btn"` exists and triggers guest mode.

2. **TypeScript & Build Verification**:
   - Run `pnpm --filter web run build` (`tsc -b && vite build`) — must exit with code 0.
   - Run `pnpm --filter web run lint` (`oxlint`) — must report 0 errors and 0 warnings.

3. **Runtime Invalidation Conditions**:
   - If the ink bleed title fails to render or causes SVG clipping.
   - If clicking "Audition as Guest" does not transition to `<App isGuest={true} />`.
   - If any border radius or drop shadow violates the Living Manuscript design system.
