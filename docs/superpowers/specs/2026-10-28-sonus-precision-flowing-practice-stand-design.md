# SONUS: Precision Musical Practice Stand & Real-Time Flowing Notation Interface

## 1. Executive Summary & Design Philosophy
SONUS is designed as an austere, precision-engineered digital music stand for serious instrumentalists (acoustic/electric guitar and piano). 

The interface abandons generic SaaS cards, gamified badges, and verbose AI text commentary in favor of an **authentic musical manuscript aesthetic** inspired by traditional music engraving and analog studio workstations:
- **Palette:** Pressed Cotton Ivory Parchment (`#F7F5F0`), Linen Panels (`#FCFBF8`, `#EFECE6`), Deep Iron Gall Charcoal Ink (`#242321`), Bookbinder Terracotta Playhead (`#9A2A2A`), and Muted Sage Hit Verification (`#4A6B5B`).
- **Core Visual Focus:** A continuous, horizontally scrolling musical ribbon flowing smoothly from right to left beneath a fixed center playhead.
- **Real-Time Responsiveness:** Microphone audio is evaluated live against the active chord at the instant of playback (measuring onset timing delta $\pm\text{ms}$, pitch accuracy, and harmonic voicing completeness).

---

## 2. Visual Architecture & Layout Decomposition

```
+----------------------------------------------------------------------------------------------------+
| § SONUS   [GUITAR TAB / PIANO STAFF]   Title • Key • Bar    [-] 80 BPM [+] (4/4) ••••   Input VU   |
+----------------------------------------------------------------------------------------------------+
|                                         [HIT POINT / INSTANT]                                      |
| STRINGS                                          |                                                 |
| 1 (e) 329Hz ---------[3]----------------[3]-----|-----[2]-------------[2]------------------------- |
| 2 (B) 246Hz ---------[3]----------------[3]-----|-----[3]-------------[3]------------------------- |
| 3 (G) 196Hz ---------[0]----------------[0]-----|-----[2]-------------[2]------------------------- |
| 4 (D) 146Hz ---------[0]----------------[0]-----|-----[0]-------------[0]------------------------- |
| 5 (A) 110Hz ---------[2]----------------[2]-----|------x---------------x-------------------------- |
| 6 (E) 82Hz  ---------[3]----------------[3]-----|------x---------------x-------------------------- |
|                   Bar 12 (G) [✓ +3ms 100% HIT]   |   Bar 13 (D)                                    |
|                                            [ON-BEAT ±0ms]                                          |
+----------------------------------------------------------------------------------------------------+
|  Bm  Barre 2nd Fret       |  REAL-TIME TELEMETRY               |  TRANSPORT CONTROLS               |
|  [Fretboard Diagram]      |  Intonation: 98.4%                 |  Count-In: 4B | A-B Loop: M12-14  |
|  1-3-4-2-1                |  Timing Sync: ±6ms Steady          |  [ |< ] [ || PAUSE ] [ >| ]       |
|  B2, F#3, D4, F#4         |  Voicing: 6/6 str (All Ringing)    |  0.75x  1.0x  1.25x               |
+----------------------------------------------------------------------------------------------------+
```

### Component Breakdown

### 2.1 Precision Header Bar (Top HUD)
- **Wordmark & Edition Stand:** Austere letterspaced monospace logo `§ SONUS EDITION STAND`.
- **Instrument Mode Toggle:** Crisp tactile segmented pill toggle switching between:
  - `GUITAR TABLATURE` (6-line tab with string tunings & fret numbers).
  - `PIANO GRAND STAFF` (Treble and Bass clefs with standard note engraving).
- **Piece Header:** Title, Key, Time Signature, and current measure position (e.g. *Four-Chord Anthem • Key: D Major • Bar 14/32*).
- **Mechanical Metronome Stand:** Tactile `-` / `+` tempo adjusters, 4/4 meter, and mechanical pendulum tick indicators with the active beat highlighted.
- **Hardware Input Meter:** Discrete segmented analog VU decibel bar, real-time detected fundamental frequency (`D4 ±0c • 293.7 Hz`), and elapsed session chronometer.

