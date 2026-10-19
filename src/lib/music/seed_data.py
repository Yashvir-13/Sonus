from __future__ import annotations

import json
from typing import Any

SEED_EXERCISES: list[dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # GUITAR 1: Knockin' Cadence (Folk-Rock Standard)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_knockin",
        "title": "Knockin' Cadence (G – D – Am – C)",
        "description": (
            "Classic folk-rock acoustic cadence. Focus on clean open chord transitions, "
            "sustaining ring-out, and avoiding accidental string muting on the open high E string."
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
            "strumming_pattern": "D - D U - U D U (Calypso strum)",
            "educational_focus": "Eliminate pause during D -> Am transition; ensure high E2 rings clear on D.",
            "chords": [
                {
                    "name": "G",
                    "beat": 1.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 47, 50, 55, 59, 67],
                    "guitar_tabs": {
                        "frets": [3, 2, 0, 0, 0, 3],
                        "strings": "E-A-D-G-B-e",
                        "fingering": "2-1-0-0-0-3",
                    },
                    "common_mistakes": ["Muting 5th string with index finger slant", "Incomplete strum missing high G4"],
                },
                {
                    "name": "D",
                    "beat": 5.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [50, 57, 62, 66],
                    "guitar_tabs": {
                        "frets": [None, None, 0, 2, 3, 2],
                        "strings": "x-x-D-G-B-e",
                        "fingering": "x-x-0-1-3-2",
                    },
                    "common_mistakes": ["Accidental ring finger mute on 1st string (F#4)", "Strumming low E string causing muddy bass"],
                },
                {
                    "name": "Am",
                    "beat": 9.0,
                    "duration_beats": 8.0,
                    "expected_pitches": [45, 52, 57, 60, 64],
                    "guitar_tabs": {
                        "frets": [None, 0, 2, 2, 1, 0],
                        "strings": "x-A-D-G-B-e",
                        "fingering": "x-0-2-3-1-0",
                    },
                    "common_mistakes": ["Index finger muting high open E", "Rushing onset before beat 9"],
                },
                {
                    "name": "G",
                    "beat": 17.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 47, 50, 55, 59, 67],
                    "guitar_tabs": {
                        "frets": [3, 2, 0, 0, 0, 3],
                        "strings": "E-A-D-G-B-e",
                        "fingering": "2-1-0-0-0-3",
                    },
                    "common_mistakes": ["Late arrival from Am"],
                },
                {
                    "name": "D",
                    "beat": 21.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [50, 57, 62, 66],
                    "guitar_tabs": {
                        "frets": [None, None, 0, 2, 3, 2],
                        "strings": "x-x-D-G-B-e",
                        "fingering": "x-x-0-1-3-2",
                    },
                    "common_mistakes": ["Strumming low E or A strings"],
                },
                {
                    "name": "C",
                    "beat": 25.0,
                    "duration_beats": 8.0,
                    "expected_pitches": [48, 52, 55, 60, 64],
                    "guitar_tabs": {
                        "frets": [None, 3, 2, 0, 1, 0],
                        "strings": "x-A-D-G-B-e",
                        "fingering": "x-3-2-0-1-0",
                    },
                    "common_mistakes": ["Index finger buzzing on 2nd string C4", "Hitting low open E string"],
                },
            ],
        }),
    },

    # --------------------------------------------------------------------------
    # GUITAR 2: Four-Chord Anthem in D (D – A – Bm – G)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_four_chord",
        "title": "Four-Chord Anthem in D (D – A – Bm – G)",
        "description": (
            "The universal pop/rock anthem progression (I–V–vi–IV). Develops smooth transitions "
            "between open D/A chords and the 2nd-fret B minor barre or half-barre."
        ),
        "instrument": "guitar",
        "tempo_bpm": 80,
        "difficulty": 2,
        "progression_json": json.dumps({
            "key": "D Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 80,
            "tempo_range": {
                "min_bpm": 55,
                "default_bpm": 80,
                "max_bpm": 105,
                "gradual_step_bpm": 5,
            },
            "strumming_pattern": "D - D - D U D U",
            "educational_focus": "Quick transition from A to Bm; maintaining pressure on the Bm barre.",
            "chords": [
                {
                    "name": "D",
                    "beat": 1.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [50, 57, 62, 66],
                    "guitar_tabs": {
                        "frets": [None, None, 0, 2, 3, 2],
                        "strings": "x-x-D-G-B-e",
                        "fingering": "x-x-0-1-3-2",
                    },
                    "common_mistakes": ["Muting high F#4"],
                },
                {
                    "name": "A",
                    "beat": 5.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [45, 52, 57, 61, 64],
                    "guitar_tabs": {
                        "frets": [None, 0, 2, 2, 2, 0],
                        "strings": "x-A-D-G-B-e",
                        "fingering": "x-0-1-2-3-0",
                    },
                    "common_mistakes": ["Crowding fret 2 causing buzzing on C#4"],
                },
                {
                    "name": "Bm",
                    "beat": 9.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [47, 54, 59, 62, 66],
                    "guitar_tabs": {
                        "frets": [None, 2, 4, 4, 3, 2],
                        "strings": "x-B-F#-B-D-F#",
                        "fingering": "x-1-3-4-2-1",
                    },
                    "common_mistakes": ["Barre finger weakness muting 1st string F#4", "Hesitation lag entering Bm"],
                },
                {
                    "name": "G",
                    "beat": 13.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 47, 50, 55, 62, 67],
                    "guitar_tabs": {
                        "frets": [3, 2, 0, 0, 3, 3],
                        "strings": "E-A-D-G-B-e",
                        "fingering": "2-1-0-0-3-4",
                    },
                    "common_mistakes": ["Sloppy release from Bm barre"],
                },
            ],
        }),
    },

    # --------------------------------------------------------------------------
    # GUITAR 3: House of the Rising Sun (6/8 Minor Ballad)
    # --------------------------------------------------------------------------
    {
        "id": "ex_guitar_rising_sun",
        "title": "House of the Rising Sun (Am – C – D – F in 6/8)",
        "description": (
            "Traditional folk masterpiece in 6/8 time. Exercises arpeggiation, steady compound meter, "
            "and mastering the challenging F major chord change."
        ),
        "instrument": "guitar",
        "tempo_bpm": 76,
        "difficulty": 2,
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
            "strumming_pattern": "D - D - D (6/8 rolling arpeggio)",
            "educational_focus": "Rhythmic stability across 6 beats per measure; clean F chord without fret buzz.",
            "chords": [
                {
                    "name": "Am",
                    "beat": 1.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [45, 52, 57, 60, 64],
                    "guitar_tabs": {"frets": [None, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e"},
                },
                {
                    "name": "C",
                    "beat": 7.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [48, 52, 55, 60, 64],
                    "guitar_tabs": {"frets": [None, 3, 2, 0, 1, 0], "strings": "x-A-D-G-B-e"},
                },
                {
                    "name": "D",
                    "beat": 13.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [50, 57, 62, 66],
                    "guitar_tabs": {"frets": [None, None, 0, 2, 3, 2], "strings": "x-x-D-G-B-e"},
                },
                {
                    "name": "F",
                    "beat": 19.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [41, 48, 53, 57, 60, 65],
                    "guitar_tabs": {"frets": [1, 3, 3, 2, 1, 1], "strings": "E-A-D-G-B-e"},
                    "common_mistakes": ["F major barre collapse", "Missing root F1 on low E string"],
                },
                {
                    "name": "Am",
                    "beat": 25.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [45, 52, 57, 60, 64],
                    "guitar_tabs": {"frets": [None, 0, 2, 2, 1, 0], "strings": "x-A-D-G-B-e"},
                },
                {
                    "name": "E",
                    "beat": 31.0,
                    "duration_beats": 6.0,
                    "expected_pitches": [40, 47, 52, 56, 59, 64],
                    "guitar_tabs": {"frets": [0, 2, 2, 1, 0, 0], "strings": "E-A-D-G-B-e"},
                },
            ],
        }),
    },

    # --------------------------------------------------------------------------
    # PIANO 1: Pachelbel's Canon Harmonic Flow (Classical Voice Leading)
    # --------------------------------------------------------------------------
    {
        "id": "ex_piano_canon",
        "title": "Pachelbel's Canon Harmonic Flow (C – G – Am – Em – F – C – F – G)",
        "description": (
            "The iconic classical canon progression arranged in C Major. Focuses on minimal hand displacement "
            "and smooth voice leading in the right hand over steady left-hand bass roots."
        ),
        "instrument": "piano",
        "tempo_bpm": 68,
        "difficulty": 1,
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
            "educational_focus": "Smooth right-hand voice leading; avoiding hand position jumps.",
            "chords": [
                {
                    "name": "C",
                    "beat": 1.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [48, 55, 60, 64],
                    "piano_voicings": {
                        "lh_note": "C3",
                        "rh_notes": ["G3", "C4", "E4"],
                        "lh_pitches": [48],
                        "rh_pitches": [55, 60, 64],
                        "inversion": "2nd inversion",
                    },
                },
                {
                    "name": "G",
                    "beat": 5.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 55, 59, 62],
                    "piano_voicings": {
                        "lh_note": "G2",
                        "rh_notes": ["G3", "B3", "D4"],
                        "lh_pitches": [43],
                        "rh_pitches": [55, 59, 62],
                        "inversion": "root position",
                    },
                },
                {
                    "name": "Am",
                    "beat": 9.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [45, 57, 60, 64],
                    "piano_voicings": {
                        "lh_note": "A2",
                        "rh_notes": ["A3", "C4", "E4"],
                        "lh_pitches": [45],
                        "rh_pitches": [57, 60, 64],
                        "inversion": "root position",
                    },
                },
                {
                    "name": "Em",
                    "beat": 13.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [40, 55, 59, 64],
                    "piano_voicings": {
                        "lh_note": "E2",
                        "rh_notes": ["G3", "B3", "E4"],
                        "lh_pitches": [40],
                        "rh_pitches": [55, 59, 64],
                        "inversion": "1st inversion",
                    },
                },
                {
                    "name": "F",
                    "beat": 17.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [41, 57, 60, 65],
                    "piano_voicings": {
                        "lh_note": "F2",
                        "rh_notes": ["A3", "C4", "F4"],
                        "lh_pitches": [41],
                        "rh_pitches": [57, 60, 65],
                        "inversion": "1st inversion",
                    },
                },
                {
                    "name": "C",
                    "beat": 21.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [48, 55, 60, 64],
                    "piano_voicings": {
                        "lh_note": "C3",
                        "rh_notes": ["G3", "C4", "E4"],
                        "lh_pitches": [48],
                        "rh_pitches": [55, 60, 64],
                        "inversion": "2nd inversion",
                    },
                },
                {
                    "name": "F",
                    "beat": 25.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [41, 57, 60, 65],
                    "piano_voicings": {
                        "lh_note": "F2",
                        "rh_notes": ["A3", "C4", "F4"],
                        "lh_pitches": [41],
                        "rh_pitches": [57, 60, 65],
                        "inversion": "1st inversion",
                    },
                },
                {
                    "name": "G",
                    "beat": 29.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 55, 59, 62],
                    "piano_voicings": {
                        "lh_note": "G2",
                        "rh_notes": ["G3", "B3", "D4"],
                        "lh_pitches": [43],
                        "rh_pitches": [55, 59, 62],
                        "inversion": "root position",
                    },
                },
            ],
        }),
    },

    # --------------------------------------------------------------------------
    # PIANO 2: Pop Ballad Cadence (C – G – Am – F)
    # --------------------------------------------------------------------------
    {
        "id": "ex_piano_pop_ballad",
        "title": "Pop Ballad Cadence (C – G – Am – F)",
        "description": (
            "The foundational modern pop ballad groove. Exercises left-hand bass octaves "
            "with steady quarter-note right-hand chord comping and clean pedal changes."
        ),
        "instrument": "piano",
        "tempo_bpm": 76,
        "difficulty": 1,
        "progression_json": json.dumps({
            "key": "C Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 76,
            "tempo_range": {
                "min_bpm": 55,
                "default_bpm": 76,
                "max_bpm": 96,
                "gradual_step_bpm": 5,
            },
            "educational_focus": "Rhythmic LH/RH coordination and clean pedal change on measure downbeats.",
            "chords": [
                {
                    "name": "C",
                    "beat": 1.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [36, 48, 64, 67, 72],
                    "piano_voicings": {
                        "lh_note": "C2+C3 (Octave)",
                        "rh_notes": ["E4", "G4", "C5"],
                        "lh_pitches": [36, 48],
                        "rh_pitches": [64, 67, 72],
                        "inversion": "1st inversion",
                    },
                },
                {
                    "name": "G",
                    "beat": 5.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [31, 43, 62, 67, 71],
                    "piano_voicings": {
                        "lh_note": "G1+G2 (Octave)",
                        "rh_notes": ["D4", "G4", "B4"],
                        "lh_pitches": [31, 43],
                        "rh_pitches": [62, 67, 71],
                        "inversion": "2nd inversion",
                    },
                },
                {
                    "name": "Am",
                    "beat": 9.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [33, 45, 60, 64, 69],
                    "piano_voicings": {
                        "lh_note": "A1+A2 (Octave)",
                        "rh_notes": ["C4", "E4", "A4"],
                        "lh_pitches": [33, 45],
                        "rh_pitches": [60, 64, 69],
                        "inversion": "1st inversion",
                    },
                },
                {
                    "name": "F",
                    "beat": 13.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [29, 41, 60, 65, 69],
                    "piano_voicings": {
                        "lh_note": "F1+F2 (Octave)",
                        "rh_notes": ["C4", "F4", "A4"],
                        "lh_pitches": [29, 41],
                        "rh_pitches": [60, 65, 69],
                        "inversion": "2nd inversion",
                    },
                },
            ],
        }),
    },

    # --------------------------------------------------------------------------
    # PIANO 3: Autumn Jazz Turnaround (Dm7 – G7 – Cmaj7 – A7)
    # --------------------------------------------------------------------------
    {
        "id": "ex_piano_autumn_turnaround",
        "title": "Autumn Jazz Turnaround (Dm7 – G7 – Cmaj7 – A7)",
        "description": (
            "Essential jazz turnaround progression (ii–V–I–VI). Trains 7th chord voicings, "
            "smooth voice leading, and accidental recognition (C# in A7)."
        ),
        "instrument": "piano",
        "tempo_bpm": 84,
        "difficulty": 2,
        "progression_json": json.dumps({
            "key": "C Major",
            "time_signature": "4/4",
            "default_tempo_bpm": 84,
            "tempo_range": {
                "min_bpm": 60,
                "default_bpm": 84,
                "max_bpm": 115,
                "gradual_step_bpm": 5,
            },
            "educational_focus": "Mastering 7th shell voicings and the chromatic C# in A7.",
            "chords": [
                {
                    "name": "Dm7",
                    "beat": 1.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [50, 65, 69, 72],
                    "piano_voicings": {
                        "lh_note": "D3",
                        "rh_notes": ["F4", "A4", "C5"],
                        "lh_pitches": [50],
                        "rh_pitches": [65, 69, 72],
                    },
                },
                {
                    "name": "G7",
                    "beat": 5.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [43, 65, 71, 74],
                    "piano_voicings": {
                        "lh_note": "G2",
                        "rh_notes": ["F4", "B4", "D5"],
                        "lh_pitches": [43],
                        "rh_pitches": [65, 71, 74],
                    },
                },
                {
                    "name": "Cmaj7",
                    "beat": 9.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [48, 64, 67, 71],
                    "piano_voicings": {
                        "lh_note": "C3",
                        "rh_notes": ["E4", "G4", "B4"],
                        "lh_pitches": [48],
                        "rh_pitches": [64, 67, 71],
                    },
                },
                {
                    "name": "A7",
                    "beat": 13.0,
                    "duration_beats": 4.0,
                    "expected_pitches": [45, 67, 73, 76],
                    "piano_voicings": {
                        "lh_note": "A2",
                        "rh_notes": ["G4", "C#5", "E5"],
                        "lh_pitches": [45],
                        "rh_pitches": [67, 73, 76],
                    },
                },
            ],
        }),
    },
]
