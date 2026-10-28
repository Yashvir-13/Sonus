from __future__ import annotations

import json
from typing import Any

# ==============================================================================
# 1. GUITAR FULL SONG: Knockin' Cadence (24 Measures, 96 Beats)
# ==============================================================================
def _build_knockin_full_song() -> list[dict[str, Any]]:
    chords: list[dict[str, Any]] = []
    # 3 sections: Verse 1 (M1-8), Chorus 1 (M9-16), Verse 2 / Outro (M17-24)
    sections = [
        ("Verse 1", "ballad"),
        ("Chorus", "anthem"),
        ("Verse 2 / Outro", "ringout"),
    ]

    beat_cursor = 1.0
    for section_name, strum_type in sections:
        # 8 measures per section: G (4), D (4), Am (4), Am (4), G (4), D (4), C (4), C/G (4)
        m_sequence = [
            ("G", 4.0, [43, 47, 50, 55, 59, 67], [3, 2, 0, 0, 0, 3], "2-1-0-0-0-3", "E-A-D-G-B-e"),
            ("D", 4.0, [50, 57, 62, 66], [None, None, 0, 2, 3, 2], "x-x-0-1-3-2", "x-x-D-G-B-e"),
            ("Am", 4.0, [45, 52, 57, 60, 64], [None, 0, 2, 2, 1, 0], "x-0-2-3-1-0", "x-A-D-G-B-e"),
            ("Am", 4.0, [45, 52, 57, 60, 64], [None, 0, 2, 2, 1, 0], "x-0-2-3-1-0", "x-A-D-G-B-e"),
            ("G", 4.0, [43, 47, 50, 55, 59, 67], [3, 2, 0, 0, 0, 3], "2-1-0-0-0-3", "E-A-D-G-B-e"),
            ("D", 4.0, [50, 57, 62, 66], [None, None, 0, 2, 3, 2], "x-x-0-1-3-2", "x-x-D-G-B-e"),
            ("C", 4.0, [48, 52, 55, 60, 64], [None, 3, 2, 0, 1, 0], "x-3-2-0-1-0", "x-A-D-G-B-e"),
            ("C" if section_name != "Verse 2 / Outro" else "G", 4.0, [48, 52, 55, 60, 64], [None, 3, 2, 0, 1, 0], "x-3-2-0-1-0", "x-A-D-G-B-e"),
        ]

        for name, dur, pitches, frets, fingering, strings in m_sequence:
            strum_events: list[dict[str, Any]] = []
            if strum_type == "ballad":
                # D - D - D U D U
                strum_events = [
                    {"beatOffset": 0.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 1.0, "direction": "down", "accent": False, "label": "D"},
                    {"beatOffset": 2.0, "direction": "down", "accent": False, "label": "D"},
                    {"beatOffset": 2.5, "direction": "up", "accent": False, "label": "U"},
                    {"beatOffset": 3.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 3.5, "direction": "up", "accent": False, "label": "U"},
                ]
            elif strum_type == "anthem":
                # D - D U - U D U (Calypso syncopation)
                strum_events = [
                    {"beatOffset": 0.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 1.0, "direction": "down", "accent": False, "label": "D"},
                    {"beatOffset": 1.5, "direction": "up", "accent": False, "label": "U"},
                    {"beatOffset": 2.5, "direction": "up", "accent": False, "label": "U"},
                    {"beatOffset": 3.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 3.5, "direction": "up", "accent": False, "label": "U"},
                ]
            else:
                # Sustained ringout: D on beat 1 and beat 3
                strum_events = [
                    {"beatOffset": 0.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 2.0, "direction": "down", "accent": False, "label": "D"},
                ]

            chords.append({
                "name": name,
                "beat": beat_cursor,
                "duration_beats": dur,
                "expected_pitches": pitches,
                "guitar_tabs": {
                    "frets": frets,
                    "strings": strings,
                    "fingering": fingering,
                },
                "strum_events": strum_events,
                "section": section_name,
            })
            beat_cursor += dur

    return chords


