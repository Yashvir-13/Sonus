# Sonus — Adaptive Musical Practice Studio

![Sonus Practice Studio Hero](docs/assets/screens/01-landing-page-hero.png)

---

### Why I Built Sonus

Whenever you sit down in an empty room with an instrument — whether it's an old acoustic guitar or an upright piano — there is an honesty to it that is hard to find anywhere else. 

Your fingers either make the transition smoothly, or they stumble. You either landed that chord cleanly on beat three, or you rushed it by 40 milliseconds because your left hand was anxious about the next bar. There is no faking it. You have to sit there, make mistakes over and over, and slowly figure out what your body is doing wrong before you can finally lean back and say, *"Okay. That felt right."*

The strange thing is, almost every modern music learning app seems terrified of that reality. 

Instead of treating you like an adult trying to learn a demanding physical skill, they treat you like someone who needs to be conditioned with cheap dopamine. You get gamified streaks, cartoon animations, and corporate marketing pitches claiming an "AI-driven revolution in musical synergy." But when you actually sit down to practice, none of that helps. A chatbot pretending to be your friend cannot fix the fact that your ring finger is muting the high E string.

I wanted something different. I wanted a quiet, serious practice studio that respects your time. 

A tool that doesn't guess or flatter you, but acts as an honest mirror:
- It listens to the real sound coming out of your acoustic instrument through your laptop or phone microphone.
- It measures your timing and chord voicings down to the millisecond using signal processing instead of random guesses.
- It tracks how your muscle memory actually holds up over days and weeks, noticing subtle physical habits — like a chronic micro-hesitation every time you change from C to F.
- And when it suggests what to practice next, it does so using proven learning science, not marketing fluff.

No corporate buzzwords. No keeping your recordings on remote servers. Just clean physics, thoughtful cognitive modeling, and an honest space to play music.

---

## 🎬 30-Second Studio Walkthrough

Here is a short recording of Sonus running live — showing the **Studio Alabaster** piano score for Shostakovich's *Waltz No. 2*, switching to the Synthesia **Falling Keys** waterfall view, opening the uncluttered **Studio Setup** popover, jumping into **The House of the Rising Sun** in **Deep Obsidian** guitar mode with live TAB and vector fretboards, and testing the **Acoustic Tuner** and **Cognitive Mastery Dashboard**.

<p align="center">
  <video src="docs/assets/demo/sonus-walkthrough.mp4" controls width="100%" poster="docs/assets/screens/01-landing-page-hero.png" style="max-width: 960px; border-radius: 8px;">
    Your browser does not support the video tag. You can view the demo video directly at <a href="docs/assets/demo/sonus-walkthrough.mp4">docs/assets/demo/sonus-walkthrough.mp4</a>.
  </video>
</p>

---

## 📸 Feature Showcase

| 🎹 Studio Alabaster (Light Mode) | 🎸 Deep Obsidian (Dark Mode) |
| :--- | :--- |
| Clean daytime engraving. VexFlow v5 Grand Staff with W3C SMuFL Bravura fonts, continuous beat-aligned playhead, and 25-key acoustic piano dock. | Nighttime studio. Simultaneous 6-string TAB and standard notation, chord diagrams with fretting finger digits, and 2-bar transition loops. |
| ![Piano Alabaster](docs/assets/screens/02-practice-studio-piano-alabaster.png) | ![Guitar Obsidian](docs/assets/screens/03-practice-studio-guitar-obsidian.png) |

| 🎛️ Hideable Studio Setup Menu | 🎼 Synthesia Falling Keys Waterfall |
| :--- | :--- |
| Practice settings (Listen vs Practice mode, Guitar vs Piano, Grand Staff vs Falling Keys) tucked neatly into an uncluttered popover menu. | Real-time vertical waterfall roll for visual learners. Color-coded left-hand (Amber) and right-hand (Emerald) notes descending toward the strike line. |
| ![Studio Setup](docs/assets/screens/04-studio-setup-popover.png) | ![Falling Keys](docs/assets/screens/05-waterfall-falling-keys.png) |

| 🎯 Real-Time Acoustic Guitar Tuner | 📚 Chords & Scales Compendium |
| :--- | :--- |
| Precision ±50¢ analog needle powered by Pearson autocorrelation. Automatic string detection with hysteresis and Karplus-Strong string references. | Interactive library across all 12 chromatic keys. Triads, 7ths, altered voicings, and modes with audio previews and 1-click isolated practice drills. |
| ![Acoustic Tuner](docs/assets/screens/06-acoustic-guitar-tuner.png) | ![Chords Compendium](docs/assets/screens/07-chords-scales-compendium.png) |

