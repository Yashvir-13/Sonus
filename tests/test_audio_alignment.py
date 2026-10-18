from __future__ import annotations

from pathlib import Path

import pytest

from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.voicing import cluster_chords_from_notes, evaluate_chord_voicing


def test_align_exact_progression() -> None:
    ref = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]},
    ]
    played = [
        {"detected_name": "C", "timestamp_sec": 0.05, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 2.02, "pitches": [43, 47, 50]},
    ]
    # At 120 BPM, beat 1 is 0.0s, beat 5 is 2.0s
    matches = align_chord_sequence(played, ref, tempo_bpm=120)
    assert len(matches) == 2
    assert matches[0]["is_matched"] is True
    assert matches[0]["expected_chord"] == "C"
    assert matches[0]["detected_chord"] == "C"
    assert pytest.approx(matches[0]["onset_error_ms"], abs=10) == 50.0
    assert matches[1]["is_matched"] is True
    assert matches[1]["expected_chord"] == "G"
    assert pytest.approx(matches[1]["onset_error_ms"], abs=10) == 20.0


def test_align_with_skipped_chord() -> None:
    ref = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "Am", "beat": 5, "expected_pitches": [45, 52, 57]},
        {"name": "G", "beat": 9, "expected_pitches": [43, 47, 50]},
    ]
    # Player completely skips Am and transitions directly from C to G
    played = [
        {"detected_name": "C", "timestamp_sec": 0.02, "pitches": [48, 52, 55]},
        {"detected_name": "G", "timestamp_sec": 4.05, "pitches": [43, 47, 50]},
    ]
    matches = align_chord_sequence(played, ref, tempo_bpm=120)
    assert len(matches) == 3
    assert matches[0]["is_matched"] is True
    assert matches[0]["expected_chord"] == "C"

    assert matches[1]["is_matched"] is False
    assert matches[1]["expected_chord"] == "Am"
    assert matches[1]["detected_chord"] == ""

    assert matches[2]["is_matched"] is True
    assert matches[2]["expected_chord"] == "G"


def test_align_with_phantom_extra_chord() -> None:
    ref = [
        {"name": "C", "beat": 1, "expected_pitches": [48, 52, 55]},
        {"name": "G", "beat": 5, "expected_pitches": [43, 47, 50]},
    ]
    # Player accidentally plays an erroneous chord between C and G
    played = [
        {"detected_name": "C", "timestamp_sec": 0.01, "pitches": [48, 52, 55]},
        {"detected_name": "F#dim", "timestamp_sec": 1.10, "pitches": [42, 45, 48]},
        {"detected_name": "G", "timestamp_sec": 2.01, "pitches": [43, 47, 50]},
    ]
    matches = align_chord_sequence(played, ref, tempo_bpm=120)
    assert len(matches) == 2
    assert matches[0]["is_matched"] is True
    assert matches[0]["expected_chord"] == "C"
    assert matches[1]["is_matched"] is True
    assert matches[1]["expected_chord"] == "G"


def test_cluster_chords_from_notes() -> None:
    # A guitar strum where 6 notes are plucked with slight onset variance (< 50ms window)
    notes = [
        {"pitch": 40, "start_time": 1.000, "end_time": 2.0, "amplitude": 0.8},
        {"pitch": 45, "start_time": 1.015, "end_time": 2.0, "amplitude": 0.75},
        {"pitch": 50, "start_time": 1.025, "end_time": 2.0, "amplitude": 0.7},
        {"pitch": 55, "start_time": 1.035, "end_time": 2.0, "amplitude": 0.72},
        {"pitch": 59, "start_time": 1.042, "end_time": 2.0, "amplitude": 0.68},
        {"pitch": 64, "start_time": 1.050, "end_time": 2.0, "amplitude": 0.65},
        # Next chord played 2 seconds later (C major triad)
        {"pitch": 48, "start_time": 3.000, "end_time": 4.0, "amplitude": 0.8},
        {"pitch": 52, "start_time": 1.010 + 2.0, "end_time": 4.0, "amplitude": 0.8},
        {"pitch": 55, "start_time": 1.020 + 2.0, "end_time": 4.0, "amplitude": 0.8},
    ]
    clusters = cluster_chords_from_notes(notes, strum_window_ms=60.0)
    assert len(clusters) == 2
    assert clusters[0]["pitches"] == [40, 45, 50, 55, 59, 64]
    assert pytest.approx(clusters[0]["timestamp_sec"], abs=0.01) == 1.000
    assert clusters[1]["pitches"] == [48, 52, 55]


def test_evaluate_chord_voicing() -> None:
    expected_pitches = [60, 64, 67]  # C4, E4, G4
    detected_pitches = [60, 67, 72]  # C4, G4, C5 (missing E4, extra C5)

    metric = evaluate_chord_voicing(detected_pitches, expected_pitches)
    assert pytest.approx(metric["voicing_completeness"], abs=0.01) == 2 / 3
    assert "E4" in metric["missed_notes"]
    assert "C5" in metric["extra_notes"]


def test_identify_chord_from_pitches() -> None:
    from src.lib.audio.voicing import identify_chord_from_pitches

    # D major (D3, A3, D4, F#4)
    assert identify_chord_from_pitches([50, 57, 62, 66]) == "D"
    # D major with partial overtone (E=64)
    assert identify_chord_from_pitches([50, 57, 62, 64, 66]) == "D"
    # D7 (D, F#, A, C)
    assert identify_chord_from_pitches([50, 57, 60, 66]) == "D7"
    # C major (C4, E4, G4)
    assert identify_chord_from_pitches([60, 64, 67]) == "C"


def test_transcribe_missing_file() -> None:
    from src.lib.audio.transcription import transcribe_polyphonic_wav

    with pytest.raises(FileNotFoundError):
        transcribe_polyphonic_wav("non_existent_audio.wav")


def test_transcribe_synthetic_wav(tmp_path: Path) -> None:
    import numpy as np
    from scipy.io import wavfile
    from src.lib.audio.transcription import transcribe_polyphonic_wav

    # Synthesize A4 (440 Hz) note for 0.5 sec
    sr = 22050
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    audio = (0.5 * np.sin(2 * np.pi * 440.0 * t)).astype(np.float32)

    wav_file = tmp_path / "test_a4.wav"
    wavfile.write(str(wav_file), sr, audio)

    notes = transcribe_polyphonic_wav(str(wav_file))
    assert isinstance(notes, list)
    assert len(notes) > 0
    # A4 is MIDI pitch 69
    assert any(n["pitch"] in (68, 69, 70) for n in notes)

