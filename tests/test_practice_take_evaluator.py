"""Unit tests for the pure, in-memory PracticeTakeEvaluator domain engine."""

from __future__ import annotations

from src.lib.practice.evaluator import PracticeTakeEvaluator, TakeEvaluationResult


def test_pure_evaluator_perfect_take() -> None:
    """Verify that pure domain evaluation computes exact metrics without database access."""
    reference_chords = [
        {"name": "C", "beat": 1.0, "expected_pitches": [60, 64, 67]},
        {"name": "G", "beat": 2.0, "expected_pitches": [55, 59, 62]},
        {"name": "Am", "beat": 3.0, "expected_pitches": [57, 60, 64]},
        {"name": "F", "beat": 4.0, "expected_pitches": [53, 57, 60]},
    ]
    # At 60 BPM, 1 beat = 1.0 second
    played_chords = [
        {"chord": "C", "pitches": [60, 64, 67], "timestamp_sec": 0.005},
        {"chord": "G", "pitches": [55, 59, 62], "timestamp_sec": 1.002},
        {"chord": "Am", "pitches": [57, 60, 64], "timestamp_sec": 2.008},
        {"chord": "F", "pitches": [53, 57, 60], "timestamp_sec": 3.003},
    ]

    result = PracticeTakeEvaluator.evaluate(
        played_chords=played_chords,
        reference_chords=reference_chords,
        tempo_bpm=60,
        session_id="sess_pure_test_123",
        instrument="piano",
    )

    assert isinstance(result, TakeEvaluationResult)
    assert result.overall_accuracy == 1.0
    assert result.avg_timing_error_ms < 10.0
    assert result.voicing_score == 1.0
    assert len(result.chord_metrics) == 4
    assert result.drill_outcome is None

    payload = result.to_payload("sess_pure_test_123")
    assert payload["session_id"] == "sess_pure_test_123"
    assert payload["analysis_status"] == "complete"
    assert payload["overall_accuracy"] == 1.0


def test_pure_evaluator_detects_transition_lag_and_evaluates_delta() -> None:
    """Verify habit pattern detection and longitudinal outcome delta tracking."""
    reference_chords = [
        {"name": "C", "beat": 1.0, "expected_pitches": [60, 64, 67]},
        {"name": "G", "beat": 2.0, "expected_pitches": [55, 59, 62]},
        {"name": "Am", "beat": 3.0, "expected_pitches": [57, 60, 64]},
    ]
    # Severe transition latency (95ms late on G, 110ms late on Am)
    played_chords = [
        {"chord": "C", "pitches": [60, 64, 67], "timestamp_sec": 0.0},
        {"chord": "G", "pitches": [55, 59, 62], "timestamp_sec": 1.095},
        {"chord": "Am", "pitches": [57, 60, 64], "timestamp_sec": 2.110},
    ]

    # Baseline performance was 150ms latency
    baseline_metrics = [
        {"from_chord": "C", "to_chord": "G", "transition_latency_ms": 150.0},
        {"from_chord": "G", "to_chord": "Am", "transition_latency_ms": 160.0},
    ]

    result = PracticeTakeEvaluator.evaluate(
        played_chords=played_chords,
        reference_chords=reference_chords,
        tempo_bpm=60,
        session_id="sess_lag_123",
        instrument="guitar",
        baseline_metrics=baseline_metrics,
        drill_type="isolated_transition",
    )


    assert result.overall_accuracy == 1.0
    # Average latency is ~102.5ms vs baseline ~155ms -> ~33% improvement (> 15% threshold)
    assert result.drill_outcome is not None
    assert result.drill_outcome["completed"] is True
    assert result.drill_outcome["measured_improvement"] > 0.15
