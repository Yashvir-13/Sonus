from __future__ import annotations

import uuid
from typing import Any


def generate_intervention(
    pattern: dict[str, Any],
    user_id: str,
    reference_tempo: int = 120,
) -> dict[str, Any]:
    """Generate an adaptive intervention drill based on a detected habit pattern."""
    pattern_type = str(pattern.get("pattern_type", ""))
    context = str(pattern.get("context", ""))
    pattern_id = str(pattern.get("id", f"pat_{uuid.uuid4().hex[:8]}"))

    if pattern_type == "transition_lag":
        target_tempo = int(reference_tempo * 0.75)
        drill_type = "isolated_transition"
        target_repetitions = 5
        instructions = (
            f"Practice isolated transition for {context} at {target_tempo} BPM "
            "with a metronome, focusing on clean finger placement."
        )
    elif pattern_type == "tempo_rushing":
        target_tempo = reference_tempo
        drill_type = "subdivision_click"
        target_repetitions = 4
        instructions = (
            f"Practice with 8th-note subdivision metronome to avoid rushing downbeats in {context}."
        )
    elif pattern_type == "voicing_drop":
        target_tempo = int(reference_tempo * 0.8)
        drill_type = "voicing_arpeggio"
        target_repetitions = 3
        instructions = (
            f"Arpeggiate chords to ensure all voices resonate cleanly, paying special attention to {context}."
        )
    else:
        target_tempo = int(reference_tempo * 0.75)
        drill_type = "tempo_ramp"
        target_repetitions = 3
        instructions = f"Targeted practice drill for {pattern_type}: {context}."

    return {
        "id": f"intv_{uuid.uuid4().hex[:8]}",
        "pattern_id": pattern_id,
        "user_id": user_id,
        "drill_type": drill_type,
        "target_tempo": target_tempo,
        "target_repetitions": target_repetitions,
        "instructions": instructions,
        "completed": False,
        "measured_improvement": None,
    }