| 📈 Cognitive Skill & Habit Dashboard | 👥 Cohort Peer Benchmarks |
| :--- | :--- |
| Longitudinal motor habit tracking. Bayesian Knowledge Tracing curves, Page's CUSUM shift indicators, and SM-2 retention schedules for every chord pair. | Empirical percentile distributions across global practice cohorts. Compare timing consistency and voicing accuracy against real musicians playing the same song. |
| ![Cognitive Dashboard](docs/assets/screens/08-progress-cognitive-dashboard.png) | ![Peer Benchmarks](docs/assets/screens/09-peer-benchmarks.png) |

---

## 🏛️ System Architecture & Engineering Blueprints

Sonus is built in two layers: an interactive client Single Page Application that handles low-latency audio DSP and notation rendering in the browser, and an asynchronous Python 3.12 backend that handles polyphonic machine learning, sequence alignment, and cognitive modeling.

### 1. End-to-End System Architecture

![End-to-End System Architecture](docs/assets/diagrams/01-system-architecture.png)

### 2. Audio Processing & Alignment Data Flow (DFD)

![Audio Processing Pipeline DFD](docs/assets/diagrams/02-audio-pipeline-dfd.png)

### 3. Cognitive Engine & Longitudinal Feedback Loop

![Cognitive Engine Loop](docs/assets/diagrams/03-cognitive-engine-flow.png)

### 4. Database Relational Schema (ERD)

![Database Relational Schema ERD](docs/assets/diagrams/04-database-erd.png)

### 5. Musician Practice Lifecycle (UML Sequence)

![Musician Practice Lifecycle Sequence](docs/assets/diagrams/05-musician-journey-uml.png)

---

## 🔬 The Algorithms of Sonus: Why, Where & How

Rather than hiding behind vague claims, here is the exact math and logic behind every algorithm running in Sonus, why each one was chosen, where it lives in the codebase, how it works in plain terms, and the published research papers from which it was adapted.

```
=============================================================================================
ALGORITHM DIRECTORY & RESEARCH CITATIONS
=============================================================================================
 1. Pearson Autocorrelation Pitch Tracking     [McLeod & Wyvill 2005; de Cheveigné 2002]
 2. AudioWorklet Chromagram & Cosine Matching  [Fujishima 1999; Müller 2015]
 3. Karplus-Strong String Physical Modeling    [Karplus & Strong 1983; Jaffe & Smith 1983]
 4. Inharmonic Multi-Partial Piano Synthesis   [Fletcher, Blackham, & Stratton 1962]
 5. Dual-Cavity Woodblock Metronome Synthesis  [Physical Acoustic Cavity Resonance]
 6. Spotify Basic Pitch Neural Transcription   [Bittner et al., ICASSP 2022]
 7. Hann STFT Harmonic Peak Tracking Fallback  [Smith 2011; Harris 1978]
 8. Two-Pass Strum & Arpeggio Window Clust.    [Empirical Guitar Kinematics]
 9. F1 Pitch-Class Chord Identification        [Information Retrieval Harmonic Rules]
10. Voicing Set Diagnostics & Harmonic Role    [Functional Harmony Role Weights]
11. Needleman-Wunsch DP with Sakoe-Chiba Band  [Needleman & Wunsch 1970; Sakoe & Chiba 1978]
12. Exponentially Weighted Moving Avg (EWMA)   [Lucas & Saccucci 1990; Hunter 1986]
13. Page's Two-Sided CUSUM Change-Point Test   [Page 1954; Basseville & Nikiforov 1993]
14. Bayesian Knowledge Tracing (2-State HMM)   [Corbett & Anderson 1995; Baker et al. 2008]
15. SuperMemo SM-2 Spaced Repetition           [Wozniak 1990; Pavlik & Anderson 2005]
16. Multi-Armed Bandit (Thompson & UCB1)       [Thompson 1933; Auer, Cesa-Bianchi, et al. 2002]
17. Bravura SMuFL Engraving & Beat-to-X Map    [W3C SMuFL Specification; Good 2001]
18. Grounded AI Pedagogical Coaching Engine    [Deterministic Fact Bundles + Fallback]
=============================================================================================
```

