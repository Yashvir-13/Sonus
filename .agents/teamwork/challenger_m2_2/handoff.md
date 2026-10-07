# Milestone 2 Challenge Report: Viewport Isolation & Downstream Compatibility

**Target**: Milestone 2 Empirical Challenge — Viewport Focus Isolation & Milestone 3 Compatibility  
**Agent**: Challenger M2-2 (Empirical Challenger)  
**Parent**: 5eaadbb4-8158-47fa-82fc-d97edd4b44b7  
**Date**: 2026-10-06  
**Verdict**: **APPROVE**  

---

## 1. Observation

1. **Static AST & Template Bindings**:
   In `apps/web/src/components/spatial/spatial-container.tsx` (lines 201–248):
   - `#viewport-practice` (line 207): `aria-hidden={currentTarget !== 'practice'}`, `inert={currentTarget !== 'practice' ? true : undefined}`
   - `#viewport-profile` (line 218): `aria-hidden={currentTarget !== 'profile'}`, `inert={currentTarget !== 'profile' ? true : undefined}`
   - `#viewport-history` (line 230): `aria-hidden={currentTarget !== 'history'}`, `inert={currentTarget !== 'history' ? true : undefined}`
   - `#viewport-tuning` (line 242): `aria-hidden={currentTarget !== 'tuning'}`, `inert={currentTarget !== 'tuning' ? true : undefined}`

2. **Real Browser DOM State & Focus Isolation (Playwright Empirical Run)**:
   In the active running application on `http://localhost:5173/`:
   - When `currentTarget === 'practice'`:
     - `#viewport-practice`: `hasInertAttr: false`, `inertProp: false`, `ariaHidden: "false"`
     - `#viewport-profile`: `hasInertAttr: true`, `inertProp: true`, `ariaHidden: "true"`
     - `#viewport-history`: `hasInertAttr: true`, `inertProp: true`, `ariaHidden: "true"`
     - `#viewport-tuning`: `hasInertAttr: true`, `inertProp: true`, `ariaHidden: "true"`
   - Programmatic focus check:
     Executing `button.focus()` on any button inside `#viewport-profile`, `#viewport-history`, or `#viewport-tuning` resulted in `document.activeElement === document.body` (focus strictly denied by the browser engine).
   - Across all 4 spatial transitions (`profile`, `history`, `tuning`, `practice`):
     Only the currently active viewport had `hasInertAttr: false` and `ariaHidden: "false"`. All 3 inactive viewports had `hasInertAttr: true` and `ariaHidden: "true"`.

3. **Input Typing Isolation**:
   In `apps/web/src/components/spatial/spatial-context.tsx` (lines 131–140):
   ```tsx
   const activeEl = document.activeElement as HTMLElement | null
   if (
     activeEl &&
     (activeEl.tagName === 'INPUT' ||
       activeEl.tagName === 'TEXTAREA' ||
       activeEl.tagName === 'SELECT' ||
       activeEl.isContentEditable)
   ) {
     return
   }
   ```
   Empirical injection of a focused `<input>` within the active viewport confirmed that keyboard keys (`w`, `W`, `a`, `s`, `d`, `ArrowUp`, `ArrowLeft`, `ArrowRight`, `ArrowDown`, `Escape`) yielded `defaultPrevented: false` and did NOT trigger camera movement. When blurred, pressing `w` immediately navigated to `profile`, and `Escape` immediately returned to `practice`.

4. **Downstream Milestone 3 Slot Polymorphism & Contracts**:
   In `apps/web/src/components/spatial/spatial-container.tsx` (lines 6–13, 210, 222, 234, 246):
   - `SpatialContainerProps` exports optional slots:
     `practiceScreen?: ReactNode`, `profileScreen?: ReactNode`, `historyScreen?: ReactNode`, `tuningScreen?: ReactNode`.
   - Each off-center slot falls back gracefully to default manuscript placeholders when omitted:
     - `profileScreen ?? <DefaultProfilePlaceholder onReturn={handleReturn} />`
     - `historyScreen ?? <DefaultHistoryPlaceholder onReturn={handleReturn} />`
     - `tuningScreen ?? <DefaultTuningPlaceholder onReturn={handleReturn} />`
   - All M3 data contracts in `apps/web/src/types/index.ts` (`TuningState`, `AudioInputMode`, `PracticeSessionNode`, `ComposerProfile`) can be instantiated without compiler or interface friction.

5. **SessionStorage Guest Mode Persistence**:
   In `apps/web/src/components/auth/sign-in-page.tsx` (lines 7–13, 30–41):
   - Clicking "Audition as Guest" sets `sessionStorage.setItem('Sonus_guest_mode', 'true')` and renders `<App isGuest={true} />`.
   - Browser navigation and page refresh at `http://localhost:5173/` (without `#guest` hash) verified persistence: `Sonus_guest_mode` remained `'true'` and `<App isGuest={true} />` mounted immediately.
   - Clicking "Depart Sanctuary (Guest)" removed the session item (`sessionStorage.removeItem('Sonus_guest_mode')`) and returned the browser to `<SignInPage />`.

