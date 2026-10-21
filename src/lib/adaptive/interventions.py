"""Pedagogical remedial drill generation with dynamic chord slicing and multi-stage tempo ramping."""

from __future__ import annotations

import uuid
from typing import Any


def _extract_chords_from_context(context: str, default_chord: str = "C") -> list[str]:
    """Parse transition context into chord names (e.g. 'F -> G' -> ['F', 'G'])."""
    if "->" in context:
        parts = [p.strip() for p in context.split("->") if p.strip()]
        return parts if parts else [default_chord]
    elif ":" in context:
        chord = context.split(":")[0].strip()
        return [chord] if chord else [default_chord]
    return [context.strip()] if context.strip() else [default_chord]


def generate_intervention(
    pattern: dict[str, Any],
    user_id: str,
    reference_tempo: int = 120,
) -> dict[str, Any]:
    """Generate an adaptive intervention drill based on a detected habit pattern."""
    pattern_type = str(pattern.get("pattern_type", ""))
    context = str(pattern.get("context", ""))
    pattern_id = str(pattern.get("id", f"pat_{uuid.uuid4().hex[:8]}"))
    severity = float(pattern.get("severity", 3.0))
    evidence_count = int(pattern.get("evidence_count", 3))

    chords = _extract_chords_from_context(context)

    # Dynamic multi-stage tempo ramp
    slow_tempo = max(40, int(reference_tempo * 0.70))
    step_tempo = max(50, int(reference_tempo * 0.85))
    target_tempo = reference_tempo
    goal_tempo = int(reference_tempo * 1.05)

    tempo_stages = {
        "isolation_bpm": slow_tempo,
        "step_bpm": step_tempo,
        "target_bpm": target_tempo,
        "goal_bpm": goal_tempo,
    }

    # Generate executable progression slice
    progression: list[dict[str, Any]] = []
    if pattern_type == "transition_lag":
        drill_type = "isolated_transition"
        target_repetitions = 5
        # 2-chord loop
        for idx, chord in enumerate(chords):
            progression.append({
                "name": chord,
                "beat": idx * 2 + 1,
                "duration_beats": 2,
            })
        instructions = (
            f"Practice isolated transition for {context} at {slow_tempo} BPM with a steady metronome. "
            "Anticipate the finger shape on the upbeat."
        )
    elif pattern_type == "tempo_rushing":
        drill_type = "subdivision_click"
        target_repetitions = 4
        progression = [
            {"name": chords[0] if chords else "C", "beat": 1, "duration_beats": 4},
            {"name": "G", "beat": 5, "duration_beats": 4},
        ]
        instructions = (
            f"Practice with 8th-note subdivision metronome to avoid rushing downbeats in {context}."
        )
    elif pattern_type == "tempo_dragging":
        drill_type = "pocket_groove"
        target_repetitions = 4
        progression = [
            {"name": chords[0] if chords else "C", "beat": 1, "duration_beats": 4},
            {"name": "G", "beat": 5, "duration_beats": 4},
        ]
        instructions = (
            f"Lock into the metronome pocket. Attack beat 1 decisively to overcome dragging in {context}."
        )
    elif pattern_type == "voicing_drop":
        drill_type = "voicing_arpeggio"
        target_repetitions = 3
        progression = [
            {"name": chords[0], "beat": 1, "duration_beats": 4},
        ]
        instructions = (
            f"Arpeggiate chords to ensure all voices resonate cleanly, paying special attention to {context}."
        )
    else:
        drill_type = "tempo_ramp"
        target_repetitions = 3
        progression = [{"name": chords[0], "beat": 1, "duration_beats": 4}]
        instructions = f"Targeted practice drill for {pattern_type}: {context}."

    # Priority using spaced-repetition logic (severity * evidence)
    priority = round(severity * (1.0 + min(evidence_count, 10) * 0.1), 2)
    review_interval_days = 1 if severity >= 3.5 else 2

    spaced_repetition = {
        "priority": priority,
        "review_interval_days": review_interval_days,
        "mastery_level": "apprentice" if evidence_count >= 4 else "emerging",
    }

    return {
        "id": f"intv_{uuid.uuid4().hex[:8]}",
        "pattern_id": pattern_id,
        "user_id": user_id,
        "drill_type": drill_type,
        "target_tempo": int(reference_tempo * 0.75) if pattern_type in ("transition_lag", "voicing_drop") else reference_tempo,
        "target_repetitions": target_repetitions,
        "instructions": instructions,
        "progression": progression,
        "tempo_stages": tempo_stages,
        "spaced_repetition": spaced_repetition,
        "completed": False,
        "measured_improvement": None,
    }