---

### Group A: Real-Time Browser Audio DSP

#### 1. Pearson-Normalized Autocorrelation Pitch Tracker
- **Where in Code**: `apps/web/src/lib/audio/realtime-pitch-tracker.ts`
- **Why We Use It**: When you pluck a low guitar string hard, the attack sound creates overtones that are often louder than the actual fundamental note. Basic frequency peak-picking gets fooled by this and jumps an octave too high.
- **How It Works**: We compare the incoming sound wave against delayed versions of itself. By measuring how well the wave lines up with its own reflection over different time delays (lags), we find the true repeating period of the vibrating string. We use parabolic interpolation across neighboring points to get sub-semitone pitch accuracy, and filter out micro-jitters with a running median filter so the tuner needle stays rock-steady.
- **Citations**: 
  - McLeod, P., & Wyvill, G. (2005). *A Smarter Way to Find Pitch*. ICMC 2005.
  - de Cheveigné, A., & Kawahara, H. (2002). *YIN, a fundamental frequency estimator for speech and music*. The Journal of the Acoustical Society of America, 111(4), 1917–1930.

#### 2. AudioWorklet Chromagram & Cosine Chord Template Matching
- **Where in Code**: `apps/web/public/worklets/chroma-audio-processor.js`, `apps/web/src/lib/audio/worklet-loader.ts`, `apps/web/src/lib/audio/chord-detector.ts`
- **Why We Use It**: Real-time chord listening cannot run on the browser's main interface thread. If it did, the sheet music would stutter and drop frames whenever you strummed a chord.
- **How It Works**: An isolated same-origin Web Audio worker thread (`AudioWorklet` served from `/worklets/chroma-audio-processor.js`, avoiding unsafe `blob:` URLs) captures audio frames and feeds a 12-element chromagram energy profile (C through B). This profile is compared against 84 mathematical chord templates (7 chord qualities across 12 chromatic roots) using cosine similarity, identifying the chord in real time without blocking UI rendering.
- **Citations**:
  - Fujishima, T. (1999). *Realtime chord recognition of musical sound: a system using Common Lisp Music*. ICMC 1999, 464–467.
  - Müller, M. (2015). *Fundamentals of Music Processing: Audio, Analysis, Algorithms, Applications*. Springer.

---

### Group B: Deterministic Acoustic Synthesis

#### 3. Karplus-Strong Plucked String Physical Modeling
- **Where in Code**: `apps/web/src/lib/audio/practice-audio-engine.ts`, `apps/web/src/lib/audio/metronome.ts`
- **Why We Use It**: Playing pre-recorded MP3 samples of guitar strings takes up memory and sounds stiff and repetitive. Physical modeling simulates the actual physics of a string vibrating, giving an organic sound that uses almost zero memory.
- **How It Works**: We generate a tiny burst of random noise (simulating a guitar pick striking a string) and feed it into a circular feedback loop. Every time the sound loops around, we average adjacent audio samples together. That simple averaging act acts as a low-pass filter: high, tinny frequencies die off quickly, while the warm fundamental note rings out, naturally recreating the decay of steel or nylon strings.
- **Citations**:
  - Karplus, K., & Strong, A. (1983). *Digital Synthesis of Plucked-String and Drum Timbres*. Computer Music Journal, 7(2), 43–55.
  - Jaffe, D. A., & Smith, J. O. (1983). *Extensions of the Karplus-Strong Plucked-String Algorithm*. Computer Music Journal, 7(2), 56–69.

#### 4. Inharmonic Multi-Partial Piano Synthesis
- **Where in Code**: `apps/web/src/lib/audio/practice-audio-engine.ts`
- **Why We Use It**: Real piano strings are thick steel wire. Because of their physical stiffness, their harmonic overtones are slightly sharp compared to textbook mathematical multiples. Synthesizing textbook sine waves sounds like a cheap electronic organ rather than an acoustic piano.
- **How It Works**: We use Fletcher's stiff-string equation to intentionally bend each harmonic overtone slightly sharp:
  $$f_k = k \cdot f_0 \cdot \sqrt{1 + B \cdot k^2}$$
  We combine six individual harmonics, each with its own physical decay speed, producing the authentic acoustic bloom and bell-like ring of an acoustic upright piano.
