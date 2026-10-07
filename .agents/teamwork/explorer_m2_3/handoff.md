# Handoff Report: Explorer M2-3 (App Shell Integration & Viewport Placement)

**Agent**: Explorer M2-3  
**Target**: Milestone 2 — App Shell Integration & Screen Viewport Placement  
**Handoff Type**: Hard  
**Date**: 2026-10-06  

---

## 1. Observation

1. **Current `apps/web/src/app.tsx`**:
   - Lines 5-34: Contains a single-page prototype layout with a hardcoded `<header>` (lines 7-27) containing "Opus Manuscriptum" and a `<LivePracticeView />` (line 31) embedded in a vertical flex column:
     ```tsx
     <main className="w-full h-full min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
       <header className="w-full py-8 px-12 flex justify-between items-end z-10">...</header>
       <div className="flex-1 w-full flex flex-col relative px-12 py-6">
         <LivePracticeView />
       </div>
     </main>
     ```
   - It does not currently contain any 2D spatial canvas container, world transform elements, or screen viewports for Profile, History, or Tuning Ritual.

2. **Current `apps/web/src/main.tsx`**:
   - Lines 23-35: Renders Clerk `<ClerkProvider>` with `<Show when="signed-out"><SignInPage /></Show>` and `<Show when="signed-in"><AuthShell><App /></AuthShell></Show>`:
     ```tsx
     createRoot(document.getElementById('root')!).render(
       <StrictMode>
         <ClerkProvider publishableKey={publishableKey}>
           <Show when="signed-out">
             <SignInPage />
           </Show>
           <Show when="signed-in">
             <AuthShell>
               <App />
             </AuthShell>
           </Show>
         </ClerkProvider>
       </StrictMode>,
     )
     ```
   - `apps/web/src/components/auth/sign-in-page.tsx` (lines 3-8) simply renders a centered `<SignIn />` from `@clerk/react`.
   - `apps/web/src/components/auth/auth-shell.tsx` (lines 10-18) renders a fixed top navigation header with "Blueprint" and `<UserButton />` that reduces vertical viewport space and conflicts with a full-screen 2D canvas.

3. **Design System & Spatial Tokens (`apps/web/src/design-system/tokens.ts`)**:
   - Lines 92-113: Defines `SPATIAL_MOTION_CONFIG` with physics spring parameters:
     ```typescript
     export const SPATIAL_MOTION_CONFIG = {
       spring: {
         stiffness: 70,
         damping: 18,
         mass: 1,
       },
       coordinates: {
         practice: { x: 0, y: 0 },
         profile: { x: 0, y: 1 },
         history: { x: 1, y: 0 },
         tuning: { x: -1, y: 0 },
       },
     } as const;
     ```

4. **Master Specifications (`PROJECT.md` & `ORIGINAL_REQUEST.md`)**:
   - `PROJECT.md` lines 4-16: Defines the 2D Spatial Single-Page Architecture:
     - Center `(0, 0)`: Practice Stand (`LivePracticeView`)
     - Up `(0, -1)`: Composer's Bio Profile (`ComposerProfileFolio`)
     - Left `(-1, 0)`: Constellation History (`ConstellationHistoryView`)
     - Right `(1, 0)`: Setup / Tuning Ritual (`TuningRitualView`)
     - Signed-out state presents the Living Manuscript Landing Page with Clerk `<SignIn />` and "Audition as Guest" CTA enabling instant entry to the 2D Spatial Stand.
   - `ORIGINAL_REQUEST.md` lines 24-27: Mandates Playwright visual & functional verification confirming both the Landing Page / Clerk auth and spatial navigation.

5. **Tool Execution Verification**:
   - Running `pnpm exec tsc --noEmit` in `apps/web/` exited with returncode 0 and no errors.
   - Dependency check in `apps/web/package.json` confirms `framer-motion: ^14.0.0`, `@clerk/react: ^6.1.0`, `react: ^19.2.8`, `@tailwindcss/vite: ^4.3.3`.

---

## 2. Logic Chain

1. **Reconciling Viewport Placement with Coordinate Transforms**:
   - Observation 1 & 3 show that navigation targets have coordinate multipliers in `tokens.ts`: `practice: (0, 0)`, `profile: (0, 1)`, `history: (1, 0)`, `tuning: (-1, 0)`.
   - Because moving the camera "Up" to view Profile at `(0, -100vh)` requires moving the physical world container "Down" by `+100vh`, the world transform vector is $\mathbf{T} = -\mathbf{P}$.
   - Therefore, positioning child viewports using Tailwind classes `-translate-y-full` for Profile, `-translate-x-full` for History, and `translate-x-full` for Tuning Ritual aligns with world camera translation `y: 100vh`, `x: 100vw`, and `x: -100vw`.

