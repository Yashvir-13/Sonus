from __future__ import annotations

from collections import defaultdict
from typing import Any


def detect_transition_lag_patterns(
    transitions: list[dict[str, Any]],
    threshold_ms: float = 100.0,
    min_evidence: int = 3,
) -> list[dict[str, Any]]:
    """Detect persistent transition latency between specific chords."""
    grouped: dict[str, list[float]] = defaultdict(list)
    for t in transitions:
        key = f"{t.get('from_chord', '')} -> {t.get('to_chord', '')}"
        grouped[key].append(float(t.get("transition_latency_ms", 0.0)))

    patterns: list[dict[str, Any]] = []
    for context, latencies in grouped.items():
        excessive = [lat for lat in latencies if lat >= threshold_ms]
        if len(excessive) >= min_evidence:
            avg_lag = sum(excessive) / len(excessive)
            patterns.append({
                "pattern_type": "transition_lag",
                "context": context,
                "evidence_count": len(excessive),
                "avg_lag_ms": round(avg_lag, 2),
                "status": "active" if len(excessive) >= 4 else "emerging",
            })

    return patterns


def detect_tempo_rushing_patterns(
    metrics: list[dict[str, Any]],
    rush_threshold_ms: float = -30.0,
    min_evidence: int = 3,
) -> list[dict[str, Any]]:
    """Detect systematic early attacks (rushing downbeats)."""
    rushed = [m for m in metrics if float(m.get("onset_error_ms", 0.0)) <= rush_threshold_ms]
    if len(rushed) >= min_evidence:
        avg_lead = abs(sum(float(m.get("onset_error_ms", 0.0)) for m in rushed) / len(rushed))
        return [{
            "pattern_type": "tempo_rushing",
            "context": "global_tempo",
            "evidence_count": len(rushed),
            "avg_lead_ms": round(avg_lead, 2),
            "status": "active" if len(rushed) >= 4 else "emerging",
        }]
    return []


def detect_voicing_drop_patterns(
    metrics: list[dict[str, Any]],
    min_evidence: int = 2,
) -> list[dict[str, Any]]:
    """Detect specific chord tones that are repeatedly omitted."""
    dropped: dict[tuple[str, str], int] = defaultdict(int)
    for m in metrics:
        chord = str(m.get("chord") or m.get("expected_chord", ""))
        for note in m.get("missed_notes", []):
            dropped[(chord, note)] += 1

    patterns: list[dict[str, Any]] = []
    for (chord, note), count in dropped.items():
        if count >= min_evidence:
            patterns.append({
                "pattern_type": "voicing_drop",
                "context": f"{chord}:{note}",
                "evidence_count": count,
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
    patterns.extend(detect_voicing_drop_patterns(metrics))
    for p in patterns:
        p["user_id"] = user_id
    return patterns