- **Citations**:
  - Fletcher, H., Blackham, E. D., & Stratton, R. (1962). *Quality of Piano Tones*. The Journal of the Acoustical Society of America, 34(6), 749–761.

#### 5. Dual-Cavity Wooden Metronome Acoustic Simulation
- **Where in Code**: `apps/web/src/lib/audio/metronome.ts`
- **Why We Use It**: High-pitched digital beeps give you ear fatigue during long practice sessions and clash with the sound of your instrument.
- **How It Works**: We simulate a mechanical hardwood metronome block. The downbeat of every measure triggers an 1150 Hz resonant click with a steep decay envelope, while off-beats excite a deeper 850 Hz hollow wood cavity sound.
- **Citations**:
  - Cremer, L. (1984). *The Physics of the Violin*. MIT Press (Acoustic cavity resonance principles).

---

### Group C: Backend Audio Transcription & Alignment

#### 6. Spotify Basic Pitch Neural Polyphonic Transcription
- **Where in Code**: `src/lib/audio/transcription.py`
- **Why We Use It**: When you play a guitar arpeggio or piano chord, multiple strings ring simultaneously. Monophonic note trackers get confused and drop notes.
- **How It Works**: We run Spotify's lightweight `nmp.onnx` convolutional neural network in an isolated background threadpool. It analyzes the spectrogram across all 88 piano keys and outputs clean, discrete note events with their exact start times, end times, and velocities. We pre-warm the model when the server boots up, so your first practice take evaluates instantly with zero lag.
- **Citations**:
  - Bittner, R. M., Bosch, J. J., Rubinstein, D., Meseguer-Brocal, G., & Ewert, S. (2022). *A Lightweight Instrument-Agnostic Model for Polyphonic Note Transcription and Multipitch Estimation*. ICASSP 2022, 7842–7846.

#### 7. Hann STFT Harmonic Peak Tracking Fallback
- **Where in Code**: `src/lib/audio/transcription.py`
- **Why We Use It**: If the neural network engine fails to initialize (or when running on constrained devices), the system must never crash.
- **How It Works**: If the ONNX model is unavailable, Sonus gracefully falls back to a deterministic Short-Time Fourier Transform using smooth Hann windows to isolate prominent harmonic peaks and transcribe the performance.
- **Citations**:
  - Smith, J. O. (2011). *Spectral Audio Signal Processing*. W3K Publishing.
  - Harris, F. J. (1978). *On the use of windows for harmonic analysis with the discrete Fourier transform*. Proceedings of the IEEE, 66(1), 51–83.

#### 8. Two-Pass Strum & Arpeggio Temporal Window Clustering
- **Where in Code**: `src/lib/audio/voicing.py`
- **Why We Use It**: A guitarist never plucks all strings at the exact same millisecond. A downward strum takes about 150 milliseconds to sweep across the strings, and an arpeggio can take 400 milliseconds. Treating each individual string hit as a separate chord would be musical nonsense.
- **How It Works**: We use a two-pass grouping system:
  - **Pass 1 (Strum Window)**: Collects notes struck within 180 milliseconds into a single strummed chord.
  - **Pass 2 (Arpeggio Window)**: If notes continue within 400 milliseconds without hitting a new low bass note (a drop of 6+ semitones), they are bundled into the same chord voicing.

#### 9. F1 Pitch-Class Chord Identification
- **Where in Code**: `src/lib/audio/voicing.py`, `src/lib/music/chords.py`
- **Why We Use It**: Microphone recordings always pick up slight fret buzz or sympathetic string hum. Exact string matching fails whenever there is background room noise.
- **How It Works**: We calculate harmonic precision, recall, and $F_1$ score across nine canonical chord types (major, minor, 7, maj7, min7, dim, aug, sus2, sus4) across all twelve chromatic keys:
  $$F_1 = \frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
  The candidate chord template that produces the highest $F_1$ score above 0.60 is identified as the played chord.

