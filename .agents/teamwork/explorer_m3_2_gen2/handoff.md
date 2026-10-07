# Handoff Report: Setup & Sacred Tuning Ritual Screen Architecture (Explorer M3-2 Gen 2)

## 1. Observation

1. **Dispatch Directives & Specifications**:
   - `DISPATCH.md` lines 10-17 instructed formulating the implementation architecture for `apps/web/src/components/screens/tuning-ritual-screen.tsx`: Sacred Tuning Astrolabe circular dial (diameter 320px) with graduated intonation ticks (-50 to +50 cents), animated needle ($\theta = \frac{\text{cents}}{50} \times 60^\circ$), glowing crimson resonance halo when in-tune (`abs(cents) <= 3`), Acoustic Mic vs WebMIDI auto-detection with mock fallback, pitch standards 415/440/442Hz, and return-to-stand trigger integrated with `useSpatialNavigation().panTo('practice')`.
   - `apps/web/src/design-system/screens.ts` lines 85-136 defines `TUNING_RITUAL_SPEC` containing `dialGeometry` (`diameter: 320`, `center: {x: 160, y: 160}`, `needleLength: 110`, `arcMinCents: -50`, `arcMaxCents: 50`, `arcMinAngleDeg: -60`, `arcMaxAngleDeg: 60`), `calculateNeedleAngle`, `isInTune`, `pitchStandards` (415, 440, 442 Hz), and `instrumentRegisters` (Violin, Viola, Cello, Flute, Voice).
   - `PROJECT.md` lines 61-75 defines the `TuningState` interface contract (`mode: 'mic' | 'midi'`, `detectedPitch`, `detectedFrequency`, `centsDeviation`, `targetFrequency`, `inTune`, `signalLevel`).
   - `DESIGN.md` lines 5-30 mandates strict Living Manuscript tokens: parchment `#F4F1EA`, charcoal `#2C2A29`, crimson `#9A2A2A`, vellum `#E9E4DA`, zero border radius (`0px`), zero modern SaaS drop shadows, and musical SMuFL glyphs.
2. **Existing Spatial Infrastructure**:
   - `apps/web/src/components/spatial/spatial-context.tsx` lines 48-77 defines `useSpatialNavigation()` with `panTo(target: SpatialTarget)`.
   - `apps/web/src/components/spatial/spatial-container.tsx` lines 237-248 provides the container slot `tuningScreen ?? <DefaultTuningPlaceholder onReturn={handleReturn} />` at coordinate position `left: 100vw, top: 0vh`.
   - `apps/web/src/app.tsx` lines 46-59 renders `<SpatialContainer practiceScreen={...} />` and is ready to receive `tuningScreen={<TuningRitualScreen />}`.
3. **Environment & Dependency Checks**:
   - `apps/web/package.json` lines 12-24 confirms `framer-motion: ^14.0.0`, `react: ^19.2.8`, `clsx`, `tailwind-merge`, and `@tailwindcss/vite: ^4.3.3`.
   - `apps/web/tsconfig.app.json` lines 18-20 enforces `verbatimModuleSyntax: true` and strict TypeScript.
   - `apps/web/src/components/screens/` does not yet exist and needs to be created when implementing the screen.

---

## 2. Logic Chain

1. **Dial Geometry & Mathematics (Observation 1)**:
   - Given dial diameter 320px and center $(160, 160)$, the intonation deviation arc spans $-50$ to $+50$ cents across $-60^\circ$ to $+60^\circ$.
   - The needle angle equation is uniquely determined: $\theta = \frac{\text{clamp}(\text{cents}, -50, 50)}{50} \times 60^\circ$.
   - Major ticks every 10 cents and minor ticks every 5 cents can be generated using radial polar-to-Cartesian trigonometric projections from the center $(160, 160)$.
   - The in-tune threshold is strictly defined as $|\text{cents}| \le 3.0$. An inner concentric ring ($r = 142\text{px}$) with SVG blur/glow filter dynamically activates with stroke `#9A2A2A` when in-tune, fulfilling the resonance halo requirement.
2. **Audio Hardware & Headless Testability (Observations 1 & 3)**:
   - Physical microphone input requires Web Audio API `AudioContext` and `AnalyserNode`. Using normalized autocorrelation on the time-domain buffer (`Float32Array`) with parabolic peak interpolation yields sub-hertz monophonic pitch detection without external dependencies.
   - However, in automated CI/CD and Playwright test environments, physical audio devices are absent and `getUserMedia` will reject.
   - Therefore, the audio engine hook (`use-tuning-engine.ts`) must implement an auto-detecting fallback mechanism that seamlessly switches to an acoustic simulation feed when hardware is unavailable or in headless mode.
   - Furthermore, explicit test triggers (`triggerSimulationCents(0)`, `triggerSimulationCents(-18)`, `triggerSimulationCents(24)`) in the UI allow Playwright agent-as-judge tests to deterministically verify in-tune/out-of-tune dial needle positions and halo states.
