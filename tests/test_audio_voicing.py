from __future__ import annotations

import pytest

from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.voicing import cluster_chords_from_notes, identify_chord_from_pitches


def test_slow_guitar_strum_clusters_into_single_chord() -> None:
    # 6-string guitar strum where strings are plucked 35ms apart (total duration 175ms > old 120ms window)
    # E minor triad: E2(40), B2(47), E3(52), G3(55), B3(59), E4(64)
    notes = [
        {"pitch": 40, "start_time": 1.000, "end_time": 2.5},
        {"pitch": 47, "start_time": 1.035, "end_time": 2.5},
        {"pitch": 52, "start_time": 1.070, "end_time": 2.5},
        {"pitch": 55, "start_time": 1.105, "end_time": 2.5},
        {"pitch": 59, "start_time": 1.140, "end_time": 2.5},
        {"pitch": 64, "start_time": 1.175, "end_time": 2.5},
    ]

    clusters = cluster_chords_from_notes(notes)
    assert len(clusters) == 1
    assert clusters[0]["detected_name"] in ("Em", "Em7", "E")
    assert pytest.approx(clusters[0]["timestamp_sec"], abs=0.01) == 1.000
    assert set(clusters[0]["pitches"]) == {40, 47, 52, 55, 59, 64}


def test_piano_two_handed_voicing_clusters_together() -> None:
    # Left hand strikes bass note at t=0.0s, right hand strikes triad 150ms later (t=0.15s)
    notes = [
        {"pitch": 36, "start_time": 0.00, "end_time": 2.0},  # C2 (LH)
        {"pitch": 60, "start_time": 0.15, "end_time": 2.0},  # C4 (RH)
        {"pitch": 64, "start_time": 0.15, "end_time": 2.0},  # E4 (RH)
        {"pitch": 67, "start_time": 0.15, "end_time": 2.0},  # G4 (RH)
    ]

    clusters = cluster_chords_from_notes(notes)
    assert len(clusters) == 1
    assert clusters[0]["detected_name"] == "C"
    assert pytest.approx(clusters[0]["timestamp_sec"], abs=0.01) == 0.00
    assert set(clusters[0]["pitches"]) == {36, 60, 64, 67}


def test_arpeggiated_progression_house_of_the_rising_sun() -> None:
    # 6/8 arpeggio picking pattern: Am -> C -> D -> F
    # Plucked at 250ms intervals per note (1.5s per chord)
    notes = [
        # Am (t=0.00..1.25)
        {"pitch": 45, "start_time": 0.00, "end_time": 1.5},
        {"pitch": 52, "start_time": 0.25, "end_time": 1.5},
        {"pitch": 57, "start_time": 0.50, "end_time": 1.5},
        {"pitch": 60, "start_time": 0.75, "end_time": 1.5},
        {"pitch": 64, "start_time": 1.00, "end_time": 1.5},
        {"pitch": 60, "start_time": 1.25, "end_time": 1.5},
        # C (t=1.50..2.75)
        {"pitch": 48, "start_time": 1.50, "end_time": 3.0},
        {"pitch": 52, "start_time": 1.75, "end_time": 3.0},
        {"pitch": 55, "start_time": 2.00, "end_time": 3.0},
        {"pitch": 60, "start_time": 2.25, "end_time": 3.0},
        {"pitch": 64, "start_time": 2.50, "end_time": 3.0},
        {"pitch": 60, "start_time": 2.75, "end_time": 3.0},
        # D (t=3.00..4.25)
        {"pitch": 50, "start_time": 3.00, "end_time": 4.5},
        {"pitch": 57, "start_time": 3.25, "end_time": 4.5},
        {"pitch": 62, "start_time": 3.50, "end_time": 4.5},
        {"pitch": 66, "start_time": 3.75, "end_time": 4.5},
        {"pitch": 62, "start_time": 4.00, "end_time": 4.5},
        {"pitch": 57, "start_time": 4.25, "end_time": 4.5},
        # F (t=4.50..5.75)
        {"pitch": 41, "start_time": 4.50, "end_time": 6.0},
        {"pitch": 48, "start_time": 4.75, "end_time": 6.0},
        {"pitch": 53, "start_time": 5.00, "end_time": 6.0},
        {"pitch": 57, "start_time": 5.25, "end_time": 6.0},
        {"pitch": 60, "start_time": 5.50, "end_time": 6.0},
        {"pitch": 57, "start_time": 5.75, "end_time": 6.0},
    ]

    clusters = cluster_chords_from_notes(notes)
    assert len(clusters) == 4

    detected_chord_names = [c["detected_name"] for c in clusters]
    assert detected_chord_names == ["Am", "C", "D", "F"]

    ref = [
        {"name": "Am", "beat": 1, "expected_pitches": [45, 52, 57, 60, 64]},
        {"name": "C", "beat": 7, "expected_pitches": [48, 52, 55, 60, 64]},
        {"name": "D", "beat": 13, "expected_pitches": [50, 57, 62, 66]},
        {"name": "F", "beat": 19, "expected_pitches": [41, 48, 53, 57, 60]},
    ]
    # At 240 BPM eighth notes, beat 1 = 0s, beat 7 = 1.5s, beat 13 = 3.0s, beat 19 = 4.5s
    matches = align_chord_sequence(clusters, ref, tempo_bpm=240)
    assert len(matches) == 4
    matched_count = sum(1 for m in matches if m["is_matched"])
    accuracy = (matched_count / len(matches)) * 100
    assert accuracy >= 85.0


def test_arpeggiated_progression_dm_to_g() -> None:
    # Arpeggiated Dm -> G progression where G's bass note G3(55) is above the old 53-pitch boundary
    notes = [
        # Dm (t=0.0..0.75)
        {"pitch": 50, "start_time": 0.00, "end_time": 1.0},
        {"pitch": 53, "start_time": 0.25, "end_time": 1.0},
        {"pitch": 57, "start_time": 0.50, "end_time": 1.0},
        {"pitch": 62, "start_time": 0.75, "end_time": 1.0},
        # G (t=1.0..1.75)
        {"pitch": 55, "start_time": 1.00, "end_time": 2.0},
        {"pitch": 59, "start_time": 1.25, "end_time": 2.0},
        {"pitch": 62, "start_time": 1.50, "end_time": 2.0},
        {"pitch": 67, "start_time": 1.75, "end_time": 2.0},
    ]

    clusters = cluster_chords_from_notes(notes)
    assert len(clusters) == 2
    assert clusters[0]["detected_name"] == "Dm"
    assert pytest.approx(clusters[0]["timestamp_sec"], abs=0.01) == 0.00
    assert clusters[1]["detected_name"] in ("G", "G7")
    assert pytest.approx(clusters[1]["timestamp_sec"], abs=0.01) == 1.00


def test_cluster_chords_empty_input() -> None:
    assert cluster_chords_from_notes([]) == []