#### 10. Voicing Set Diagnostics & Harmonic Role Weighting
- **Where in Code**: `src/lib/audio/voicing.py`
- **Why We Use It**: Leaving out the 5th of a chord (like omitting G in a C major chord) is completely normal in guitar playing. But leaving out the 3rd (E in a C chord) destroys the entire emotion of the chord because you can no longer tell if it is major or minor. Feedback must reflect how music actually works.
- **How It Works**: We apply weighted severity penalties depending on which note was missed:
  - Missing Root: Severity 5.0 (complete failure of chord foundation)
  - Missing 3rd: Severity 4.0 (major vs. minor tonality lost)
  - Missing 7th: Severity 3.0 (essential jazz/color tone omitted)
  - Missing 5th: Severity 1.0 (benign omission; very common in fingerpicking)
  - Clashing non-chord notes: Severity 3.5 (harsh acoustic dissonance)

#### 11. Needleman-Wunsch Dynamic Programming Alignment with Sakoe-Chiba Band
- **Where in Code**: `src/lib/audio/alignment.py`
- **Why We Use It**: If a student hesitates, skips a chord, or accidentally strums twice, simple step-by-step comparison falls completely out of sync for the rest of the song.
- **How It Works**: We adapt the Needleman-Wunsch global sequence alignment algorithm from bioinformatics. To keep it lightning fast, we constrain the search space to a **Sakoe-Chiba band** around the expected tempo. It computes an optimal alignment matrix that pairs what you actually played with what the sheet music expected, pinpointing exactly where you rushed, dragged, hesitated, or missed a change.
- **Citations**:
  - Needleman, S. B., & Wunsch, C. D. (1970). *A general method applicable to the search for similarities in the amino acid sequence of two proteins*. Journal of Molecular Biology, 48(3), 443–453.
  - Sakoe, H., & Chiba, S. (1978). *Dynamic programming algorithm optimization for spoken word recognition*. IEEE Transactions on Acoustics, Speech, and Signal Processing, 26(1), 43–49.

---

### Group D: Cognitive Modeling & Motor Habit Detection

#### 12. Exponentially Weighted Moving Average (EWMA) Habit Tracking
- **Where in Code**: `src/lib/practice/persistence.py`, `src/lib/adaptive/patterns.py`
- **Why We Use It**: Making a mistake once is just an accident. A habit is a pattern your hands repeat over and over without you noticing.
- **How It Works**: We maintain an exponentially smoothed baseline of your timing errors ($\Delta t$ in milliseconds) for every specific chord transition (like going from G to Em). Longitudinal transition persistence smooths with $\alpha = 0.30$:
  $$\bar{\mu}_t = 0.30 \cdot \Delta t_t + 0.70 \cdot \bar{\mu}_{t-1}$$
  Windowed session habit analysis uses $\alpha = 0.35$ (`compute_ewma`), distinguishing chronic rushing from chronic hesitation without letting a single outlier dominate history.
- **Citations**:
  - Lucas, J. M., & Saccucci, M. S. (1990). *Exponentially weighted moving average control schemes: properties and enhancements*. Technometrics, 32(1), 1–12.
  - Hunter, J. S. (1986). *The Exponentially Weighted Moving Average*. Journal of Quality Technology, 18(4), 203–210.

#### 13. Page's Two-Sided CUSUM Change-Point Detector
- **Where in Code**: `src/lib/adaptive/patterns.py`
- **Why We Use It**: Learning an instrument is not a smooth, straight line. You struggle with a chord change for a week, and then suddenly something clicks in your hand. We need a mathematical way to know when that breakthrough actually occurred.
- **How It Works**: We maintain running cumulative sums ($S^+$ and $S^-$) that accumulate small deviations from your baseline. When the cumulative sum crosses a statistical threshold ($h = 4.0\sigma$), Sonus registers a verified change-point — confirming that your motor skill has fundamentally shifted, marking a true breakthrough or a sudden regression.
- **Citations**:
  - Page, E. S. (1954). *Continuous Inspection Schemes*. Biometrika, 41(1/2), 100–115.
  - Basseville, M., & Nikiforov, I. V. (1993). *Detection of Abrupt Changes: Theory and Application*. Prentice Hall.

#### 14. Bayesian Knowledge Tracing (BKT) 2-State Hidden Markov Model
- **Where in Code**: `src/lib/adaptive/knowledge_tracing.py`
- **Why We Use It**: True physical mastery is invisible. Even experienced players occasionally slip, and beginners sometimes land a difficult chord by sheer luck.
- **How It Works**: We model skill mastery as an underlying state with four realistic probabilities:
  - Prior Mastery $P(L_0) = 0.20$
  - Learning Rate $P(T) = 0.15$
  - Lucky Guess / Fluke $P(G) = 0.12$
  - Accidental Slip $P(S) = 0.08$
  
  Whenever you complete a take, Bayes' rule calculates the updated probability that your hands have genuinely mastered that specific transition.
