# SONUS: Dual-Theme Musician's Practice Room, Cinematic Stage & Adaptive Coaching Specification

**Project**: SONUS (`Adaptive Musical Practice System`)  
**Document**: UI & Product Architecture Specification  
**Aesthetic**: Dual-Theme Acoustic Studio & Musician's Practice Room (`#F8F8F6` Studio Alabaster in Light Mode, `#09090B` Deep Obsidian in Dark Mode)  
**Strict Mandate**: Built for practicing musicians (not a recording DAW or fake camera telemetry simulator). Zero AI buzzwords, zero fake camera rig jargon (`CAM 07`, `SPLINE 100%`).

---

## 1. Executive Intent & Design Philosophy

SONUS is built for practicing guitarists and pianists who want to see **how to shape their hands now**, **what chord comes next**, **where a transition broke down**, **what remedial drill to practice next**, and **how their timing and voicing compare against peers**.

### Core Design Pillars
1. **True Dual-Theme Practice Room (Light & Dark Modes)**:
   - **Light Mode (Daylight Practice Sheet)**: Warm Studio Alabaster (`#F8F8F6`), Crisp Sheet Ivory cards (`#FFFFFF`), Deep Charcoal engraving (`#18181B`), Warm Stone hairlines (`#E4E4E0`).
   - **Dark Mode (Evening Obsidian Studio)**: Deep Obsidian (`#09090B`), Anodized Slate panels (`#121215`, `#18181C`), Crisp Zinc typography (`#F4F4F5`), Hairline Zinc borders (`#27272A`).
   - **Semantic Accents**: Warm Amber (`#D97706` / `#F59E0B`) for Left-Hand (LH) notes, active playheads, and loop brackets; Studio Emerald (`#059669` / `#10B981`) for Right-Hand (RH) notes and verified on-beat hits; Crimson (`#DC2626` / `#EF4444`) for transition lag, tempo rushing/dragging, and dropped voicings.
2. **60fps Volumetric Smoke & Stage Light Landing Experience (`VolumetricSmokeCanvas`)**:
   - Multi-layered procedural turbulence smoke plumes and warm amber/ivory stage light cones rendered on an HTML5 `<canvas>`.
   - Smooth scroll-linked Z-space stage choreography without abrupt opacity cutoffs or fake camera telemetry labels.
3. **Musician's Practice Room (`PracticeStudioCockpit`)**:
   - **Current Chord → Next Chord Hand Preparation Dock**: Side-by-side interactive diagrams showing both the active chord and the upcoming chord so the musician can prepare anchor fingers and hand shifts ahead of the beat.
   - **Interactive 2-Bar Loop & Speed Trainer**: One-click `Loop Hard Transition` bracket with `70% Slow`, `85% Med`, and `100% Tempo` presets.
   - **Plain-English Coaching**: Immediate human-readable feedback after every take explaining which transition lagged or which chord tone was muted.
4. **Progress, History & Cognitive Exercise Coach (`ProgressDashboardPage`)**:
   - **3-Pillar Recommendation Engine (`recommendation-engine.ts`)**:
     - **Bayesian Knowledge Tracing (Corbett & Anderson, 1995)**: Tracks posterior mastery $P(L_t)$ per chord transition.
     - **SuperMemo SM-2 Spaced Repetition**: Schedules optimal review intervals and Ease Factors ($EF \ge 1.3$) from continuous timing and voicing metrics.
     - **Thompson Sampling Multi-Armed Bandit**: Selects the pedagogical drill strategy (*Anchor Finger Pivot*, *2-Bar Slow Loop*, *Voicing Isolation*, *Progressive Tempo Ramp*) with the highest empirical expected improvement $\theta_k \sim \text{Beta}(\alpha_k, \beta_k)$.
   - **Longitudinal Trajectory & CUSUM Change-Points**: Interactive multi-session SVG chart with Page's Two-Sided CUSUM markers pinpointing when a motor habit formed or a clean breakthrough locked in.
5. **Peer Benchmarks & Piece Leaderboards (`PeerComparisonPage`)**:
   - **Percentile Distribution Bell Curves**: Interactive SVG normal/skewed distribution curves for *Chord Transition Speed (ms)*, *Voicing Completeness (%)*, and *Overall Alignment Score (%)* with a glowing `YOU` marker (`P50`, `P75`, `P90`, `P99`).
   - **Filterable Piece Leaderboards**: Repertoire-specific rankings across Piano and Guitar standards with direct one-click launch into the Practice Room.
