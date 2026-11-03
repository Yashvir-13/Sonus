# Acoustic Studio & Musician's Practice Room Design System (`apps/web`)

Activation: files under `apps/web/src/**/*.{ts,tsx,css}`

## 1. Aesthetic Mandate & Practice Intent

- **Visual Theme**: Dual-Theme Acoustic Studio & Musician's Practice Room — combining high-contrast score legibility in Daylight Practice Room mode with anodized aluminum and warm amber LED clarity in Nocturnal Studio mode.
- **Core Intent**:
  - The application is a **Musician's Practice Room**, not an audio production DAW.
  - Every visual element serves deliberate musical practice: sight-reading the score cleanly, preparing finger transitions ahead of the beat (`Current Chord → Next Chord`), spotting where you hesitated or missed a chord tone, and looping the exact transition at a comfortable tempo.
- **Cinematic Landing Page**:
  - Scroll-driven camera movement (`perspective: 1400px`, Z-zoom, horizontal pan, vertical plunge, smooth overlapping crossfades) paired with a live HTML5 `<canvas>` procedural volumetric smoke/haze simulation (`VolumetricSmokeCanvas`) that responds to scroll velocity.
  - Zero fake camera rig telemetry (`CAM 07`, `SPLINE 100%`, `DOCKED 1.0x`) and zero AI marketing buzzwords. Honest, musician-focused terminology only.

---

## 2. Dual Light & Dark Color Tokens

### Light Mode (Daylight Practice Room)
- **Canvas / Background**: `#F8F8F6` (`bg-[#F8F8F6]`)
- **Cards & Elevated Surfaces**: `#FFFFFF` (`bg-white`) and `#F1F1EE` (`bg-[#F1F1EE]`)
- **Primary Ink**: `#18181B` (`text-zinc-900`)
- **Secondary Ink / Labels**: `#52525B` (`text-zinc-600`), `#71717A` (`text-zinc-500`)
- **Hairline Borders**: `#E4E4E0` (`border-zinc-200`)

### Dark Mode (Nocturnal Studio)
- **Canvas / Background**: `#09090B` (`dark:bg-[#09090B]`)
- **Cards & Elevated Surfaces**: `#121215` (`dark:bg-[#121215]`) and `#18181C` (`dark:bg-[#18181C]`)
- **Primary Ink**: `#F4F4F5` (`dark:text-zinc-100`)
- **Secondary Ink / Labels**: `#A1A1AA` (`dark:text-zinc-400`), `#71717A` (`dark:text-zinc-500`)
- **Hairline Borders**: `#27272A` (`dark:border-zinc-800`)

### Functional Practice Accents (Both Modes)
- **Playhead & Left-Hand (LH) Voicings**: Amber (`#D97706` light / `#F59E0B` dark)
- **Right-Hand (RH) Voicings & Verified Intonation**: Emerald (`#059669` light / `#10B981` dark)
- **Timing Hesitation (+ms) / Missed Chord Tone**: Crimson (`#DC2626` light / `#EF4444` dark)

---

## 3. Multi-Instrument & Cognitive Practice Architecture

1. **Musician's Practice Room Layout**:
   - Top bar with global navigation (`Practice Room`, `Progress & Coach`, `Peer Benchmarks`), Piece Selector, `Piano` / `Guitar` toggle, `Falling Keys` / `Sheet Music` toggle, and `Light / Dark` theme toggle.
   - Main Sight-Reading & Loop Stage with interactive **Measure Loop Brackets** and inline mistake badges.
   - **Current Chord → Next Chord Hand Preparation Dock** showing side-by-side fretboard/keyboard diagrams for the active measure and the upcoming measure.
   - Focused **Practice Transport & Mistake Coach Bar** with practice speed presets (`70% Slow`, `85% Medium`, `100% Tempo`), Record Practice Take, Simulate Practice Take, and one-click `Loop This Transition`.
2. **Research-Backed Exercise Recommendation Engine**:
   - Combines **Bayesian Knowledge Tracing (BKT)** latent skill mastery $P(L_t)$, **SuperMemo SM-2 Spaced Repetition** review intervals & ease factors, and a **Thompson Sampling Multi-Armed Bandit** over remedial drill strategies (`isolated_transition`, `subdivision_click`, `voicing_arpeggio`, `gradual_tempo_ramp`).
3. **Peer Benchmarks & Leaderboards**:
   - Displays interactive percentile bell curves (`Transition Speed ms`, `Voicing Completeness %`, `Tempo Stability ±ms`) alongside piece-by-piece leaderboards filtered by instrument and tempo tier.