- **Citations**:
  - Corbett, A. T., & Anderson, J. R. (1995). *Knowledge tracing: Modeling the acquisition of procedural knowledge*. User Modeling and User-Adapted Interaction, 4(4), 253–278.
  - Baker, R. S., Corbett, A. T., & Aleven, V. (2008). *More accurate student modeling through contextual estimation of slip and guess probabilities*. ITS 2008.

#### 15. SuperMemo SM-2 Spaced Repetition for Motor Retention
- **Where in Code**: `src/lib/adaptive/spaced_repetition.py`
- **Why We Use It**: Muscle memory decays over time if you don't reinforce it. Practicing transitions you already mastered yesterday wastes practice time; waiting a month until your fingers forget entirely is demoralizing.
- **How It Works**: We adapt Dr. Piotr Wozniak's classic spaced repetition algorithm for musical motor memory. We translate your timing precision and voicing accuracy into a musical performance grade from 0 to 5, which dynamically adjusts the easiness factor ($EF$) and schedules the ideal day for you to review that specific transition before your fingers forget it.
- **Citations**:
  - Wozniak, P. A. (1990). *Optimization of learning*. Master's Thesis, University of Technology in Poznan.
  - Pavlik, P. I., & Anderson, J. R. (2005). *Practice and forgetting effects on vocabulary acquisition*. Cognitive Science, 29(4), 559–586.

#### 16. Multi-Armed Bandit Curriculum Scheduler (Thompson Sampling & UCB1)
- **Where in Code**: `src/lib/adaptive/bandit.py`
- **Why We Use It**: If a practice app only gives you drills you are bad at, practicing feels like a chore and you burn out. If it only gives you songs you already know, you never get better.
- **How It Works**: We treat available exercises as arms in a multi-armed bandit. Using Thompson Sampling with Beta distributions, the system balances two needs: picking drills that target your weakest chord transitions while occasionally picking pieces you enjoy and play well, keeping practice challenging without being discouraging.
- **Citations**:
  - Thompson, W. R. (1933). *On the likelihood that one unknown probability exceeds another in view of the evidence of two samples*. Biometrika, 25(3/4), 285–294.
  - Auer, P., Cesa-Bianchi, N., & Fischer, P. (2002). *Finite-time analysis of the multiarmed bandit problem*. Machine Learning, 47(2), 235–256.

---

### Group E: Notation Engraving & Grounded Coaching

#### 17. Bravura SMuFL Engraving & Monotonic Beat-to-X Mapping
- **Where in Code**: `apps/web/src/lib/notation/vexflow-score-builder.ts`, `apps/web/src/components/practice/flowing-notation-stand.tsx`
- **Why We Use It**: Traditional sheet music renderers wrap staves abruptly across lines, breaking your visual concentration while playing.
- **How It Works**: We use VexFlow v5 configured with standard W3C Bravura musical glyphs to engrave a continuous, linear score. We pre-calculate a mathematical mapping between musical beats and horizontal pixel positions. A 60fps GPU-accelerated render loop glides the score smoothly beneath the amber playhead without stuttering.
- **Citations**:
  - W3C Music Notation Community Group. (2021). *Standard Music Font Layout (SMuFL) Specification 1.4*.

#### 18. Strictly Grounded AI Pedagogical Coaching & Honest Cohort Benchmarks
- **Where in Code**: `src/lib/adaptive/llm_coach.py`, `src/lib/adaptive/reports.py`, `src/lib/community/benchmarks.py`
- **Why We Use It**: Standard language models hallucinate musical critiques when asked about raw audio, and small practice cohorts should never misrepresent sparse data as global norms.
- **How It Works**: The language model (`gemini-2.5-flash` by default, configurable via `GEMINI_MODEL`) is strictly bounded: it never inspects raw audio or invents notes. Instead, it receives an immutable JSON fact bundle containing verified millisecond timing deltas, missed chord tones, and detected habits, falling back seamlessly to a deterministic pedagogical rules engine when `GEMINI_API_KEY` is omitted or times out. Similarly, **Peer Benchmarks** compute empirical quartiles/top-10% thresholds directly from PostgreSQL once at least 10 completed practice sessions exist in the cohort, and transparently display a clearly labeled *Simulated Reference Baseline* whenever live cohort data falls below that threshold.