### 2.2 Flowing Notation Ribbon (Center Viewport)
- **Continuous Ribbon Mechanics:** The musical canvas smoothly glides from right to left in sync with the active BPM using `requestAnimationFrame` and high-resolution Web Audio clocks (`audioContext.currentTime`).
- **Fixed Center Playhead:** A vertical terracotta hairline (`#9A2A2A`) anchored at 50% viewport width with upper and lower caliper bounds (`HIT POINT / INSTANT` and `ON-BEAT ±0ms`).
- **Guitar Tablature Notation:**
  - 6 horizontal staff lines labeled with string index and frequency (`1(e) 329Hz` to `6(E) 82Hz`).
  - Measures delineated by crisp vertical bar lines with measure numbering.
  - Strum direction glyphs (traditional downbow `⊓` and upbow `∨`).
  - Clear, high-contrast fret indicators placed precisely on beat divisions.
- **Piano Grand Staff Notation (Dual Mode):**
  - High-contrast dual stave with Treble Clef (right hand voicings) and Bass Clef (left hand root octaves).
  - Note heads engraved with rhythmic stems and ledger lines.
- **Real-Time Hit Registration:**
  - Chords passing the playhead are evaluated via live pitch-class matching.
  - **Clean Hit:** Subtle sage green ink verification badge (`✓ +3ms VERIFIED`, `100% HIT`).
  - **Timing Drift:** Antique ochre timestamp indicating early/late offset (e.g. `+18ms LATE`).
  - **Miss / Unvoiced:** Faint terracotta strike with missing note breakdown.

### 2.3 Lower Telemetry & Voicing Deck (Bottom Bar)
- **Active Chord Inspector:**
  - Large chord symbol engraving (`Bm`).
  - Woodcut-style vector fretboard diagram showing string-by-string finger placement (`1-3-4-2-1`), barre position marker (`BARRE 2nd FRET`), and open/muted string indicators.
  - Pitch spelling formula (`Formula: 1 - b3 - 5`, `B2 (Root)`, `F#3 (5th)`, `D4 (m3)`, `F#4 (5th)`).
- **Real-Time Precision Telemetry:**
  - **Intonation:** `98.4%` clean harmonic alignment.
  - **Timing Sync:** Centered needle gauge tracking EWMA latency drift (`±6ms Heritage Steady`).
  - **Voicing Completeness:** Segmented string dots (`6/6 str Clean Barre Inscribed`).
- **Mechanical Transport Controls:**
  - Count-in toggle (`4B`), A-B loop measure selector (`[M13-16]`).
  - Scrub bar with current measure position (`Bar 14 / 32`) and total duration.
  - Play/Pause switch, beat skipper (`|<`, `>|`), and tempo speed multiplier (`0.75x`, `1.0x`, `1.25x`).

---

## 3. Real-Time Audio Engine & Chord Processing Architecture

### 3.1 Live Audio Pipeline
Unlike the legacy flow which relied solely on post-recording WAV uploads, the new practice stand evaluates performance in real-time in the browser while maintaining full compatibility with the backend:
1. **Web Audio Analyzer Node:** High-resolution audio pipeline with Hann windowing and real-time FFT / autocorrelation pitch tracking for low-latency ($\le 20\text{ms}$) fundamental frequency and harmonic presence.
2. **Chord Pitch-Class Matcher:** Active chords provide expected MIDI pitch sets. As the playhead crosses each beat, the detected pitch set is compared against expected chord tones:
   $$\text{Voicing Completeness} = \frac{|\text{Detected Pitch Classes} \cap \text{Expected Chord Pitches}|}{|\text{Expected Chord Pitches}|}$$
3. **Timing Latency Metric:** Calculated as the difference between the playhead crossing timestamp $T_{\text{target}}$ and the audio onset energy peak $T_{\text{detected}}$:
   $$\Delta t = T_{\text{detected}} - T_{\text{target}} \quad (\text{in milliseconds})$$

### 3.2 Dynamic & Custom Chord Progressions
To resolve the limitation of static canned exercises:
- Exercises are decoupled from hardcoded templates.
- Support for arbitrary chord sequences input by the user (e.g. `["D", "A", "Bm", "G"]`, `["Cmaj7", "A7", "Dm7", "G7"]`).
- Full automatic voicing generator providing:
  - Guitar fretboard fingerings for open, barre, and drop-2 jazz voicings.
  - Piano left-hand bass + right-hand 3-note shell voicings.

---

## 4. Design Verification & Stitch Asset
- **Stitch Project:** `SONUS` (`projects/4513414872048669454`)
- **Generated Screen:** `SONUS Precision Practice Stand - Archival Parchment` (`screens/5e56438d2c9f4d9ea792e61ee6f80d99`)
- **Rendered Design Asset:** Saved to workspace artifacts at `sonus_practice_stand_ivory.png`.