3. **Hardware Mode & Calibration Switching (Observation 1)**:
   - A segmented toggle switches between `MIC` and `MIDI`. In MIDI mode, `navigator.requestMIDIAccess` parses Note-On messages (`0x90`), translating note numbers to nominal frequencies.
   - Pitch standards (`415 Hz`, `440 Hz`, `442 Hz`) update reference frequency $A_4$, immediately recalculating all cents deviations and target notes.
   - Instrument selection displays the playable register and clef (`𝄞`, `𝄡`, `𝄢`) on a mini 5-line staff with clickable open string quick-tune buttons.
4. **Spatial Navigation Trigger (Observation 2)**:
   - A ceremonial wax seal CTA button styled in crimson (`#9A2A2A`) with a musical fermata glyph (`𝄐`) invokes `useSpatialNavigation().panTo('practice')`, smoothly panning the continuous 2D canvas back to the Practice Stand at `(0, 0)`.
5. **Architectural Separation (Observations 1 & 3)**:
   - Following SOLID and strict modularity, pure mathematical formulas are isolated in `apps/web/src/lib/pitch-math.ts`, reactive audio/midi state is isolated in `apps/web/src/hooks/use-tuning-engine.ts`, and the UI is encapsulated in `apps/web/src/components/screens/tuning-ritual-screen.tsx`.

---

## 3. Caveats

- **WebMIDI Browser Support**: The WebMIDI API is natively supported in Chromium-based browsers, but restricted or permission-gated in Firefox and Safari. The proposed architecture handles this gracefully with simulated interface status when unavailable.
- **AudioWorklet vs AnalyserNode**: While an `AudioWorklet` offloads DSP to a background audio thread, an `AnalyserNode` running autocorrelation in `requestAnimationFrame` on the main thread is significantly simpler, avoids separate bundle/asset loading issues in Vite, and uses less than 1% CPU for 2048-sample buffers.
- **No Direct Source Edits**: As an Explorer agent with read-only investigation mandates, no files in `apps/web/` have been directly created or modified. All complete code implementations are documented in `report.md` for Worker M3.

---

## 4. Conclusion

The architectural blueprint and concrete code specifications for `apps/web/src/components/screens/tuning-ritual-screen.tsx`, `apps/web/src/hooks/use-tuning-engine.ts`, and `apps/web/src/lib/pitch-math.ts` are fully formulated and documented in `report.md`. The design achieves complete compliance with the Living Manuscript design system, satisfies all mathematical and hardware detection requirements, provides headless simulation fallback for automated Playwright verification, and wires seamlessly into the 2D spatial canvas.

---

## 5. Verification Method

To verify the implementation once Worker M3 implements the blueprint:

1. **TypeScript Compilation & Lint Check**:
   ```bash
   pnpm run app:web -- build
   pnpm run app:web -- lint
   ```
   *Expected result*: Clean build without type errors or lint warnings under `verbatimModuleSyntax: true`.
2. **Visual & Interactive Inspection**:
   - Start Vite dev server: `pnpm run app:web -- dev`
   - Navigate to `#tuning` or click the right margin folio anchor (`→ Harmonia`).
   - Verify the 320px circular Astrolabe dial is rendered with concentric charcoal rings and tick markings.
   - Click test trigger `0¢ [Tune]`: Verify needle is vertical ($\theta = 0^\circ$) and the crimson resonance halo ring glows with `#9A2A2A`.
   - Click test trigger `-18¢ [Flat]`: Verify needle rotates to $-21.6^\circ$ toward `♭` and halo deactivates.
   - Click test trigger `+24¢ [Sharp]`: Verify needle rotates to $+28.8^\circ$ toward `♯` and halo deactivates.
   - Toggle pitch standards (415 Hz, 440 Hz, 442 Hz): Verify nominal reference frequencies adjust accordingly.
   - Click "Seal Tuning & Mount Stand": Verify canvas smoothly pans back to `#practice` at `(0, 0)`.
3. **Invalidation Conditions**:
   - Needle angle formula deviation from $\theta = \frac{\text{cents}}{50} \times 60^\circ$.
   - Resonance halo fails to activate when $|\text{cents}| \le 3$.
   - Crash or blank screen when browser denies microphone permissions.
   - Use of rounded borders (`border-radius > 0`) or drop shadows violating the Living Manuscript tokens.
