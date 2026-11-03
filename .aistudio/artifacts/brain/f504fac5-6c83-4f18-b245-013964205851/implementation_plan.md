# Implementation Plan — Landing Page Refinement, True Light/Dark Mode, Musician's Practice Room, Progress & Recommendations, and Peer Benchmarks

## 1. Repository Rule Updates & Full Light / Dark Theme Architecture
- **Update Repository Rules (`.agents/rules/archival-music-desk-design.md` & `AGENTS.md`)**:
  - Replace the legacy conservatory/sepia rules and rigid `h-44` 3-box footer constraints with our modern **Adaptive Musical Practice Design System** supporting both **Light Mode** and **Dark Mode**.
- **True Dual-Theme Palette (`Light Mode` & `Dark Mode`)**:
  - **Light Mode (Studio Alabaster & Warm Gallery Paper)**:
    - Canvas: `#F8F8F6` | Elevated Surfaces: `#FFFFFF` & `#F1F1EE` | Hairline Borders: `#E4E4E0`
    - Primary Ink: `#18181B` | Secondary Ink: `#52525B` | Muted Ink: `#71717A`
    - Accents: Warm Amber `#D97706` (primary actions & playhead), Emerald `#059669` (on-time / RH voice), Crimson `#DC2626` (late transition / missed chord tone).
  - **Dark Mode (Obsidian & Anodized Slate)**:
    - Canvas: `#09090B` | Elevated Surfaces: `#121215` & `#18181C` | Hairline Borders: `#27272A`
    - Primary Ink: `#F4F4F5` | Secondary Ink: `#A1A1AA` | Muted Ink: `#71717A`
    - Accents: Amber `#F59E0B`, Emerald `#10B981`, Crimson `#EF4444`.

---

## 2. Landing Page Fixes (Zero Debug Jargon, Real Volumetric Smoke, Smooth Scroll Curve)
- **Remove All Camera / Spline Debug Text**:
  - Strip out `CAM 07`, `DOCKED 1.0x`, `SPLINE 100%`, `01 APERTURE`, `X-PAN -120vw`, and all developer/camera-rig labels.
  - Replace navigation waypoints with clean, musician-first section names: **`Overview`**, **`Acoustic Detection`**, **`Mistake Pinpointing`**, **`Habit Tracking`**, and **`Song Library`**.
- **Real Procedural Volumetric Smoke & Atmospheric Haze (`VolumetricSmokeCanvas`)**:
  - Create a dedicated 60fps HTML5 `<canvas>` volumetric fog and drifting smoke plume renderer (`apps/web/src/components/landing/volumetric-smoke-canvas.tsx`) using layered multi-octave organic noise puffs and velocity-coupled drift that reacts visibly as the user scrolls in both Light Mode and Dark Mode.
- **Smooth Final Scroll Transitions (Movements 5 → 6 → 7)**:
  - Re-space the scroll keyframes across the `700vh` track with overlapping cubic-bezier crossfades, smooth `translateY` + `scale` handoffs, and gradual depth-of-field blur so the transition from **Habit Tracking** → **Progressive Tempo Ramp** → **Interactive Song Explorer** flows continuously without abrupt jumps or empty dead zones.

---

## 3. Redesigned Practice Room (Built for Practicing an Instrument, Not Audio Production)
- **Musician-First Intent & Terminology**:
  - Remove DAW/production jargon (`WORKSTATION`, `PRECISION TELEMETRY`, `MIC VU`, `FULL MATRIX`) and redesign the layout around what a practicing musician actually needs: **reading the score comfortably**, **preparing hand shapes for the next chord**, **seeing exactly where a mistake happened**, and **looping the tricky transition**.
- **New Spacious Layout (`apps/web/src/components/practice/practice-studio-cockpit.tsx`)**:
  1. **Top Practice Bar**:
     - Global navigation tabs to switch seamlessly between **`Practice Room`**, **`Progress & Coach`** (Profile / History / Recommendations), and **`Peer Benchmarks`** (Leaderboards & Percentiles), plus Piece Selector, `Piano` / `Guitar` toggle, `Falling Keys` / `Sheet Music` toggle, and `Light / Dark` theme button.
  2. **Main Score & Hand-Preparation Stage**:
     - **Spacious Sight-Reading Canvas**: High-contrast scrolling sheet music / tablature / falling keys supporting both Light and Dark themes, with inline measure feedback badges (`On Time`, `+142ms Late`, `Missed E4`).
     - **Interactive Measure Loop Selector**: Click any measure to seek, or toggle **"Loop Active Transition"** to cycle a 2-measure bracket repeatedly.
     - **Current Chord → Next Chord Hand Preparation Dock**: Side-by-side view showing the **Current Chord** fingering diagram (`Guitar Fretboard` or `25-Key Piano Voicing`) alongside the **Upcoming Chord** preview so the player can anticipate finger movement before the barline arrives.
  3. **Clean Bottom Practice Transport & Mistake Coach Bar**:
     - **Practice Speed & Transport Controls**: `Play / Pause`, `Reset`, quick practice speed pills (`70% Slow`, `85% Medium`, `100% Tempo`) + fine BPM stepper, `Metronome Click` toggle, `Reference Audio` toggle, and **`Record Practice Take`** button (plus a clean **`Simulate Practice Take`** menu for testing `Clean Take`, `Late Chord Change`, `Missed Note`, and `Rushing Tempo`).
     - **Instant Mistake Summary Strip**: Displays plain-English, non-hyped feedback after a take (e.g., *"Measure 3 (Am → C): Hand arrived 142ms late. Try looping Measures 2–3 at 70% speed."*) with a one-click **`Loop This Transition`** action and **`View Full Breakdown`** drawer trigger.

