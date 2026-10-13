from __future__ import annotations

from typing import Any

from src.lib.music.chords import parse_chord_notes


def validate_progression_schema(progression: dict[str, Any]) -> bool:
    """Verify that a chord progression dictionary conforms to the expected schema.

    Checks:
    - Root object is a dictionary.
    - If tempo_bpm is present, it is a positive integer (> 0).
    - 'chords' is present and is a non-empty list of chord dictionaries.
    - Each chord contains:
        - 'name': Valid parseable chord string.
        - 'beat': Numeric offset >= 0.
        - 'duration_beats': Numeric duration > 0.
        - 'expected_pitches': Non-empty list of valid MIDI integers (0-127).
    - Beats are in chronological non-decreasing order.
    """
    if not isinstance(progression, dict):
        return False

    tempo = progression.get("tempo_bpm")
    if tempo is not None:
        if not isinstance(tempo, int) or tempo <= 0:
            return False

    chords = progression.get("chords")
    if not isinstance(chords, list) or len(chords) == 0:
        return False

    last_beat: float = -1.0

    for chord in chords:
        if not isinstance(chord, dict):
            return False

        chord_name = chord.get("name")
        if not isinstance(chord_name, str):
            return False

        try:
            parse_chord_notes(chord_name)
        except ValueError:
            return False

        beat = chord.get("beat")
        if not isinstance(beat, (int, float)) or beat < 0:
            return False

        if beat < last_beat:
            # Beat must be chronological
            return False
        last_beat = float(beat)

        duration = chord.get("duration_beats")
        if not isinstance(duration, (int, float)) or duration <= 0:
            return False

        pitches = chord.get("expected_pitches")
        if not isinstance(pitches, list) or len(pitches) == 0:
            return False

        for pitch in pitches:
            if not isinstance(pitch, int) or pitch < 0 or pitch > 127:
                return False

    return True