# ==============================================================================
# 2. PIANO FULL SONG: Pachelbel's Canon Harmonic Flow (32 Measures, 128 Beats)
# ==============================================================================
def _build_pachelbel_canon_full_song() -> list[dict[str, Any]]:
    # Harmonic progression base: C -> G -> Am -> Em -> F -> C -> F -> G
    prog_base = [
        ("C", "C3", ["E4", "G4", "C5"], [48], [64, 67, 72]),
        ("G", "G2", ["D4", "G4", "B4"], [43], [62, 67, 71]),
        ("Am", "A2", ["C4", "E4", "A4"], [45], [60, 64, 69]),
        ("Em", "E2", ["B3", "E4", "G4"], [40], [59, 64, 67]),
        ("F", "F2", ["A3", "C4", "F4"], [41], [57, 60, 65]),
        ("C", "C3", ["G3", "C4", "E4"], [48], [55, 60, 64]),
        ("F", "F2", ["A3", "C4", "F4"], [41], [57, 60, 65]),
        ("G", "G2", ["B3", "D4", "G4"], [43], [59, 62, 67]),
    ]

    # Specific melodic lines for each of the 4 variations (IMSLP Public Domain score)
    melody_variations = [
        # Variation 1: Theme Exposition (Singing half notes & quarter notes)
        [
            [{"pitch": "E5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "D5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
        ],
        # Variation 2: Quarter-Note Voice Leading
        [
            [{"pitch": "E5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "D5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "F4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "C5", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "E4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "G4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "B3", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "C4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 2, "clef": "treble"}, {"pitch": "D4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
        ],
        # Variation 3: Running Figurations
        [
            [{"pitch": "C5", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "E5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "D5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "C5", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "G4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "F4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "E4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "F4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "F4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "G4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "G4", "beatOffset": 0, "duration": 1, "clef": "treble"}, {"pitch": "A4", "beatOffset": 1, "duration": 1, "clef": "treble"}, {"pitch": "B4", "beatOffset": 2, "duration": 2, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
        ],
        # Variation 4: Grand Finale & Cadence (Triad Harmonies & Resolution)
        [
            [{"pitch": "E5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "D5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "A2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "B4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "E2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "A4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "F2", "beatOffset": 0, "duration": 4, "clef": "bass"}],
            [{"pitch": "C5", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "G4", "beatOffset": 0, "duration": 4, "clef": "treble"}, {"pitch": "C3", "beatOffset": 0, "duration": 4, "clef": "bass"}],
        ],
    ]

    chords: list[dict[str, Any]] = []
    beat_cursor = 1.0

    for var_idx, melody_measures in enumerate(melody_variations):
        for m_idx, (chord_name, lh_note, rh_notes, lh_pitches, rh_pitches) in enumerate(prog_base):
            melody_notes = melody_measures[m_idx]
            chords.append({
                "name": chord_name if (var_idx != 3 or m_idx != 7) else "C",
                "beat": beat_cursor,
                "duration_beats": 4.0,
                "expected_pitches": lh_pitches + rh_pitches,
                "piano_voicings": {
                    "lh_note": lh_note,
                    "rh_notes": rh_notes,
                    "lh_pitches": lh_pitches,
                    "rh_pitches": rh_pitches,
                    "inversion": "root position" if m_idx % 2 == 0 else "1st inversion",
                },
                "melody_notes": melody_notes,
                "variation": f"Variation {var_idx + 1}",
            })
            beat_cursor += 4.0

    return chords


# ==============================================================================
# 3. GUITAR FULL SONG: Four-Chord Anthem in D (32 Measures, 128 Beats)
# ==============================================================================
def _build_four_chord_anthem_full_song() -> list[dict[str, Any]]:
    # D -> A -> Bm -> G
    prog = [
        ("D", 4.0, [50, 57, 62, 66], [None, None, 0, 2, 3, 2], "x-x-0-1-3-2", "x-x-D-G-B-e"),
        ("A", 4.0, [45, 52, 57, 61, 64], [None, 0, 2, 2, 2, 0], "x-0-1-2-3-0", "x-A-D-G-B-e"),
        ("Bm", 4.0, [47, 54, 59, 62, 66], [None, 2, 4, 4, 3, 2], "x-1-3-4-2-1", "x-A-D-G-B-e"),
        ("G", 4.0, [43, 47, 50, 55, 59, 67], [3, 2, 0, 0, 0, 3], "2-1-0-0-0-3", "E-A-D-G-B-e"),
    ]

    sections = [
        ("Intro", 1),         # 4 measures
        ("Verse 1", 2),       # 8 measures
        ("Pre-Chorus", 2),    # 8 measures (Em - G - D - A x 2)
        ("Chorus", 2),        # 8 measures
        ("Outro", 1),         # 4 measures
    ]

    chords: list[dict[str, Any]] = []
    beat_cursor = 1.0

    for section_name, reps in sections:
        for _ in range(reps):
            cycle = prog
            if section_name == "Pre-Chorus":
                cycle = [
                    ("Em", 4.0, [40, 47, 52, 55, 59, 64], [0, 2, 2, 0, 0, 0], "0-2-3-0-0-0", "E-A-D-G-B-e"),
                    ("G", 4.0, [43, 47, 50, 55, 59, 67], [3, 2, 0, 0, 0, 3], "2-1-0-0-0-3", "E-A-D-G-B-e"),
                    ("D", 4.0, [50, 57, 62, 66], [None, None, 0, 2, 3, 2], "x-x-0-1-3-2", "x-x-D-G-B-e"),
                    ("A", 4.0, [45, 52, 57, 61, 64], [None, 0, 2, 2, 2, 0], "x-0-1-2-3-0", "x-A-D-G-B-e"),
                ]

            for name, dur, pitches, frets, fingering, strings in cycle:
                # Strumming pattern: D - D U - U D U
                strum_events = [
                    {"beatOffset": 0.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 1.0, "direction": "down", "accent": False, "label": "D"},
                    {"beatOffset": 1.5, "direction": "up", "accent": False, "label": "U"},
                    {"beatOffset": 2.5, "direction": "up", "accent": False, "label": "U"},
                    {"beatOffset": 3.0, "direction": "down", "accent": True, "label": "D"},
                    {"beatOffset": 3.5, "direction": "up", "accent": False, "label": "U"},
                ]
                chords.append({
                    "name": name,
                    "beat": beat_cursor,
                    "duration_beats": dur,
                    "expected_pitches": pitches,
                    "guitar_tabs": {
                        "frets": frets,
                        "strings": strings,
                        "fingering": fingering,
                    },
                    "strum_events": strum_events,
                    "section": section_name,
                })
                beat_cursor += dur

    return chords


# ==============================================================================
# 4. GUITAR FULL SONG: House of the Rising Sun (24 Measures in 6/8, 144 Beats)
# ==============================================================================
def _build_rising_sun_full_song() -> list[dict[str, Any]]:
    # Am -> C -> D -> F -> Am -> E
    cycle = [
        ("Am", 6.0, [45, 52, 57, 60, 64], [None, 0, 2, 2, 1, 0], "x-0-2-3-1-0", "x-A-D-G-B-e"),
        ("C", 6.0, [48, 52, 55, 60, 64], [None, 3, 2, 0, 1, 0], "x-3-2-0-1-0", "x-A-D-G-B-e"),
        ("D", 6.0, [50, 57, 62, 66], [None, None, 0, 2, 3, 2], "x-x-0-1-3-2", "x-x-D-G-B-e"),
        ("F", 6.0, [41, 48, 53, 57, 60, 65], [1, 3, 3, 2, 1, 1], "1-3-4-2-1-1", "E-A-D-G-B-e"),
        ("Am", 6.0, [45, 52, 57, 60, 64], [None, 0, 2, 2, 1, 0], "x-0-2-3-1-0", "x-A-D-G-B-e"),
        ("E", 6.0, [40, 47, 52, 56, 59, 64], [0, 2, 2, 1, 0, 0], "0-2-3-1-0-0", "E-A-D-G-B-e"),
    ]

    chords: list[dict[str, Any]] = []
    beat_cursor = 1.0

    # 4 passes = 24 measures
    for pass_idx in range(4):
        for name, dur, pitches, frets, fingering, strings in cycle:
            # 6/8 rolling arpeggio strum: Down on beat 1, Up/down picking on 2,3,4,5,6
            strum_events = [
                {"beatOffset": 0.0, "direction": "down", "accent": True, "label": "D"},
                {"beatOffset": 1.0, "direction": "up", "accent": False, "label": "U"},
                {"beatOffset": 2.0, "direction": "up", "accent": False, "label": "U"},
                {"beatOffset": 3.0, "direction": "down", "accent": True, "label": "D"},
                {"beatOffset": 4.0, "direction": "up", "accent": False, "label": "U"},
                {"beatOffset": 5.0, "direction": "up", "accent": False, "label": "U"},
            ]
            chords.append({
                "name": name,
                "beat": beat_cursor,
                "duration_beats": dur,
                "expected_pitches": pitches,
                "guitar_tabs": {
                    "frets": frets,
                    "strings": strings,
                    "fingering": fingering,
                },
                "strum_events": strum_events,
            })
            beat_cursor += dur

    return chords


# ==============================================================================
# 5. PIANO FULL SONG: Waltz No. 2 – Dmitri Shostakovich (32 Measures, 96 Beats)
# ==============================================================================
def _build_shostakovich_waltz_2() -> list[dict[str, Any]]:
    # Authentic 32-measure orchestral waltz score in C minor, 3/4 meter
    raw_measures = [
        # --- Strain 1: Iconic Main Theme (Measures 1 - 16) ---
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 1), ("D5", 1, 1), ("Eb5", 2, 1)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("D5", 0, 1), ("C5", 1, 1), ("D5", 2, 1)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("Eb5", 0, 2), ("D5", 2, 1)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 3)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("B4", 0, 1), ("C5", 1, 1), ("D5", 2, 1)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("C5", 0, 1), ("B4", 1, 1), ("C5", 2, 1)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("D5", 0, 2), ("C5", 2, 1)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 3)], "Theme A (First Strain)"),
        ("Fm", "F2", ["Ab3", "C4"], [41, 56, 60], [("F5", 0, 2), ("G5", 2, 1)], "Theme A (First Strain)"),
        ("Fm", "F2", ["Ab3", "C4"], [41, 56, 60], [("Ab5", 0, 2), ("G5", 2, 1)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("Eb5", 0, 3)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("D5", 0, 1), ("C5", 1, 1), ("B4", 2, 1)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("D5", 0, 3)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("C5", 0, 1), ("B4", 1, 1), ("Ab4", 2, 1)], "Theme A (First Strain)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("G4", 0, 3)], "Theme A (First Strain)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 3)], "Theme A (First Strain)"),

        # --- Strain 2: Varied Exposition & Grand Peak (Measures 17 - 32) ---
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 1), ("D5", 1, 1), ("Eb5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("D5", 0, 1), ("C5", 1, 1), ("D5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("Eb5", 0, 2), ("G5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 3)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("B4", 0, 1), ("C5", 1, 1), ("D5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("C5", 0, 1), ("B4", 1, 1), ("C5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("D5", 0, 2), ("F5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("Eb5", 0, 3)], "Theme A (Second Strain & Climax)"),
        ("Fm", "F2", ["Ab3", "C4"], [41, 56, 60], [("F5", 0, 2), ("G5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Fm", "F2", ["Ab3", "C4"], [41, 56, 60], [("Ab5", 0, 2), ("G5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("Eb5", 0, 3)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("D5", 0, 1), ("C5", 1, 1), ("B4", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("D5", 0, 3)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("C5", 0, 1), ("B4", 1, 1), ("D5", 2, 1)], "Theme A (Second Strain & Climax)"),
        ("G7", "G2", ["F3", "B3"], [43, 53, 59], [("B4", 0, 3)], "Theme A (Second Strain & Climax)"),
        ("Cm", "C3", ["Eb3", "G3"], [48, 51, 55], [("C5", 0, 3), ("G4", 0, 3)], "Theme A (Second Strain & Climax)"),
    ]

    base_midi = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    chords: list[dict[str, Any]] = []
    beat_cursor = 1.0

    for idx, (chord_name, lh_root, lh_chord, lh_pitches, rh_melody, section_name) in enumerate(raw_measures):
        lh_melody_notes = [
            {"pitch": lh_root, "beatOffset": 0, "duration": 1, "clef": "bass"},
            {"pitch": lh_chord[0], "beatOffset": 1, "duration": 1, "clef": "bass"},
            {"pitch": lh_chord[1], "beatOffset": 1, "duration": 1, "clef": "bass"},
            {"pitch": lh_root if (idx == 15 or idx == 31) else lh_chord[0], "beatOffset": 2, "duration": 1, "clef": "bass"},
        ]
        if idx != 15 and idx != 31:
            lh_melody_notes.append({"pitch": lh_chord[1], "beatOffset": 2, "duration": 1, "clef": "bass"})

        rh_melody_notes = []
        rh_pitches = []
        for pitch_str, b_offset, dur in rh_melody:
            rh_melody_notes.append({
                "pitch": pitch_str,
                "beatOffset": b_offset,
                "duration": dur,
                "clef": "treble",
            })
            letter = pitch_str[0].upper()
            acc = pitch_str[1] if pitch_str[1] in ("#", "b") else ""
            octave = int(pitch_str[-1])
            midi = (octave + 1) * 12 + base_midi[letter]
            if acc == "#":
                midi += 1
            elif acc == "b":
                midi -= 1
            rh_pitches.append(midi)

        expected_pitches = sorted(list(set(lh_pitches + rh_pitches)))

        chords.append({
            "name": chord_name,
            "beat": beat_cursor,
            "duration_beats": 3.0,
            "expected_pitches": expected_pitches,
            "piano_voicings": {
                "lh_note": lh_root,
                "rh_notes": [rh_melody[0][0]],
                "lh_pitches": [lh_pitches[0]],
                "rh_pitches": rh_pitches,
                "inversion": "root position",
            },
            "melody_notes": lh_melody_notes + rh_melody_notes,
            "section": section_name,
        })
        beat_cursor += 3.0

    return chords


SEED_EXERCISES: list[dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # GUITAR 1: Knockin' Cadence (Full 24-Measure Folk-Rock Score)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_knockin",
        "title": "Knockin' Cadence (Full Song - Verse, Chorus, Outro)",
        "description": (
            "Complete 24-measure acoustic folk-rock standard. Features authentic verse-chorus form, "
            "explicit ballad and anthem strumming arrows (D - D U - U D U), and full tab frets."
        ),
        "instrument": "guitar",
        "tempo_bpm": 70,
        "difficulty": 1,
        "progression_json": json.dumps({
            "key": "G Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 70,
            "tempo_range": {
                "min_bpm": 50,
                "default_bpm": 70,
                "max_bpm": 95,
                "gradual_step_bpm": 5,
            },
            "strumming_pattern": "D - D - D U D U (Ballad) & D - D U - U D U (Anthem)",
            "educational_focus": "Eliminate pause during D -> Am transition; ensure high E rings clear on D.",
            "chords": _build_knockin_full_song(),
        }),
    },

    # --------------------------------------------------------------------------
    # GUITAR 2: Four-Chord Anthem in D (Full 32-Measure Song)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_four_chord",
        "title": "Four-Chord Anthem in D (Full 32-Measure Pop Score)",
        "description": (
            "Complete 32-measure universal pop/rock anthem (I–V–vi–IV) covering Intro, Verse, "
            "Pre-Chorus, Chorus, and Grand Outro with complete strumming directionality."
        ),
        "instrument": "guitar",
        "tempo_bpm": 80,
        "difficulty": 2,
        "progression_json": json.dumps({
            "key": "D Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 80,
            "tempo_range": {
                "min_bpm": 60,
                "default_bpm": 80,
                "max_bpm": 110,
                "gradual_step_bpm": 5,
            },
            "strumming_pattern": "D - D U - U D U (Driving Pop Strum)",
            "educational_focus": "Fluid transitions between open D/A chords and the 2nd-fret Bm barre.",
            "chords": _build_four_chord_anthem_full_song(),
        }),
    },

    # --------------------------------------------------------------------------
    # GUITAR 3: House of the Rising Sun (Full 24-Measure 6/8 Traditional)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_rising_sun",
        "title": "House of the Rising Sun (Full 24-Measure 6/8 Folk Classic)",
        "description": (
            "Complete 24-measure traditional folk masterwork in 6/8 compound time. "
            "Features authentic rolling arpeggio strumming vectors and chord fingerings."
        ),
        "instrument": "guitar",
        "tempo_bpm": 76,
        "difficulty": 3,
        "progression_json": json.dumps({
            "key": "A Minor",
            "time_signature": "6/8",
            "default_tempo_bpm": 76,
            "tempo_range": {
                "min_bpm": 50,
                "default_bpm": 76,
                "max_bpm": 92,
                "gradual_step_bpm": 4,
            },
            "strumming_pattern": "D - U - U - D - U - U (6/8 rolling arpeggio)",
            "educational_focus": "Rhythmic stability across 6 beats per measure; clean F barre chord.",
            "chords": _build_rising_sun_full_song(),
        }),
    },

    # --------------------------------------------------------------------------
    # PIANO 1: Pachelbel's Canon Harmonic Flow (Full 32-Measure Classical Score)
    # --------------------------------------------------------------------------
    {
        "id": "ex_piano_canon",
        "title": "Pachelbel's Canon Harmonic Flow (Full 32-Measure Classical Score)",
        "description": (
            "Complete 32-measure authentic classical score from IMSLP. Features 4 distinct variations "
            "(Theme Exposition, Counterpoint, Running Polyphony, Grand Cadence) with measure-by-measure "
            "right-hand melody noteheads and steady left-hand basso ostinato."
        ),
        "instrument": "piano",
        "tempo_bpm": 68,
        "difficulty": 2,
        "progression_json": json.dumps({
            "key": "C Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 68,
            "tempo_range": {
                "min_bpm": 48,
                "default_bpm": 68,
                "max_bpm": 88,
                "gradual_step_bpm": 4,
            },
            "educational_focus": "Authentic Grand Staff sight reading; smooth voice leading and ledger lines.",
            "chords": _build_pachelbel_canon_full_song(),
        }),
    },

    # --------------------------------------------------------------------------
    # PIANO 2: Waltz No. 2 – Dmitri Shostakovich (Full 32-Measure Classical Score)
    # --------------------------------------------------------------------------
    {
        "id": "ex_piano_shostakovich_waltz_2",
        "title": "Waltz No. 2 – Dmitri Shostakovich (Full 32-Measure Classical Score)",
        "description": (
            "Complete 32-measure orchestral waltz score from Suite for Variety Orchestra in 3/4 time. "
            "Features the haunting C minor melodic line (C5, D5, Eb5, F5, G5, Ab5) in Treble Clef and "
            "classical waltz boom-chick-chick accompaniment (bass root on beat 1, harmony chords on beats 2 & 3) in Bass Clef."
        ),
        "instrument": "piano",
        "tempo_bpm": 160,
        "difficulty": 3,
        "progression_json": json.dumps({
            "key": "C Minor",
            "time_signature": "3/4",
            "default_tempo_bpm": 160,
            "tempo_range": {
                "min_bpm": 120,
                "default_bpm": 160,
                "max_bpm": 184,
                "gradual_step_bpm": 6,
            },
            "strumming_pattern": "Waltz Boom-Chick-Chick (3/4)",
            "educational_focus": "Authentic 3/4 waltz rhythm; melodic phrasing in C minor; bass-chord leap coordination.",
            "chords": _build_shostakovich_waltz_2(),
        }),
    },
]