6. **Automated Stress Test Suite Execution**:
   Running `pnpm dlx tsx scripts/verify-m2-isolation-downstream.ts`:
   ```text
   TOTAL TESTS: 50 | PASSED: 50 | WARNINGS: 0 | FAILED: 0
   VERDICT: APPROVE
   ```

7. **Build and Lint Verification**:
   - `pnpm --dir apps/web run build` (`tsc -b && vite build`):
     ```text
     ✓ 506 modules transformed.
     dist/assets/index-B3enpX5q.css  138.83 kB │ gzip:  75.26 kB
     dist/assets/index-B0hSHmyr.js   503.53 kB │ gzip: 148.87 kB
     ✓ built in 647ms
     ```
     Exit Code: `0`.
   - `pnpm --dir apps/web run lint` (`oxlint`):
     ```text
     Found 0 warnings and 0 errors.
     Finished in 20ms on 20 files with 116 rules using 12 threads.
     ```
     Exit Code: `0`.

---

## 2. Logic Chain

1. **Focus Isolation & Accessibility**:
   - From Observation 1 and 2, inactive viewports dynamically receive `aria-hidden="true"` and `inert={true}`.
   - The HTML `inert` attribute instructs the browser layout and accessibility engine to completely remove the element and its descendants from sequential focus navigation (Tab/Shift-Tab) and programmatic focus (`.focus()`).
   - The empirical Playwright evaluation confirmed that inactive screens cannot steal focus or receive focus under any circumstances, satisfying Objective 1.

2. **Keyboard Event Safety**:
   - From Observation 3, `spatial-context.tsx` inspects `document.activeElement`.
   - Form fields and content-editable nodes retain native key events, ensuring M3 interactive controls (tempo inputs, pitch sliders, text filters) will operate normally without triggering camera translation.

3. **Milestone 3 Downstream Compatibility**:
   - From Observation 4, `SpatialContainer` implements a slot-based architecture.
   - When Milestone 3 workers complete `TuningRitualScreen`, `ConstellationHistoryScreen`, and `ComposerProfileScreen`, they can pass them directly into `profileScreen`, `historyScreen`, and `tuningScreen` without altering the coordinate math, spring configuration, or accessibility handling in `spatial-container.tsx`.
   - If slots are omitted, the Living Manuscript placeholders provide a visually consistent fallback with working return anchors.

4. **Guest Mode Resilience**:
   - From Observation 5, unauthenticated users and automated test agents (e.g., Playwright in Milestone 4) can access the 2D spatial canvas via `sessionStorage` persistence or the `#guest` hash.
   - This prevents unauthenticated redirects to Clerk login pages during visual evaluation while keeping Clerk authentication functional for production users.

---

## 3. Caveats

- **Audio Hardware Permissions in Headless Browsers**: The `TuningRitualView` placeholder displays default `MIC: READY` and `MIDI: STANDBY` telemetry. Live Web Audio API microphone capture in Milestone 3/4 requires browser media stream permissions.
- No other caveats.

---

## 4. Conclusion

Milestone 2 satisfies all architectural, accessibility, focus isolation, and downstream compatibility requirements. Viewport focus isolation via `inert` and `aria-hidden` is verified empirically in a live browser engine, keyboard isolation is robust, downstream M3 screen slots are fully compatible, and both build and lint pass with 0 errors.

**Verdict: APPROVE**

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run the Challenger M2-2 Empirical Verification Suite**:
   ```bash
   pnpm dlx tsx scripts/verify-m2-isolation-downstream.ts
   ```
   *Expected output*: 50/50 tests passing with Exit Code `0`.

2. **Run Web Production Build**:
   ```bash
   pnpm --dir apps/web run build
   ```
   *Expected output*: `tsc -b && vite build` completes with Exit Code `0`.

3. **Run Web Linter**:
   ```bash
   pnpm --dir apps/web run lint
   ```
   *Expected output*: `oxlint` reports 0 warnings and 0 errors.

4. **Inspect Files**:
   - `apps/web/src/components/spatial/spatial-container.tsx` (lines 201–248 for `inert` and `aria-hidden`)
   - `apps/web/src/components/spatial/spatial-context.tsx` (lines 131–140 for `activeElement` check)
   - `apps/web/src/components/auth/sign-in-page.tsx` (lines 7–45 for guest mode `sessionStorage`)
   - `scripts/verify-m2-isolation-downstream.ts` (test cases for AST, truth table, and downstream slots)
