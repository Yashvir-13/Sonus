from __future__ import annotations

from typing import Any

from src.lib.audio.voicing import evaluate_chord_voicing, midi_to_pitch_name
from src.lib.music.chords import chord_similarity, parse_chord_notes


def _compute_chord_similarity(
    ref: dict[str, Any],
    played: dict[str, Any],
) -> float:
    """Compute harmonic and pitch-class similarity between reference and played chords."""
    ref_name = str(ref.get("name", ""))
    det_name = str(played.get("detected_name", "") or played.get("chord", ""))

    exp_notes = [int(p) for p in ref.get("expected_pitches", [])]
    if not exp_notes and ref_name:
        try:
            exp_notes = parse_chord_notes(ref_name)
        except Exception:
            exp_notes = []

    det_notes: list[int] = []
    if played.get("pitches"):
        det_notes = [int(p) for p in played["pitches"]]
    elif det_name:
        try:
            det_notes = parse_chord_notes(det_name)
        except Exception:
            det_notes = []

    sim = chord_similarity(exp_notes, det_notes)

    if not sim and ref_name and det_name:
        try:
            sim = chord_similarity(parse_chord_notes(ref_name), parse_chord_notes(det_name))
        except Exception:
            pass

    return sim


def _compute_match_score(
    ref: dict[str, Any],
    played: dict[str, Any],
    exp_time: float,
    window_sec: float,
) -> tuple[float, float, float]:
    """Compute Needleman-Wunsch match score applying Sakoe-Chiba temporal window constraint."""
    sim = _compute_chord_similarity(ref, played)
    played_time = float(played.get("timestamp_sec", played.get("onset_time", 0.0)))
    time_diff = abs(played_time - exp_time)

    # Sakoe-Chiba temporal band: reject distant chords outside window W
    if time_diff > window_sec:
        return -100.0, sim, time_diff

    if sim >= 0.5:
        # High similarity reward discounted by proportional timing error without artificial 3.0s ceiling
        score = (10.0 * sim) - (time_diff * 1.5)
    else:
        score = -6.0

    return score, sim, time_diff


def align_chord_sequence(
    played_chords: list[dict[str, Any]],
    reference_chords: list[dict[str, Any]],
    tempo_bpm: int = 120,
    window_sec: float | None = None,
) -> list[dict[str, Any]]:
    """Align performed chords against reference chord progression using dynamic programming.

    Implements a Sakoe-Chiba temporal window constraint (|t_det - t_exp| <= W)
    to prevent false matching of temporally distant chords and eliminate artificial timing caps.
    """
    m = len(reference_chords)
    n = len(played_chords)

    if m == 0:
        return []

    beat_sec = 60.0 / tempo_bpm
    max_window = window_sec if window_sec is not None else max(2.5, 4.0 * beat_sec)

    def expected_time_sec(chord_dict: dict[str, Any]) -> float:
        beat = float(chord_dict.get("beat", 1.0))
        return (beat - 1.0) * beat_sec

    # Needleman-Wunsch DP tables
    gap_ref = -3.0
    gap_played = -2.0

    dp = [[0.0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        dp[i][0] = dp[i - 1][0] + gap_ref
    for j in range(1, n + 1):
        dp[0][j] = dp[0][j - 1] + gap_played

    for i in range(1, m + 1):
        ref = reference_chords[i - 1]
        exp_time = expected_time_sec(ref)
        for j in range(1, n + 1):
            played = played_chords[j - 1]
            score, _, _ = _compute_match_score(ref, played, exp_time, max_window)

            match_score = dp[i - 1][j - 1] + score
            del_score = dp[i - 1][j] + gap_ref
            ins_score = dp[i][j - 1] + gap_played

            dp[i][j] = max(match_score, del_score, ins_score)

    # Backtracking to find optimal alignment
    i, j = m, n
    aligned_pairs: dict[int, int | None] = {}

    while i > 0 or j > 0:
        if i > 0 and j > 0:
            ref = reference_chords[i - 1]
            played = played_chords[j - 1]
            exp_time = expected_time_sec(ref)
            score, sim, time_diff = _compute_match_score(ref, played, exp_time, max_window)

            if abs(dp[i][j] - (dp[i - 1][j - 1] + score)) < 1e-6:
                if sim >= 0.5 and time_diff <= max_window:
                    aligned_pairs[i - 1] = j - 1
                else:
                    aligned_pairs[i - 1] = None
                i -= 1
                j -= 1
                continue

        if i > 0 and abs(dp[i][j] - (dp[i - 1][j] + gap_ref)) < 1e-6:
            aligned_pairs[i - 1] = None
            i -= 1
        else:
            j -= 1

    # Format output for each reference chord
    results: list[dict[str, Any]] = []
    for ref_idx, ref in enumerate(reference_chords):
        exp_time = expected_time_sec(ref)
        exp_pitches = [int(p) for p in ref.get("expected_pitches", [])]
        expected_chord_name = str(ref.get("name", ""))

        played_idx = aligned_pairs.get(ref_idx)
        if played_idx is not None:
            played = played_chords[played_idx]
            played_time = float(played.get("timestamp_sec", played.get("onset_time", 0.0)))
            det_pitches = [int(p) for p in played.get("pitches", [])]
            detected_chord_name = str(played.get("detected_name", "") or played.get("chord", "")) or expected_chord_name

            timing_error_ms = (played_time - exp_time) * 1000.0
            voicing = evaluate_chord_voicing(det_pitches, exp_pitches)

            results.append({
                "chord_index": ref_idx,
                "expected_chord": expected_chord_name,
                "detected_chord": detected_chord_name,
                "is_matched": True,
                "onset_error_ms": timing_error_ms,
                "voicing_completeness": voicing["voicing_completeness"],
                "missed_notes": voicing["missed_notes"],
                "extra_notes": voicing["extra_notes"],
            })
        else:
            results.append({
                "chord_index": ref_idx,
                "expected_chord": expected_chord_name,
                "detected_chord": "",
                "is_matched": False,
                "onset_error_ms": 0.0,
                "voicing_completeness": 0.0,
                "missed_notes": [midi_to_pitch_name(p) for p in sorted(exp_pitches)],
                "extra_notes": [],
            })

    return results
