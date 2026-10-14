from __future__ import annotations

import pytest

from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.patterns import (
    detect_habits,
    detect_tempo_rushing_patterns,
    detect_transition_lag_patterns,
    detect_voicing_drop_patterns,
)
from src.lib.adaptive.reports import generate_grounded_report


def test_detect_f_to_g_transition_lag() -> None:
    # 4 transitions where F -> G transition latency exceeds 100ms
    metric_history = [
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 140},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 135},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 125},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 150},
        # Control: C -> Am is fast
        {"from_chord": "C", "to_chord": "Am", "transition_latency_ms": 35},
        {"from_chord": "C", "to_chord": "Am", "transition_latency_ms": 40},
    ]
    patterns = detect_transition_lag_patterns(metric_history, threshold_ms=100.0, min_evidence=3)
    assert len(patterns) == 1
    assert patterns[0]["context"] == "F -> G"
    assert patterns[0]["pattern_type"] == "transition_lag"
    assert patterns[0]["evidence_count"] == 4
    assert patterns[0]["status"] == "active"
    assert patterns[0]["avg_lag_ms"] > 100.0


def test_detect_tempo_rushing() -> None:
    # Player systematically attacks early by > 40ms on consecutive downbeats
    metrics = [
        {"chord": "C", "onset_error_ms": -45.0},
        {"chord": "G", "onset_error_ms": -52.0},
        {"chord": "Am", "onset_error_ms": -48.0},
        {"chord": "F", "onset_error_ms": -60.0},
    ]
    patterns = detect_tempo_rushing_patterns(metrics, rush_threshold_ms=-30.0, min_evidence=3)
    assert len(patterns) == 1
    assert patterns[0]["pattern_type"] == "tempo_rushing"
    assert patterns[0]["evidence_count"] == 4
    assert patterns[0]["avg_lead_ms"] > 40.0


def test_detect_voicing_drop_patterns() -> None:
    # Player consistently misses note 'E4' in C major chords
    metrics = [
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
        {"chord": "C", "missed_notes": ["E4"], "is_matched": True},
        {"chord": "G", "missed_notes": [], "is_matched": True},
    ]
    patterns = detect_voicing_drop_patterns(metrics, min_evidence=2)
    assert len(patterns) == 1
    assert patterns[0]["pattern_type"] == "voicing_drop"
    assert patterns[0]["context"] == "C:E4"
    assert patterns[0]["evidence_count"] == 3


def test_generate_intervention_for_transition_lag() -> None:
    pattern = {
        "pattern_type": "transition_lag",
        "context": "F -> G",
        "evidence_count": 4,
        "avg_lag_ms": 135.0,
        "status": "active",
    }
    intervention = generate_intervention(pattern, user_id="user_123", reference_tempo=120)
    assert intervention["user_id"] == "user_123"
    assert intervention["drill_type"] == "isolated_transition"
    assert intervention["target_tempo"] == 90  # 120 * 0.75
    assert intervention["target_repetitions"] == 5
    assert "F -> G" in intervention["instructions"]


def test_generate_grounded_report() -> None:
    chord_metrics = [
        {
            "chord_index": 0,
            "expected_chord": "C",
            "detected_chord": "C",
            "is_matched": True,
            "onset_error_ms": 12.0,
            "voicing_completeness": 1.0,
            "missed_notes": [],
            "extra_notes": [],
        },
        {
            "chord_index": 1,
            "expected_chord": "G",
            "detected_chord": "G",
            "is_matched": True,
            "onset_error_ms": -45.0,
            "voicing_completeness": 0.67,
            "missed_notes": ["B3"],
            "extra_notes": [],
        },
    ]
    report = generate_grounded_report(session_id="sess_abc", chord_metrics=chord_metrics)
    assert report["session_id"] == "sess_abc"
    assert report["facts"]["total_chords"] == 2
    assert report["facts"]["matched_chords"] == 2
    assert report["facts"]["accuracy_pct"] == 100.0
    assert "G" in report["summary"] or "B3" in report["summary"] or "accuracy" in report["summary"].lower()
    assert len(report["grounded_facts"]) > 0


def test_detect_habits_aggregate() -> None:
    metrics = [
        {"chord": "C", "onset_error_ms": -45.0, "missed_notes": ["E4"]},
        {"chord": "C", "onset_error_ms": -50.0, "missed_notes": ["E4"]},
        {"chord": "C", "onset_error_ms": -40.0, "missed_notes": ["E4"]},
    ]
    transitions = [
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 130},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 140},
        {"from_chord": "F", "to_chord": "G", "transition_latency_ms": 120},
    ]
    patterns = detect_habits(user_id="u1", metrics=metrics, transitions=transitions)
    assert len(patterns) == 3
    pattern_types = {p["pattern_type"] for p in patterns}
    assert "transition_lag" in pattern_types
    assert "tempo_rushing" in pattern_types
    assert "voicing_drop" in pattern_types
    assert all(p["user_id"] == "u1" for p in patterns)
