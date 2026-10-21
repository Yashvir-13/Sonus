"""Statistical habit pattern detection with EWMA, variance, and harmonic role weighting."""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Any

from src.lib.music.chords import parse_chord_notes


def compute_ewma(values: list[float], alpha: float = 0.35) -> float:
    """Compute Exponentially Weighted Moving Average (recency weighting)."""
    if not values:
        return 0.0
    weighted = values[0]
    for v in values[1:]:
        weighted = alpha * v + (1.0 - alpha) * weighted
    return round(float(weighted), 2)


def compute_std_dev(values: list[float]) -> float:
    """Compute standard deviation to evaluate timing stability."""
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    return round(float(math.sqrt(variance)), 2)


def _determine_harmonic_role(chord_symbol: str, note_name: str) -> str:
    """Determine harmonic function of a dropped note (root, third, fifth, seventh, extension)."""
    try:
        # Extract letter from note_name (e.g., 'E4' -> 'E', 'F#3' -> 'F#')
        pitch_name = "".join([c for c in note_name if not c.isdigit()]).strip()
        if not pitch_name or not chord_symbol:
            return "unknown"

        # Compare pitch classes
        root_notes = parse_chord_notes(chord_symbol.split("/")[0])
        note_pc = parse_chord_notes(pitch_name)[0]

        if not root_notes:
            return "unknown"

        root_pc = root_notes[0]
        interval = (note_pc - root_pc) % 12

        if interval == 0:
            return "root"
        elif interval in (3, 4):
            return "third"
        elif interval in (6, 7, 8):
            return "fifth"
        elif interval in (10, 11):
            return "seventh"
        else:
            return "extension"
    except Exception:
        return "unknown"


def detect_transition_lag_patterns(
    transitions: list[dict[str, Any]],
    threshold_ms: float = 100.0,
    min_evidence: int = 3,
) -> list[dict[str, Any]]:
    """Detect persistent transition latency using EWMA and timing variance."""
    grouped: dict[str, list[float]] = defaultdict(list)
    for t in transitions:
        key = f"{t.get('from_chord', '')} -> {t.get('to_chord', '')}"
        grouped[key].append(float(t.get("transition_latency_ms", 0.0)))

    patterns: list[dict[str, Any]] = []
    for context, latencies in grouped.items():
        excessive = [lat for lat in latencies if lat >= threshold_ms]
        if len(excessive) >= min_evidence:
            avg_lag = sum(excessive) / len(excessive)
            ewma_lag = compute_ewma(latencies)  # recency weighted across full trend
            std_dev = compute_std_dev(excessive)

            # Severity: 1.0 to 5.0 based on latency magnitude
            severity = min(5.0, max(1.0, round(1.0 + (avg_lag / 40.0), 1)))
            confidence = min(1.0, round(len(excessive) / 5.0, 2))

            patterns.append({
                "pattern_type": "transition_lag",
                "context": context,
                "evidence_count": len(excessive),
                "avg_lag_ms": round(avg_lag, 2),
                "ewma_lag_ms": ewma_lag,
                "std_dev_ms": std_dev,
                "severity": severity,
                "confidence": confidence,
                "status": "active" if len(excessive) >= 4 else "emerging",
            })

    return patterns


def detect_tempo_rushing_patterns(
    metrics: list[dict[str, Any]],
    rush_threshold_ms: float = -30.0,
    min_evidence: int = 3,
) -> list[dict[str, Any]]:
    """Detect systematic early attacks (rushing ahead of metronome click)."""
    rushed = [m for m in metrics if float(m.get("onset_error_ms", 0.0)) <= rush_threshold_ms]
    if len(rushed) >= min_evidence:
        latencies = [abs(float(m.get("onset_error_ms", 0.0))) for m in rushed]
        avg_lead = sum(latencies) / len(latencies)
        ewma_lead = compute_ewma(latencies)
        std_dev = compute_std_dev(latencies)

        severity = min(5.0, max(1.0, round(1.5 + (avg_lead / 30.0), 1)))
        confidence = min(1.0, round(len(rushed) / 5.0, 2))

        return [{
            "pattern_type": "tempo_rushing",
            "context": "global_tempo",
            "evidence_count": len(rushed),
            "avg_lead_ms": round(avg_lead, 2),
            "ewma_lead_ms": ewma_lead,
            "std_dev_ms": std_dev,
            "severity": severity,
            "confidence": confidence,
            "status": "active" if len(rushed) >= 4 else "emerging",
        }]
    return []