---

## 4. Profile, Session History & Research-Backed Exercise Recommendation Page (`apps/web/src/components/progress/progress-dashboard-page.tsx`)
- **3-Pillar Mathematical Recommendation Engine (`apps/web/src/lib/adaptive/recommendation-engine.ts`)**:
  - Grounded directly in the repository's `src/lib/adaptive/` research models:
    1. **Bayesian Knowledge Tracing (BKT)** *(Corbett & Anderson, 1995)*: Computes posterior mastery probability $P(L_t)$ for each chord transition using $P(L_0)=0.20, P(T)=0.15, P(S)=0.08, P(G)=0.12$. Transitions with $P(L_t) < 0.95$ are prioritized by learning gain.
    2. **SuperMemo SM-2 Spaced Repetition**: Grades each practice take $q \in [0..5]$ from timing offset (`ms`) and voicing completeness (`%`), updating Ease Factor $EF'$ and scheduling review intervals (in days) so previously learned transitions are reviewed right before forgetting occurs.
    3. **Thompson Sampling Multi-Armed Bandit**: Models each remedial drill type (`Isolated 2-Chord Loop`, `Subdivision Click`, `Arpeggiated Voicing Check`, `Progressive Tempo Ramp`) as a Beta-Binomial arm $\text{Beta}(\alpha_k, \beta_k)$ updated by historical post-drill improvement deltas, selecting the drill + exercise combination with the highest expected improvement for the musician.
- **Page Sections**:
  - **Musician Profile & Mastery Summary**: Overall accuracy trend, average transition speed (`ms`), voicing completeness (`%`), current practice streak, and mastered vs. learning chord transitions.
  - **"What to Practice Next" Recommendation Cards**: Top 3 personalized exercise & drill prescriptions explaining *why* each was chosen (e.g., *"BKT Mastery 48% · EWMA lag +138ms on Am → C · Recommended Strategy: Isolated 2-Chord Loop at 56 BPM"*) with a one-click **`Start Practice Loop →`** button that opens the Practice Room pre-configured to that exact drill and tempo.
  - **Longitudinal Improvement Charts & CUSUM Milestones**: Multi-session SVG trend charts tracking **Transition Latency (`ms`)** and **Accuracy (`%`)** over the last 12 sessions, highlighting **CUSUM Change-Point** breakthroughs where a recurring mistake was resolved.
  - **Chord Transition Mastery Matrix & Session History Table**: Filterable grid of every practiced chord transition (`P(Mastery)`, `SM-2 Next Review`, `Avg Offset ms`) and a detailed log of past practice sessions.

---

## 5. Peer Performance Comparison & Interactive Leaderboard Page (`apps/web/src/components/community/peer-comparison-page.tsx`)
- **Percentile Distribution Curves ("Where You Stand")**:
  - Interactive SVG Gaussian / quantile distribution charts comparing the user's metrics against the community cohort across three core dimensions:
    1. **Chord Transition Speed (`ms` onset error)** — e.g., user marker at `+18ms` (84th percentile) vs. peer median (`+46ms`).
    2. **Voicing Completeness (`%` chord tones sounded)** — e.g., `94.2%` (79th percentile).
    3. **Tempo Stability ($\sigma$ jitter in `ms`)** — e.g., `±11ms` (88th percentile).
- **Interactive Piece & Transition Leaderboards**:
  - Filterable by **Instrument** (`All`, `Piano`, `Guitar`), **Piece** (`Waltz No. 2`, `Pachelbel's Canon`, `Knockin' Cadence`, `House of the Rising Sun`, `Four-Chord Anthem`), and **Tempo Tier** (`70% Learning`, `100% Target`, `105% Mastery`).
  - Shows ranked musicians with their verified **Alignment Score (`%`)**, **Mean Timing Offset (`ms`)**, **Voicing Completeness (`%`)**, and **Fastest Clean Transition**, with the current user's row highlighted and a **`Practice to Beat This Score →`** button on every piece.
