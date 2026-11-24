from __future__ import annotations

import json
from typing import Any
import pytest

from src.lib.music.seed_data import SEED_EXERCISES


def test_seed_exercises_catalog_count_and_types() -> None:
    assert len(SEED_EXERCISES) == 20

    guitar_exercises = [e for e in SEED_EXERCISES if e["instrument"] == "guitar"]
    piano_exercises = [e for e in SEED_EXERCISES if e["instrument"] == "piano"]

    assert len(guitar_exercises) == 10
    assert len(piano_exercises) == 10

    expected_ids = {
        "ex_guitar_rising_sun",
        "ex_guitar_where_did_you_sleep",
        "ex_guitar_spanish_romance",
        "ex_guitar_scarborough_fair",
        "ex_guitar_greensleeves",
        "ex_guitar_bourree",
        "ex_guitar_whiskey_in_the_jar",
        "ex_guitar_malaguena",
        "ex_guitar_knockin",
        "ex_guitar_blues_shuffle",
        "ex_piano_shostakovich_waltz_2",
        "ex_piano_canon",
        "ex_piano_fur_elise",
        "ex_piano_gymnopedie_1",
        "ex_piano_moonlight_sonata",
        "ex_piano_bach_minuet_g",
        "ex_piano_prelude_c",
        "ex_piano_clair_de_lune",
        "ex_piano_the_entertainer",
        "ex_piano_autumn_turnaround",
    }
    actual_ids = {e["id"] for e in SEED_EXERCISES}
    assert actual_ids == expected_ids


def test_seed_exercises_json_schema_and_metadata() -> None:
    for exercise in SEED_EXERCISES:
        assert exercise["id"].startswith("ex_")
        assert len(exercise["title"]) > 5
        assert len(exercise["description"]) > 10
        assert exercise["instrument"] in ("guitar", "piano")
        assert 40 <= exercise["tempo_bpm"] <= 240
        assert 1 <= exercise["difficulty"] <= 5

        # Check progression_json
        prog = json.loads(exercise["progression_json"])
        assert "key" in prog
        assert "time_signature" in prog
        assert "tempo_range" in prog
        assert "chords" in prog
        assert len(prog["chords"]) >= 16

        # Check tempo range bounds
        tr = prog["tempo_range"]
        assert tr["min_bpm"] <= tr["default_bpm"] <= tr["max_bpm"]
        assert tr["gradual_step_bpm"] > 0


def test_seed_guitar_exercises_tabs_and_arpeggios() -> None:
    guitar_exercises = [e for e in SEED_EXERCISES if e["instrument"] == "guitar"]
    for exercise in guitar_exercises:
        prog = json.loads(exercise["progression_json"])
        chords = prog["chords"]

        for chord in chords:
            assert "name" in chord
            assert chord["duration_beats"] > 0
            assert "guitar_tabs" in chord

            tabs = chord["guitar_tabs"]
            assert len(tabs["frets"]) == 6
            assert "strings" in tabs
            assert "fingers" in tabs
            assert len(tabs["fingers"]) == 6

            # For every fretted string (fret > 0), finger must be assigned (1-4 or T)
            for idx, fret in enumerate(tabs["frets"]):
                if fret is not None and fret > 0:
                    assert tabs["fingers"][idx] is not None

            # Plucked notes check
            if "plucked_notes" in chord:
                for pluck in chord["plucked_notes"]:
                    assert 1 <= pluck["string"] <= 6
                    assert pluck["pitch"] > 0
                    assert 0 <= pluck["beatOffset"] < chord["duration_beats"]

            # Strum events check
            if "strum_events" in chord and chord["strum_events"]:
                prev_off = -1.0
                for strum in chord["strum_events"]:
                    assert strum["direction"] in ("down", "up")
                    assert 0 <= strum["beatOffset"] < chord["duration_beats"]
                    assert strum["beatOffset"] >= prev_off
                    prev_off = strum["beatOffset"]


def test_seed_piano_exercises_voicings_and_staff() -> None:
    piano_exercises = [e for e in SEED_EXERCISES if e["instrument"] == "piano"]
    for exercise in piano_exercises:
        prog = json.loads(exercise["progression_json"])
        chords = prog["chords"]

        for chord in chords:
            assert "name" in chord
            assert chord["duration_beats"] > 0
            assert "piano_voicings" in chord

            pv = chord["piano_voicings"]
            assert "lh_note" in pv
            assert len(pv["rh_notes"]) > 0
            assert len(pv["lh_pitches"]) > 0
            assert len(pv["rh_pitches"]) > 0

            # Pitch bounds
            for lh_p in pv["lh_pitches"]:
                assert 24 <= lh_p <= 59
            for rh_p in pv["rh_pitches"]:
                assert 48 <= rh_p <= 84

            # Grand staff melody notes
            if "melody_notes" in chord and chord["melody_notes"]:
                for mn in chord["melody_notes"]:
                    assert mn["clef"] in ("treble", "bass")
                    assert mn["duration"] > 0
                    assert 0 <= mn["beatOffset"] < chord["duration_beats"]


def test_seed_exercises_canonical_notes() -> None:
    for exercise in SEED_EXERCISES:
        prog = json.loads(exercise["progression_json"])
        chords = prog["chords"]
        assert len(chords) > 0

        for chord in chords:
            assert "notes" in chord, f"Missing canonical notes in {exercise['id']} chord {chord.get('name')}"
            assert len(chord["notes"]) > 0
            for note in chord["notes"]:
                assert isinstance(note["pitch"], int)
                assert 20 <= note["pitch"] <= 108
                assert 0 <= note["beatOffset"] < chord["duration_beats"]
                assert note["duration"] > 0
                assert note["voice"] in ("melody", "harmony", "bass", "lead")