2. **Reconciling Layout Rules with Immersive Zero-Scroll Experience**:
   - Observation 1 shows `app.tsx` previously used `flex flex-col` with headers and padding, which causes clipping when translated.
   - Applying `w-screen h-screen overflow-hidden relative bg-[var(--background)]` to the outer container and `w-screen h-screen absolute top-0 left-0` to each child viewport guarantees that each screen takes the exact full browser window with zero scrollbars during spring motion.

3. **Reconciling Clerk Auth Rules with Guest Access Requirement**:
   - Observation 2 shows `main.tsx` strictly adheres to `AGENTS.md` by rendering `<Show when="signed-out"><SignInPage /></Show>`.
   - Observation 4 requires an unauthenticated "Audition as Guest" bypass for automated tests and musicians without accounts.
   - If guest mode is managed inside `components/auth/sign-in-page.tsx` via `sessionStorage` and URL hash `#guest`, `SignInPage` can render `LandingScreen` by default and seamlessly switch to rendering `<App isGuest={true} />` upon guest activation.
   - This satisfies the guest requirement without altering `main.tsx` or violating `AGENTS.md`.

4. **Preserving `LivePracticeView` at Center `(0, 0)`**:
   - `LivePracticeView` in `apps/web/src/components/live-practice-view.tsx` is completely functional with pitch ribbon and transport controls.
   - Mounting `LivePracticeView` inside Center `(0, 0)` alongside its classical Opus Manuscriptum header preserves all existing practice capabilities while integrating it into the 2D plane.

---

## 3. Caveats

1. **Screen Implementations in M2 vs M3**:
   - M2 focuses on the spatial container, app shell, coordinate transforms, and navigation triggers.
   - The rich interactive internals of Profile (repertoire ledger), History (celestial SVG scatter plot), and Tuning Ritual (astrolabe needle) are scheduled for implementation in Milestone 3.
   - M2 will mount clean screen shells in `apps/web/src/components/screens/` that implement the required dimensions, headers, return anchors, and layout tokens.
2. **Mobile Viewport Sizing**:
   - The application is specified for desktop treatise viewing (e.g., 1440x900). Mobile browsers with dynamic address bars may fluctuate `100vh`. Using `100%` on container dimensions mitigates this.
3. **Clerk Environment Variables**:
   - `apps/web/.env` currently has `VITE_CLERK_PUBLISHABLE_KEY` configured. If the key is ever missing or invalid, Clerk will fail loud as required by `AGENTS.md`.

---

## 4. Conclusion

1. `apps/web/src/app.tsx` must be refactored into a full-screen canvas shell housing `SpatialContainer`, containing:
   - Center `(0, 0)`: Practice Stand (`LivePracticeView` with Opus header).
   - Up `(0, -1)`: `ComposerProfileScreen` (`-translate-y-full`).
   - Left `(-1, 0)`: `ConstellationHistoryScreen` (`-translate-x-full`).
   - Right `(1, 0)`: `TuningRitualScreen` (`translate-x-full`).
2. Fixed overlays (`FolioNavAnchors` and `CelestialCompass`) must be mounted in `App` outside the panning world container with `pointer-events-none` on parent containers and `pointer-events-auto` on clickable triggers.
3. Clerk authentication and "Audition as Guest" flow should be unified cleanly inside `components/auth/sign-in-page.tsx`, rendering `LandingScreen` with Clerk `<SignIn />` and guest bypass to `<App isGuest={true} />`.
4. `AuthShell` must be updated to remove legacy topbars so authenticated users enjoy the unclipped full-screen 2D plane.

---

## 5. Verification Method

To independently verify these conclusions and test implementation:

1. **TypeScript Static Analysis**:
   ```powershell
   cd d:\Projects\adaptive-music-practice\apps\web
   pnpm exec tsc --noEmit
   ```
   *Expected outcome*: Exit code 0, 0 type errors.

2. **Dev Server Execution**:
   ```powershell
   pnpm run dev
   ```
   *Expected outcome*: Vite starts at `http://localhost:5173` without compilation warnings.

3. **DOM Viewport & Transform Inspection**:
   - Open browser at `http://localhost:5173/#guest` (or click "Audition as Guest").
   - Inspect elements: confirm `#viewport-practice`, `#viewport-profile`, `#viewport-history`, `#viewport-tuning` are present in DOM.
   - Press `ArrowLeft` or click `← 𝄌 Historia`: confirm world container translates to `x: 100vw, y: 0` with spring transition and reveals Constellation History.
   - Press `Escape`: confirm world container returns smoothly to `x: 0, y: 0` (Practice Stand).
   - Press `ArrowUp` or click `↑ 𝄞 Persona`: confirm world container translates to `x: 0, y: 100vh` and reveals Profile Folio.

4. **Invalidation Conditions**:
   - Any layout shift where scrollbars appear during spatial panning.
   - Inability to bypass Clerk login via "Audition as Guest" or `#guest` hash.
   - Disruption or unmounting of `LivePracticeView` at `(0, 0)`.
