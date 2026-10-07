# Design System Analysis & Visual Specifications: "Living Manuscript"

**Explorer 1 — Design System Explorer Report**  
**Date:** 2026-10-06  
**Target Project:** PRISM — Adaptive Musical Practice System  
**Working Directory:** `.agents/teamwork/explorer_survey_1/`

---

## 1. Executive Summary & Design Vision

PRISM is not a sterile music analytics dashboard or a standard SaaS utility. It is an **interactive, experimental musical instrument masquerading as sheet music**. The design philosophy is termed **"The Living Manuscript"**: an immersive digital parchment stand that feels like an ancient, illuminated musical treatise brought to life with dynamic reactive ink, high-contrast typography, and celestial geometry.

Rather than relying on modern SaaS conventions—drop shadows, rounded pill buttons, floating glassmorphism cards, and standard toolbars—PRISM draws inspiration from:
- Historical musical treatises (e.g., J.S. Bach's handwritten manuscripts, Guido d'Arezzo's hexachord charts).
- Astronomical and navigational folio charts (Johannes Kepler's *Harmonices Mundi*, medieval astrolabes).
- Organic materials: hand-pressed parchment paper (`#F4F1EA`), iron gall and charcoal ink (`#2C2A29`), and rubricated crimson ink accents (`#9A2A2A`).

The system replaces traditional multi-page routing with a **2D Spatial Canvas** where the musician navigates between three core coordinates:
- **Center `(0, 0)`**: **The Practice Stand** (Live Pitch Ribbon & Tuning Ritual)
- **Up `(0, -100vh)`**: **The Composer's Bio Profile** (Folio frontispiece & practice traits)
- **Left `(-100vw, 0)`**: **The Constellation History** (Celestial scatter plot of practice takes)

Unauthenticated visitors are greeted by a **Living Manuscript Landing Page** featuring an organic ink bleed animation, historical illumination, and seamlessly themed Clerk authentication.

---

## 2. Living Manuscript Design System Foundation

### 2.1 Theme & Color Palette

The color system is stark, high-contrast, and strictly organic. Every token represents a physical element of classical bookbinding, ink chemistry, and parchment preparation:

| Token Name | Hex Code | Semantic Role | Material Metaphor |
|---|---|---|---|
| `--color-parchment` / `--background` | `#F4F1EA` | Primary Canvas Background | Heavy, unbleached calfskin parchment |
| `--color-parchment-secondary` | `#E9E4DA` | Recessed areas, input fields, subtle card backings | Aged vellum paper, margin tint |
| `--color-charcoal` / `--foreground` | `#2C2A29` | Primary text, structural staff lines, sharp borders | Deep iron gall / lampblack charcoal ink |
| `--color-crimson` / `--accent` | `#9A2A2A` | Active states, pitch errors, wax seals, resonance | Rubricated vermilion / cochineal red ink |
| `--color-muted-ink` | `#7E7570` | Secondary labels, measure numbers, ghost lines | Faint graphite pencil / diluted ink wash |
| `--color-gold-leaf` (Accent) | `#C8A858` | Celestial nodes, perfect takes, illuminated drop-caps | Beaten gold leaf illumination |

#### Critical Token Rules:
1. **Zero Border Radius (`--radius: 0`):** Sharp, guillotine-trimmed paper edges. No rounded pill buttons (`rounded-full`) or generic SaaS card radiuses (`rounded-xl`).
2. **Stark Contrast & Thin Rules:** Borders are crisp 1px or 2px charcoal lines (`border-[#2C2A29]`), reminiscent of copperplate engraving.
3. **No Drop Shadows:** Elevation is communicated through architectural double borders (`border-double` or concentric 1px lines), recessed tones (`#E9E4DA`), or ink wash overlays.

---

### 2.2 Typography Hierarchy

Typography is an intentional **editorial juxtaposition** of classical Renaissance book printing and laser-sharp modern notation telemetry:

| Type Role | Font Family | Weights | Stylistic Rules & Application |
|---|---|---|---|
| **Display & Titles** | `Playfair Display` (or `Instrument Serif`) | 700 Bold, 600 SemiBold | High stroke contrast, elegant serifs, classical tracking (`tracking-tight` on massive display, `tracking-wide` on small caps). Used for screen titles, piece names, and composer monograms. |
| **Musical Directives** | `Playfair Display` (Italic) | 400 Italic | Expressive Italian tempo and character markings: *Adagio sostenuto e con sentimento*, *Allegro maestoso*, *Sotto voce*. |
| **Technical Telemetry** | `Geist Mono` | 400 Regular, 500 Medium | Sharp monospace metrics: BPM, Cents deviation (`+12 cents`), Frequency (`440.0 Hz`), latency (`12ms`), timestamps (`ANNO MMXXVI // 20:45`), status codes. |
| **Editorial & UI Body** | `Playfair Display` / `Inter` | 400 Regular | Clean, legible body text. When `Inter` is used for dense UI, it must be understated, low contrast, and unpretentious to avoid breaking the historical illusion. |
| **Illuminated Drop-Caps** | `Playfair Display` | 700 Bold, Initial | 3-line tall initial capitals with decorative flourish borders for section beginnings. |

---

### 2.3 Structural Grid: The Five-Line Musical Staff

The visual grid is anchored by the **Five-Line Staff Grid (`.staff-bg`)**:
```css
.staff-bg {
  background-image: repeating-linear-gradient(
    transparent,
    transparent 19px,
    var(--border) 20px
  );
  background-size: 100% 100px; /* 5 lines per stave unit */
}
```
- Structural elements align to staff line intervals (20px rhythm).
- Horizontal section dividers mimic musical barlines:
  - Single thin line (`1px solid #2C2A29`): Regular measure divider.
  - Double barline (`border-y-2 border-double` or two parallel 1px lines separated by 3px): Section boundary or movement end.
  - Final double barline (one thin line + one thick 3px bar): Screen bounds.

---

### 2.4 Musical Glyphs & Iconography (SMuFL / Unicode)

Generic SaaS iconography (hamburgers, cogs, chevron arrows, modern search icons) is strictly replaced with **musical symbols**:

| Action / Feature | Musical Glyph | Unicode / Entity | Meaning in Living Manuscript |
|---|---|---|---|
| **Play / Commence** | Right-pointing triangle / Note head | `▶` or `𝅘` (`&#119128;`) | Set piece in motion |
| **Pause / Hold** | Fermata | `𝄐` (`&#119058;` / `U+1D112`) | Sacred pause / sustained observation |
| **Stop / End Take** | Solid Quadrate | `■` (`&#9632;`) | Conclude take |
| **Profile / Identity** | Treble Clef (G-Clef) | `𝄞` (`&#119070;` / `U+1D11E`) | Performer voice / upper register / persona |
| **History / Archives** | Bass Clef (F-Clef) | `𝄢` (`&#119074;` / `U+1D122`) | Foundation memory / deep temporal ledger |
| **Navigation / Loop** | Coda | `𝄩` (`&#119137;` / `U+1D169`) | Leap to target coordinate / loop |
| **Calibration / Setup** | Alto Clef (C-Clef) | `𝄡` (`&#119072;` / `U+1D121`) | Centering of the middle register / tuning |
| **In Tune / Resolution** | Natural Symbol | `♮` (`&#9838;` / `U+266E`) | Pure pitch / centered state |
| **Sharp Deviation** | Sharp Symbol | `♯` (`&#9839;` / `U+266F`) | Pitch drifting high (+ cents) |
| **Flat Deviation** | Flat Symbol | `♭` (`&#9837;` / `U+266D`) | Pitch drifting low (- cents) |
| **Take Star Node** | Staccato Dot / Star | `✧` / `·` (`U+2727`) | Singular practice occurrence |

---

### 2.5 Ink Bleed & Reactive Particle Mechanics

The "Living" aspect of the manuscript comes from dynamic ink behavior:
1. **SVG Ink Bleed Filter (`#ink-bleed`):**
   Using SVG displacement and turbulence to deform clean geometry into organic, fiber-absorbed ink edges:
   ```html
   <svg className="hidden">
     <defs>
       <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
         <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" result="noise" />
         <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
         <feGaussianBlur stdDeviation="0.6" result="bleed" />
         <feMerge>
           <feMergeNode in="bleed" />
           <feMergeNode in="SourceGraphic" />
         </feMerge>
       </filter>
     </defs>
   </svg>
   ```
2. **Ink Splatters & Charcoal Dust:**
   When notes strike resonance (within ±3 cents) or when errors occur, reactive micro-particles emit from the playback head:
   - Resonant Notes: Soft charcoal dust halos drifting outward.
   - Significant Errors (>15 cents drift): Crimson ink micro-splatters (`#9A2A2A`) with `mix-blend-mode: multiply`.
3. **Editor's Marks:**
   Historical editorial notations:
   - Circled notes in red ink for flat pitches.
   - Angled slashed measure lines for rushed tempo.
   - Delicate fermatas over hesitant pauses.

---

## 3. Screen 1: Landing Page Visual & Interactive Specification

### 3.1 Atmosphere & Hero Architecture
The Landing Page serves as the **frontispiece and solemn gateway** to PRISM.
- **Background:** Full viewport parchment (`#F4F1EA`) with faint paper grain and edge aging. A double charcoal border frames the screen with 24px inset margins.
- **Top Marginalia:**
  - Left: Latin motto in small-caps serif: *AUDIRE · DISCERE · EXERCERE* (Listen · Learn · Practise with purpose).
  - Right: Technical status in Geist Mono: `REV. MMXXVI // ACOUSTIC INTELLIGENCE ENGINE // STANDBY`.
- **Centerpiece (The Ink Bleed Bloom):**
  - An interactive calligraphy ink bloom that spreads outward upon page load using CSS/SVG mask or canvas simulation.
  - Embedded within the bloom is the primary title:
    - **`PRISM`** (72px–96px, Playfair Display, tracking-tight, `#2C2A29`).
    - Subtitle: *"Opus Manuscriptum"* (24px, Playfair Display Italic, `#7E7570`).
    - Proposition: *"A living musical score that listens to your monophonic playing, detects recurring pitch and timing habits across time, and turns weaknesses into focused mastery."*
- **Call-to-Action & Clerk Authentication Integration:**
  - Rather than standard floating modal boxes, authentication is presented as an **Illuminated Folio Ledger**:
  - The Clerk `<SignIn />` component is directly integrated into the landing canvas with bespoke CSS theming:
    - Background: `#F4F1EA` (transparent blend into parchment).
    - Card: Framed in a 1px solid charcoal border with corner musical flourishes.
    - Text: Playfair Display for headings ("Identify Thyself", "Enter the Sanctuary"), Geist Mono for field inputs and verification codes.
    - Buttons: Deep charcoal solid with parchment text, transitioning to crimson ink (`#9A2A2A`) on hover.
    - Zero rounded corners across all Clerk inputs and buttons.
- **Bottom Canvas Footer:**
  - 5-line structural staff spanning the bottom edge with decorative clef mark.
  - Three illuminated feature scrolls:
    1. *The Attentive Ear:* Web Audio low-latency pitch detection via YIN/DTW.
    2. *The Celestial Memory:* Longitudinal pattern tracking across tempo thresholds.
    3. *The Adaptive Pen:* Targeted interventions isolated to precise measure transitions.

---

### 3.2 Stitch MCP Prompt: Landing Page
```text
Screen: PRISM Living Manuscript Landing Page
Device: Desktop (1440x900)
Aesthetic: "The Living Manuscript" historical sheet music and illuminated treatise aesthetic.
Colors: Background #F4F1EA (parchment paper), lines and text #2C2A29 (deep charcoal ink), accents #9A2A2A (crimson red ink), secondary #E9E4DA.
Typography: Header in Playfair Display serif, technical labels in Geist Mono monospace. No generic SaaS cards or drop shadows; sharp zero-radius borders.
Layout:
- Framed by a delicate double-line charcoal border with classical corner flourishes.
- Top marginalia showing Latin motto "AUDIRE · DISCERE · EXERCERE" and system status in monospace.
- Hero center: Dramatic calligraphic ink bleed ring with title "PRISM" in 80px Playfair Display, subtitle "Opus Manuscriptum: Adaptive Musical Practice System".
- Integrated authentication folio box: An illuminated parchment card containing Clerk sign-in fields (Email, Passkey/Password, and "Enter Sanctuary" action button in #2C2A29 with #F4F1EA text).
- Bottom: 5-line musical staff bar with 3 columns describing features ("The Attentive Ear", "The Celestial Memory", "The Adaptive Pen") styled like vintage musical annotations.
```

---

## 4. Screen 2: Setup / Tuning Ritual Visual & Interactive Specification

### 4.1 Atmosphere & Ritual Philosophy
Tuning is not treated as a boring hardware options dialog. It is a **Centering Pre-Flight Ritual**—the calm moment of focused silence before a musician sounds their first note.

### 4.2 The Sacred Tuning Circle ("The Harmonic Astrolabe")
The visual centerpiece is a circular dial inspired by Renaissance astronomical quadrants and the Pythagorean monochord:
- **Outer Astrolabe Ring (Radius ~160px):**
  - Precision circular degree ticks drawn in `#2C2A29`.
  - Frequency markings: `415 Hz` (Baroque), `440 Hz` (Modern Standard), `442 Hz` (European Symphonic) with active toggle indicator.
- **Dynamic Tuning Needle & Pitch Dial:**
  - Centered pivot point with a fine charcoal needle that dynamically tracks pitch deviation:
    - Far Left (-50 cents): Flat (`♭` marker).
    - Center (0 cents): True Harmonic Purity (`♮` natural marker).
    - Far Right (+50 cents): Sharp (`♯` marker).
- **The Resonance State (True In-Tune State):**
  - When the detected pitch enters the tolerance threshold (within ±3 cents of center):
    - The needle aligns with the vertical axis.
    - A circular crimson ink ring (`#9A2A2A`) blooms around the circumference.
    - Delicate ink particles / charcoal dust emanate from the circle.
    - Large note display inside the circle: e.g. **`A4`** (64px, Playfair Display) with `440.2 Hz · 0 cents` in Geist Mono.

### 4.3 Input Auto-Detection & Sensitivity Gauge
- **Dual Hardware Toggle:**
  - **Acoustic Microphone:** Marked with an illuminated Lyre / Ear glyph (`𝄞`). Displays status: `MIC DETECTED: Built-in Audio Input (48.0 kHz, 12ms buffer)`. Includes a live acoustic ink-ripple meter that vibrates when ambient sound is heard.
  - **Digital MIDI Interface:** Marked with an illuminated Organ / Cable glyph (`𝄡`). Displays status: `MIDI: Listening on WebMIDI ports (0 devices attached)`.
- **Target Instrument Selection:**
  - Classical parchment selector with monophonic instruments:
    - *Violin / Viola / Cello / Flute / Oboe / Clarinet / Voice*.
    - Displays the playable register on an illuminated 5-line staff preview (e.g., G3–E7 for Violin).
- **Seal & Proceed Action:**
  - A crimson wax seal button (`#9A2A2A` circular button with stamped G-clef icon) labeled:
    **"Seal Tuning & Mount the Stand"** (`Enter Practice Stand`).

---

### 4.4 Stitch MCP Prompt: Setup / Tuning Ritual
```text
Screen: PRISM Device Setup and Sacred Tuning Ritual
Device: Desktop (1440x900)
Aesthetic: "The Living Manuscript" medieval astrolabe and musical calibration stand.
Colors: Parchment background #F4F1EA, deep charcoal #2C2A29, crimson ink accents #9A2A2A.
Typography: Playfair Display for labels, Geist Mono for frequency and pitch deviation numbers. Sharp 0px corners, no drop shadows.
Layout:
- Centerpiece: A large Sacred Tuning Circle / Astrolabe Dial (diameter 320px). Concentric charcoal rings with fine measurement marks. In the center, a large detected note "A4" in 64px Playfair Display, and a delicate needle indicating cents deviation (-50 to +50 cents). A glowing crimson ring highlights resonance when centered.
- Above dial: Italian movement instruction: "Accordatura: Moderato e tranquillo".
- Left panel: Input Device Auto-Detection box showing "Microphone (Acoustic Monophonic)" selected with real-time waveform ripple in charcoal ink, and "MIDI Interface" standby option.
- Right panel: Calibration controls: Pitch Standard selection (415 Hz Baroque, 440 Hz Standard, 442 Hz European), Instrument selector (Violin, Voice, Flute) showing the instrument's staff register.
- Bottom: Large ceremonial action button: "Seal Tuning & Mount Stand" with crimson wax stamp icon.
```

---

## 5. Screen 3: Constellation History Visual & Interactive Specification

### 5.1 The Celestial Star Map Metaphor
Practice history in PRISM is not represented by boring corporate bar charts or database tables. It is structured as **The Constellation of Practice**: a celestial sky chart on parchment where every practice take is a star, and recurring patterns form connected constellations.

### 5.2 Scatter Plot Coordinates & Visual Encoding
- **Canvas Space:**
  - Parchment background with faint astronomical coordinate grid lines (concentric circular declination rings and radial hour angles, or 5-line celestial staves).
- **Coordinate Dimensions:**
  - **X-Axis (Horizontal):** **Tempo / Velocity** (from 60 BPM to 140+ BPM).
  - **Y-Axis (Vertical):** **Intonation Accuracy / Pitch Stability** (from 60% up to 100% Purity).
  - **Star Node Size:** Corresponds to take duration / note count (e.g., 16-bar excerpt vs full movement take).
  - **Star Node Visual Hierarchy:**
    - *Pristine Takes (≥92% accuracy):* Solid charcoal stars (`✦`) with a faint radiating amber/gold aureole.
    - *Moderate Takes (80%–91% accuracy):* Delicate 4-point star glyphs (`✧`).
    - *Struggling Takes (<80% accuracy):* Rich crimson nebula stars (`#9A2A2A`) with subtle ink splatter aura, highlighting areas where pitch broke down under tempo pressure.
- **Constellation Filaments (Connecting Vectors):**
  - Takes belonging to the same repertoire piece (e.g., "J.S. Bach — Partita No. 2: Allemande") are joined by delicate, dashed charcoal constellation vectors.
  - The vector clearly illustrates the musician's **fatigue curve** or **tempo threshold**: for instance, accuracy remaining at 95% from 60 to 80 BPM, then precipitously dropping at 92 BPM.

### 5.3 Interactive Folio Tooltip (Illuminated Take Card)
Hovering or clicking on any star node opens a crisp, parchment-framed inspection folio:
- **Title:** *J.S. Bach — BWV 1004 (Allemande)*
- **Telemetry:**
  - Date & Time: `Anno MMXXVI · Oct 5, 19:42`
  - Tempo: `88 BPM` | Total Duration: `01:42`
  - Pitch Accuracy: `94.1%` | Mean Deviation: `-3.8 cents (Tending Flat)`
  - Timing Error: `±16 ms onset variance`
- **Editor's Crimson Annotation:**
  - *"Measure 14: F5–G5 transition slipped flat by 14 cents at 88 BPM. Recommendation: Isolate bars 12–16 at 76 BPM."*
- **Action Buttons:**
  - `Replay Take Audio` (Musical clef icon)
  - `Launch Isolated Intervention` (Crimson ink accent button)

### 5.4 Macro Telemetry Ledger (Header & Filter Dials)
- Top Telemetry Bar:
  `CONSTELLATION LEDGER // 48 TAKES RECORDED // TOTAL DISCIPLINE: 16.4 HRS // CRITICAL THRESHOLD: 86 BPM`
- Filter Dials: Filter stars by piece, register (Treble/Bass), or error type (Intonation vs Timing).

---

### 5.5 Stitch MCP Prompt: Constellation History
```text
Screen: PRISM Constellation History Scatter Plot
Device: Desktop (1440x900)
Aesthetic: "The Living Manuscript" celestial astronomy map and vintage star chart on parchment.
Colors: Parchment background #F4F1EA, charcoal ink #2C2A29 for grid and stars, crimson ink #9A2A2A for error stars and annotations.
Typography: Playfair Display for piece titles, Geist Mono for coordinate axes (BPM, Accuracy %, Timestamps). Sharp zero-radius boxes.
Layout:
- Canvas: Full-bleed celestial coordinate chart with subtle circular orbit lines and musical staff grid.
- X-Axis: Tempo in BPM (60 BPM to 140 BPM). Y-Axis: Pitch Accuracy (60% to 100%).
- Data Points: Celestial star glyphs (✦, ✧, and crimson dots #9A2A2A) plotted across the chart. Delicate connecting lines link takes of the same exercise into a constellation line.
- Active Selection: An illuminated manuscript folio card hovering beside a selected star node, detailing "J.S. Bach - BWV 1004 Allemande", Tempo: 88 BPM, Accuracy: 94.1%, with a crimson editor's note: "F5-G5 transition flat by 14 cents above 84 BPM".
- Top Header: Minimalist telemetry bar with Monospace stats: "CONSTELLATION: 48 TAKES // TEMPO THRESHOLD: 86 BPM" and filter controls with musical glyph icons.
```

---

## 6. Screen 4: Composer's Bio Profile Visual & Interactive Specification

### 6.1 Folio Frontispiece Architecture
The Composer's Bio Profile is designed as the **frontispiece of a 17th-century printed treatise** (such as Bach's *Clavier-Büchlein* or Praetorius' *Syntagma Musicum*):
- **Layout Structure:** Symmetrical two-column classical manuscript folio with a double-ruled charcoal border and corner fleurons.
- **Header Banner:**
  - Illuminated Drop-Cap or Ornate Monogram seal (diameter 80px) in deep charcoal and crimson.
  - Performer Name: **`Maestro Yash`** (or authenticated user name) in 40px Playfair Display.
  - Subtitle: *"Soloist in Residence · Violin & Voice"*
  - Registry: Clerk User ID & Authentication Seal in crisp Geist Mono (`ID: usr_2026_prism // KEY: VERIFIED`).

### 6.2 Left Column: "The Physiognomy of Practice" (Musician Analytics)
A structured breakdown of the musician's physical playing tendencies and strengths:
- **Discipline Ledger:**
  - Total Hours in Sanctuary: `48h 20m`
  - Total Notes Sounded: `32,490`
  - Consistency Streak: `14 Consecutive Days`
- **Intonation Profile:**
  - Overall Pitch Purity: `91.4%`
  - Dominant Intonation Habit: *"Tendency to ascend sharp (+5 cents) on leading tones; tends flat on sustained fourth finger in upper register."*
- **Temporal Stability:**
  - Onset Timing Precision: `±14 ms average deviation`
  - Rhythmic Habit: *"Rushes tempo by 4% immediately following long rests."*
- **Comfortable Velocity:**
  - Max Controlled Tempo: `112 BPM`
  - Breakdown Horizon: `120 BPM`

### 6.3 Right Column: "The Repertoire Ledger" (Studied Works)
An illuminated list of masterworks currently under study:
1. **J.S. Bach — Partita No. 2 in D minor (BWV 1004)**
   - Status: *In Active Discipline (78% Mastered)*
   - Focus: Chaconne arpeggiation and intonation purity.
2. **G.P. Telemann — 12 Fantasias for Solo Violin (No. 1 in B-flat)**
   - Status: *Conquered (96% Mastered)*
   - Focus: Velocity stability at 108 BPM.
3. **N. Paganini — 24 Caprices (Op. 1, No. 24)**
   - Status: *Experimental Sanctuary (64% Mastered)*
   - Focus: Rapid chromatic shifts and string crossings.

### 6.4 Footer & Account Sanctions
- Crimson wax stamp seal with authenticated status (`#9A2A2A`).
- Actions:
  - `Export Folio Ledger (JSON / MIDI Report)`
  - `Audio Hardware Configuration`
  - `Depart Sanctuary (Sign Out)`

---

### 6.5 Stitch MCP Prompt: Composer's Bio Profile
```text
Screen: PRISM Composer's Bio Profile Folio
Device: Desktop (1440x900)
Aesthetic: "The Living Manuscript" 17th-century printed music frontispiece and illuminated treatise.
Colors: Parchment background #F4F1EA, charcoal ink #2C2A29, rubricated crimson ink accents #9A2A2A.
Typography: Playfair Display for headings and titles, Geist Mono for stats and technical ledger values. Sharp 0px borders.
Layout:
- Framed by classical double-line charcoal border with corner musical flourishes.
- Top: Large illuminated musician seal/crest (circular woodcut with treble clef), performer name "Maestro Yash" in 40px Playfair Display, and title "Soloist in Residence - Violin".
- Two-column folio layout:
  - Left column ("The Physiognomy of Practice"): Technical discipline stats formatted in crisp monospace tables: Practice Time (48h 20m), Intonation Purity (91.4%), Velocity Threshold (112 BPM), and written analytical notes diagnosing player habits ("Tends sharp on ascending thirds; rushes after rests").
  - Right column ("Repertoire Ledger"): Elegant list of studied works (Bach Partita No. 2, Telemann Fantasia, Paganini Caprice) with progress percentages, current tempo milestones, and crimson wax status stamps ("Mastered", "In Discipline").
- Bottom: Action footer with "Export Practice Folio", "Hardware Settings", and "Depart Sanctuary" (Sign Out) button.
```

---

## 7. Spatial Single-Page Architecture (Framer Motion) Spatial Canvas Map

### 7.1 Coordinate System & Spatial Philosophy
Instead of traditional page unmounting and browser route pushes, the viewport is an **infinite digital music stand canvas**. The camera glides along a 2D Cartesian plane using Framer Motion springs:

```text
               [UP: (0, -100vh)]
         COMPOSER'S BIO PROFILE FOLIO
                      ▲
                      │  (Pan Up)
                      │
  [LEFT: (-100vw, 0)] │         [CENTER: (0, 0)]
CONSTELLATION HISTORY ┼───────► LIVE PRACTICE STAND
  (Celestial Map)    │ (Pan Left) (Staff & Ribbon)
                      │
                      ▼
            [MODAL OVERLAY / ANTECHAMBER]
             SETUP / TUNING RITUAL
```

### 7.2 Navigation Dynamics & Keyframes
- **Center `(0, 0)`: Live Practice Stand:**
  - The default hub. Houses the live pitch ribbon, staff lines, transport controls, and tempo telemetry.
- **Left `(-100vw, 0)`: Constellation History:**
  - Viewport translates `x: -100vw`. Panning feels like turning back the leaves of an ancient astronomical journal.
- **Up `(0, -100vh)`: Composer's Bio Profile:**
  - Viewport translates `y: -100vh`. Panning feels like lifting the music stand to inspect the frontispiece and player dossier.
- **Transition Physics:**
  - Spring physics: `mass: 1, stiffness: 120, damping: 20` (a heavy, luxurious glide like sliding heavy manuscript parchment on a wooden desk).
  - No jarring cuts or blank white flashes.

### 7.3 Subtle On-Canvas Navigation Glyphs
To preserve the immersive stand feel without ugly top navbars:
- **Top Edge Center:** Subtle Treble Clef glyph `𝄞` with upward hairline arrow: "Profile Folio".
- **Left Edge Center:** Subtle Bass Clef / Coda glyph `𝄢` with leftward hairline arrow: "Constellation History".
- **Return to Center:** Clicking the Natural symbol `♮` or pressing `Escape` / `Space` smoothly returns the camera to `(0, 0)`.

---

## 8. Implementation Guidance & Blueprint

### 8.1 CSS Token Hygiene (`theme.css` vs `index.css`)
In our codebase inspection, `theme.css` contains legacy tokens from a prior template (e.g., `--color-void-violet`, `--radius-buttons: 9999px`, `--color-ember-orange`). 
**Recommendation for Implementers:**
- Ensure `index.css` overrides all colors with the true Living Manuscript tokens:
  - `--background`: `#F4F1EA`
  - `--foreground`: `#2C2A29`
  - `--accent`: `#9A2A2A`
  - `--border`: `#2C2A29`
  - `--radius`: `0`
- Strip out all circular pill button radius references so all buttons, inputs, and cards adhere strictly to `--radius: 0`.

### 8.2 Reusable UI Component Primitives
The following foundational components should be created under `apps/web/src/components/ui/` or `apps/web/src/components/manuscript/`:
1. `StaffBackground.tsx`: Repeating 5-line structural staff grid.
2. `FolioBorder.tsx`: Double-ruled charcoal border container with ornamental corner glyphs.
3. `GlyphButton.tsx`: Zero-radius button rendering musical Unicode glyphs with crimson hover feedback.
4. `InkBleed.tsx`: SVG turbulence filter and animation wrapper.
5. `TuningDial.tsx`: Circular SVG harmonic astrolabe with dynamic needle and resonance halo.
6. `ConstellationPlot.tsx`: SVG/Canvas interactive scatter plot with star nodes and connecting filaments.

### 8.3 Playwright Verification Checklist
To satisfy the acceptance criteria in `ORIGINAL_REQUEST.md`:
- [ ] Dev server builds without errors.
- [ ] Landing page renders with `#F4F1EA` parchment background, `#2C2A29` text, and embedded Clerk Auth components.
- [ ] Viewport panned to `(-100vw, 0)` renders Constellation History with scatter nodes and axes.
- [ ] Viewport panned to `(0, -100vh)` renders Composer's Bio Profile with two-column folio layout and stats.
- [ ] Setup / Tuning Ritual renders the circular tuning dial with detected note and frequency telemetry.
- [ ] All typography uses Playfair Display for serif headings and Geist Mono for technical telemetry.
