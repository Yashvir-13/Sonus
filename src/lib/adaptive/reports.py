from __future__ import annotations

from typing import Any


def generate_grounded_report(
    session_id: str,
    chord_metrics: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate a hallucination-free practice report with verifiable fact bundles."""
    total_chords = len(chord_metrics)
    matched_chords = sum(1 for m in chord_metrics if m.get("is_matched") is True)
    accuracy_pct = round((matched_chords / total_chords * 100.0) if total_chords > 0 else 0.0, 1)

    grounded_facts: list[dict[str, Any]] = [
        {
            "fact_id": f"fact_{session_id}_accuracy",
            "category": "accuracy",
            "claim": f"Achieved {accuracy_pct}% chord accuracy ({matched_chords}/{total_chords} chords matched).",
            "data": {
                "accuracy_pct": accuracy_pct,
                "matched_chords": matched_chords,
                "total_chords": total_chords,
            },
        }
    ]

    summary_lines = [
        f"Session {session_id} Practice Analysis:",
        f"Overall Accuracy: {accuracy_pct}% ({matched_chords}/{total_chords} chords matched).",
    ]

    total_onset_error = 0.0
    total_voicing = 0.0

    for idx, metric in enumerate(chord_metrics):
        chord_name = str(metric.get("expected_chord") or metric.get("chord", f"Chord {idx}"))
        onset_error = float(metric.get("onset_error_ms", 0.0))
        voicing = float(metric.get("voicing_completeness", 1.0))
        missed = metric.get("missed_notes", [])
        is_matched = metric.get("is_matched", False)

        total_onset_error += onset_error
        total_voicing += voicing

        if not is_matched:
            fact_id = f"fact_{session_id}_missed_{idx}"
            grounded_facts.append({
                "fact_id": fact_id,
                "category": "missed_chord",
                "claim": f"Chord {chord_name} at index {idx} was not detected or omitted.",
                "data": {"chord": chord_name, "index": idx},
            })
            summary_lines.append(f"- {chord_name} (index {idx}): Omitted or misaligned.")
            continue

        detail_parts: list[str] = []
        if voicing < 1.0 or missed:
            missed_str = ", ".join(missed) if missed else "incomplete harmonic energy"
            fact_id = f"fact_{session_id}_voicing_{idx}"
            grounded_facts.append({
                "fact_id": fact_id,
                "category": "voicing",
                "claim": f"Chord {chord_name} had {int(voicing * 100)}% completeness with missed notes: {missed_str}.",
                "data": {"chord": chord_name, "voicing": voicing, "missed_notes": missed},
            })
            detail_parts.append(f"voicing {int(voicing * 100)}% (missed {missed_str})")
        else:
            detail_parts.append("clean voicing (100%)")

        timing_desc = f"{onset_error:+.1f}ms"
        if onset_error < -30:
            timing_desc += " (rushed)"
        elif onset_error > 30:
            timing_desc += " (lagged)"
        detail_parts.append(f"timing error {timing_desc}")

        summary_lines.append(f"- {chord_name}: {', '.join(detail_parts)}.")

    avg_onset = round(total_onset_error / total_chords, 1) if total_chords > 0 else 0.0
    avg_voicing = round(total_voicing / total_chords, 2) if total_chords > 0 else 0.0

    facts: dict[str, Any] = {
        "total_chords": total_chords,
        "matched_chords": matched_chords,
        "accuracy_pct": accuracy_pct,
        "avg_onset_error_ms": avg_onset,
        "avg_voicing_completeness": avg_voicing,
    }

    return {
        "session_id": session_id,
        "facts": facts,
        "grounded_facts": grounded_facts,
        "summary": "\n".join(summary_lines),
    }
