from __future__ import annotations

from typing import Any

from src.lib.music.chords import parse_chord_notes

_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_pitch_name(pitch: int) -> str:
    """Convert a MIDI pitch number (e.g. 60) to pitch name with octave (e.g. C4)."""
    octave = (pitch // 12) - 1
    name = _NOTE_NAMES[pitch % 12]
    return f"{name}{octave}"


def evaluate_chord_voicing(
    detected_pitches: list[int],
    expected_pitches: list[int],
) -> dict[str, Any]:
    """Calculate voicing completeness and identify missed and extra pitches."""
    if not expected_pitches:
        return {
            "voicing_completeness": 1.0,
            "missed_notes": [],
            "extra_notes": [midi_to_pitch_name(p) for p in sorted(detected_pitches)],
            "matched_pitches": [],
        }

    # If reference pitches are provided as pitch classes (0-11)
    is_pitch_class_ref = all(0 <= p <= 11 for p in expected_pitches)

    if is_pitch_class_ref:
        exp_pcs = set(expected_pitches)
        det_pcs = {p % 12 for p in detected_pitches}
        matched_pcs = exp_pcs & det_pcs
        missed_pcs = exp_pcs - det_pcs
        extra_pcs = det_pcs - exp_pcs
        completeness = len(matched_pcs) / len(exp_pcs) if exp_pcs else 1.0
        return {
            "voicing_completeness": completeness,
            "missed_notes": [_NOTE_NAMES[pc] for pc in sorted(missed_pcs)],
            "extra_notes": [_NOTE_NAMES[pc] for pc in sorted(extra_pcs)],
            "matched_pitches": sorted(p for p in detected_pitches if p % 12 in matched_pcs),
        }

    expected_set = set(expected_pitches)
    detected_set = set(detected_pitches)

    matched = expected_set & detected_set
    missed = expected_set - detected_set
    extra = detected_set - expected_set

    completeness = len(matched) / len(expected_set) if expected_set else 1.0

    return {
        "voicing_completeness": completeness,
        "missed_notes": [midi_to_pitch_name(p) for p in sorted(missed)],
        "extra_notes": [midi_to_pitch_name(p) for p in sorted(extra)],
        "matched_pitches": sorted(matched),
    }


def identify_chord_from_pitches(pitches: list[int]) -> str:
    """Best-effort chord identification from a collection of MIDI pitches."""
    if not pitches:
        return ""
    detected_pcs = set(p % 12 for p in pitches)

    # Check common triads and seventh chords
    common_qualities = ["", "m", "7", "maj7", "m7", "dim", "aug", "sus2", "sus4"]
    best_chord = ""
    best_score = 0.0

    for root in _NOTE_NAMES:
        for quality in common_qualities:
            candidate = f"{root}{quality}"
            try:
                candidate_notes = set(parse_chord_notes(candidate))
                common = candidate_notes & detected_pcs
                if not common:
                    continue
                recall = len(common) / len(candidate_notes)
                precision = len(common) / len(detected_pcs)
                f1 = (2 * recall * precision) / (recall + precision) if (recall + precision) > 0 else 0.0
                # Prioritize complete major/minor triads, then other triads
                bonus = 0.0
                if recall == 1.0:
                    if quality in ("", "m"):
                        bonus = 0.08
                    elif len(candidate_notes) == 3:
                        bonus = 0.04
                score = f1 + bonus
                if score > best_score:
                    best_score = score
                    best_chord = candidate
            except ValueError:
                continue

    return best_chord if best_score >= 0.6 else ""


def cluster_chords_from_notes(
    notes: list[dict[str, Any]],
    strum_window_ms: float = 120.0,
) -> list[dict[str, Any]]:
    """Cluster asynchronous note onsets within a strum window into chord strikes."""
    if not notes:
        return []

    sorted_notes = sorted(notes, key=lambda n: float(n["start_time"]))
    window_sec = strum_window_ms / 1000.0

    clusters: list[list[dict[str, Any]]] = []
    current_cluster: list[dict[str, Any]] = [sorted_notes[0]]

    for note in sorted_notes[1:]:
        first_note_time = float(current_cluster[0]["start_time"])
        note_time = float(note["start_time"])
        if (note_time - first_note_time) <= window_sec:
            current_cluster.append(note)
        else:
            clusters.append(current_cluster)
            current_cluster = [note]

    if current_cluster:
        clusters.append(current_cluster)

    result: list[dict[str, Any]] = []
    for cluster in clusters:
        cluster_pitches = sorted({int(n["pitch"]) for n in cluster})
        timestamp = float(cluster[0]["start_time"])
        detected_name = identify_chord_from_pitches(cluster_pitches)
        result.append({
            "timestamp_sec": timestamp,
            "pitches": cluster_pitches,
            "detected_name": detected_name,
        })

    return result