---

## 🗄️ Relational Database Schema

Sonus stores user progress in PostgreSQL using SQLModel:

- **`users`**: User identity tied to Clerk authentication (`id: VARCHAR(255)`).
- **`exercises`**: Catalog of repertoire songs and isolated practice drills with measure, beat, and chord definitions.
- **`practice_sessions`**: High-level history for every practice take (tempo, overall score, duration).
- **`session_chord_metrics`**: Detailed millisecond-level telemetry for every individual chord played during a take.
- **`transition_mastery`**: Persistent BKT probability and SM-2 spaced repetition state for every directed chord pair.
- **`habit_patterns`**: Verified motor habits detected through EWMA and CUSUM change-point analysis.

---

## 🛠️ Technology Stack

| Layer | Tools | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite 8, Tailwind CSS v4 | Responsive practice cockpit, dual-theme styling, interactive fretboards, and piano keyboard. |
| **Score Engraving** | VexFlow v5, W3C SMuFL Bravura, Academico | Vector Grand Staff and Guitar TAB rendering with monotonic horizontal playhead tracking. |
| **Browser DSP** | Web Audio API, AudioWorklet, Pearson Autocorrelation | Real-time pitch tracking, chroma calculation, tuner needle, and physical string modeling. |
| **Backend API** | FastAPI, Python 3.12, Uvicorn, Pydantic v2 | Thin async REST endpoints, RFC 9457 error details, and Clerk session token verification. |
| **Polyphonic ML** | Spotify Basic Pitch, ONNX Runtime | Multi-note audio transcription running in background threadpools (`anyio.to_thread`). |
| **Database** | PostgreSQL 16, SQLModel, Alembic, Asyncpg | Relational storage with connection pooling (`QueuePool`, persistent connection reuse). |
| **Observability** | Sentry, X-Request-ID tracing | End-to-end distributed tracing across client errors and server execution. |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: `v20+` or `v22+` with `pnpm`
- **Python**: `>=3.12, <3.13` with virtual environment
- **PostgreSQL**: Local database, Supabase, or Neon serverless

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/adaptive-music-practice.git
cd adaptive-music-practice

# Install frontend dependencies
pnpm install

# Set up Python virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python packages
uv venv
uv pip install -r pyproject.toml
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key settings:
```ini
ENV=development
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/sonus
CLERK_SECRET_KEY=your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Optional: Grounded coaching (deterministic fallback runs automatically if omitted)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Migrations & Start Servers
```bash
# Run database migrations
pnpm run db:upgrade

# Start both FastAPI (:8000) and Vite (:5173) concurrently
pnpm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

Sonus includes unit, integration, type, lint, and end-to-end verification suites across both the frontend Web Audio engine and the backend machine learning pipeline:

```bash
# Run frontend Vitest suites
pnpm --prefix apps/web test -- --run

# Run landing scroll choreography tests (Node native TS runner)
node --experimental-strip-types --test apps/web/src/components/landing/scroll-choreography.test.ts

# Lint frontend
pnpm --filter web lint

# Run frontend production build
pnpm --prefix apps/web build

# Run backend lint, strict typecheck & pytest suite
ruff check src/
mypy src/ tests/
pytest tests/ -v
```

---

## 🔒 Privacy & Architecture Principles

1. **Zero Permanent Audio Retention**: Microphone recordings are processed strictly in-memory or in ephemeral temporary buffers. As soon as notes are extracted and aligned, the temporary WAV file is deleted immediately in a `finally` block. Audio is never stored or sent to 3rd-party cloud buckets.
2. **Deterministic Fact Grounding**: Language models never evaluate raw audio. They receive pre-computed, deterministic metrics and generate natural language summaries. If the network drops or API keys are omitted, a deterministic rules engine handles coaching without interruption.
3. **Dual-Stack Cloud Resilience**: On Windows or hybrid network environments, cloud database hosts (e.g. Neon, Supabase) resolve via cached IPv4 routing to prevent 15-30 second socket timeouts (`[WinError 121]`).
4. **Non-Blocking Inference**: All machine learning inference (`basic-pitch` ONNX, STFT, alignment) runs inside worker threadpools (`anyio.to_thread.run_sync`), keeping the FastAPI server responsive.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