def detect_tempo_dragging_patterns(
    metrics: list[dict[str, Any]],
    drag_threshold_ms: float = 30.0,
    min_evidence: int = 3,
) -> list[dict[str, Any]]:
    """Detect systematic late attacks (dragging behind the metronome beat)."""
    dragged = [m for m in metrics if float(m.get("onset_error_ms", 0.0)) >= drag_threshold_ms]
    if len(dragged) >= min_evidence:
        latencies = [float(m.get("onset_error_ms", 0.0)) for m in dragged]
        avg_drag = sum(latencies) / len(latencies)
        ewma_drag = compute_ewma(latencies)
        std_dev = compute_std_dev(latencies)

        severity = min(5.0, max(1.0, round(1.5 + (avg_drag / 30.0), 1)))
        confidence = min(1.0, round(len(dragged) / 5.0, 2))

        return [{
            "pattern_type": "tempo_dragging",
            "context": "global_tempo",
            "evidence_count": len(dragged),
            "avg_drag_ms": round(avg_drag, 2),
            "ewma_drag_ms": ewma_drag,
            "std_dev_ms": std_dev,
            "severity": severity,
            "confidence": confidence,
            "status": "active" if len(dragged) >= 4 else "emerging",
        }]
    return []


def detect_voicing_drop_patterns(
    metrics: list[dict[str, Any]],
    min_evidence: int = 2,
) -> list[dict[str, Any]]:
    """Detect specific chord tones that are repeatedly omitted with harmonic role weighting."""
    dropped: dict[tuple[str, str], int] = defaultdict(int)
    for m in metrics:
        chord = str(m.get("chord") or m.get("expected_chord", ""))
        for note in m.get("missed_notes", []):
            dropped[(chord, note)] += 1

    patterns: list[dict[str, Any]] = []
    for (chord, note), count in dropped.items():
        if count >= min_evidence:
            role = _determine_harmonic_role(chord, note)

            # Dropping 3rd/Root is much more damaging than dropping 5th
            if role in ("root", "third"):
                severity = 4.0 if count < 4 else 5.0
            elif role == "seventh":
                severity = 3.5
            elif role == "fifth":
                severity = 2.2
            else:
                severity = 2.8

            confidence = min(1.0, round(count / 4.0, 2))

            patterns.append({
                "pattern_type": "voicing_drop",
                "context": f"{chord}:{note}",
                "harmonic_role": role,
                "evidence_count": count,
                "severity": severity,
                "confidence": confidence,
                "status": "active" if count >= 3 else "emerging",
            })

    return patterns


def detect_habits(
    user_id: str,
    metrics: list[dict[str, Any]],
    transitions: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Detect all habit patterns for a user from practice metrics and chord transitions."""
    patterns: list[dict[str, Any]] = []
    if transitions:
        patterns.extend(detect_transition_lag_patterns(transitions))
    patterns.extend(detect_tempo_rushing_patterns(metrics))
    patterns.extend(detect_tempo_dragging_patterns(metrics))
    patterns.extend(detect_voicing_drop_patterns(metrics))
    for p in patterns:
        p["user_id"] = user_id
    return patterns


def detect_cusum_changepoint(
    series: list[float],
    target_mean: float | None = None,
    allowance_k: float = 0.5,
    threshold_h: float = 4.0,
) -> dict[str, Any]:
    """Page's two-sided Cumulative Sum Control Chart (CUSUM) change-point detector.

    Identifies the exact sequential take index where a motor habit statistically formed
    (upward mean shift) or was remediated (downward mean shift).
    """
    if len(series) < 3:
        return {"detected": False, "changepoint_index": None, "direction": None}

    # Baseline target mean and variance from early takes or provided mean
    mu = target_mean if target_mean is not None else float(sum(series[:3]) / 3.0)
    std = compute_std_dev(series) or 10.0

    k = allowance_k * std
    h = threshold_h * std

    s_pos = 0.0
    s_neg = 0.0

    for idx, x in enumerate(series):
        s_pos = max(0.0, s_pos + (x - mu - k))
        s_neg = max(0.0, s_neg + (mu - x - k))

        if s_pos > h:
            return {
                "detected": True,
                "changepoint_index": idx,
                "direction": "deterioration",
                "magnitude": round(s_pos, 2),
            }
        if s_neg > h:
            return {
                "detected": True,
                "changepoint_index": idx,
                "direction": "improvement",
                "magnitude": round(s_neg, 2),
            }

    return {"detected": False, "changepoint_index": None, "direction": None}

