from __future__ import annotations

import pytest

from src.lib.music.chords import (
    chord_similarity,
    parse_chord_notes,
)
from src.lib.music.progressions import validate_progression_schema


def test_parse_c_major() -> None:
    assert parse_chord_notes("C") == [0, 4, 7]


def test_parse_am7() -> None:
    # A=9, C=0, E=4, G=7
    assert parse_chord_notes("Am7") == [9, 0, 4, 7]


def test_parse_various_qualities() -> None:
    # Minor: Dm -> D(2), F(5), A(9)
    assert parse_chord_notes("Dm") == [2, 5, 9]

    # Dominant 7: G7 -> G(7), B(11), D(2), F(5)
    assert parse_chord_notes("G7") == [7, 11, 2, 5]

    # Major 7: Fmaj7 -> F(5), A(9), C(0), E(4)
    assert parse_chord_notes("Fmaj7") == [5, 9, 0, 4]

    # Diminished: Bdim -> B(11), D(2), F(5)
    assert parse_chord_notes("Bdim") == [11, 2, 5]

    # Suspended 4: Dsus4 -> D(2), G(7), A(9)
    assert parse_chord_notes("Dsus4") == [2, 7, 9]


def test_parse_accidentals() -> None:
    # Sharps: F#m -> F#(6), A(9), C#(1)
    assert parse_chord_notes("F#m") == [6, 9, 1]

    # Flats: Bb -> Bb(10), D(2), F(5)
    assert parse_chord_notes("Bb") == [10, 2, 5]

    # Ebmaj7 -> Eb(3), G(7), Bb(10), D(2)
    assert parse_chord_notes("Ebmaj7") == [3, 7, 10, 2]


def test_parse_slash_chord() -> None:
    # G/B -> bass note B(11), followed by root G(7) and 5th D(2)
    assert parse_chord_notes("G/B") == [11, 7, 2]
    # C/E -> bass note E(4), followed by root C(0) and 5th G(7)
    assert parse_chord_notes("C/E") == [4, 0, 7]


def test_parse_invalid_chord_raises_value_error() -> None:
    with pytest.raises(ValueError):
        parse_chord_notes("H#dim")

    with pytest.raises(ValueError):
        parse_chord_notes("")


def test_chord_similarity_exact() -> None:
    assert chord_similarity([0, 4, 7], [0, 4, 7]) == 1.0


def test_chord_similarity_partial() -> None:
    # C major vs C power chord (missing 3rd)
    sim = chord_similarity([0, 4, 7], [0, 7])
    assert 0.6 <= sim < 1.0


def test_chord_similarity_disjoint() -> None:
    # C major [0, 4, 7] vs F# major [6, 10, 1]
    assert chord_similarity([0, 4, 7], [6, 10, 1]) == 0.0


def test_chord_similarity_empty() -> None:
    assert chord_similarity([], [0, 4, 7]) == 0.0
    assert chord_similarity([0, 4, 7], []) == 0.0
    assert chord_similarity([], []) == 1.0


def test_validate_progression_schema_valid() -> None:
    valid_prog = {
        "id": "ex_pop_chords_01",
        "name": "Standard Pop Cadence",
        "instrument": "guitar",
        "tempo_bpm": 80,
        "chords": [
            {
                "name": "C",
                "beat": 1,
                "duration_beats": 4,
                "expected_pitches": [48, 52, 55, 60, 64],
            },
            {
                "name": "G",
                "beat": 5,
                "duration_beats": 4,
                "expected_pitches": [43, 47, 50, 55, 59, 67],
            },
            {
                "name": "Am",
                "beat": 9,
                "duration_beats": 4,
                "expected_pitches": [45, 52, 57, 60, 64],
            },
            {
                "name": "F",
                "beat": 13,
                "duration_beats": 4,
                "expected_pitches": [41, 48, 53, 57, 60, 65],
            },
        ],
    }
    assert validate_progression_schema(valid_prog) is True


def test_validate_progression_schema_invalid_inputs() -> None:
    # Not a dict
    assert validate_progression_schema(None) is False  # type: ignore[arg-type]
    assert validate_progression_schema([]) is False  # type: ignore[arg-type]

    # Missing chords
    assert validate_progression_schema({"tempo_bpm": 80}) is False

    # Empty chords list
    assert validate_progression_schema({"tempo_bpm": 80, "chords": []}) is False

    # Invalid tempo
    assert (
        validate_progression_schema(
            {
                "tempo_bpm": 0,
                "chords": [
                    {
                        "name": "C",
                        "beat": 1,
                        "duration_beats": 4,
                        "expected_pitches": [60],
                    }
                ],
            }
        )
        is False
    )

    # Non-chronological beat
    assert (
        validate_progression_schema(
            {
                "tempo_bpm": 80,
                "chords": [
                    {
                        "name": "C",
                        "beat": 5,
                        "duration_beats": 4,
                        "expected_pitches": [60],
                    },
                    {
                        "name": "G",
                        "beat": 2,
                        "duration_beats": 4,
                        "expected_pitches": [67],
                    },
                ],
            }
        )
        is False
    )

    # Invalid chord name
    assert (
        validate_progression_schema(
            {
                "tempo_bpm": 80,
                "chords": [
                    {
                        "name": "NotAChordXYZ",
                        "beat": 1,
                        "duration_beats": 4,
                        "expected_pitches": [60],
                    }
                ],
            }
        )
        is False
    )

    # Invalid pitches (out of MIDI bounds or not int)
    assert (
        validate_progression_schema(
            {
                "tempo_bpm": 80,
                "chords": [
                    {
                        "name": "C",
                        "beat": 1,
                        "duration_beats": 4,
                        "expected_pitches": [200],
                    }
                ],
            }
        )
        is False
    )

