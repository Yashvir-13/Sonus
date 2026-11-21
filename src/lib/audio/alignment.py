from __future__ import annotations

from typing import Any

from src.lib.audio.voicing import evaluate_chord_voicing, midi_to_pitch_name
from src.lib.music.chords import chord_similarity, parse_chord_notes


_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def _compute_chord_similarity(
    ref: dict[str, Any],
    played: dict[str, Any],
) -> float:
    """Compute harmonic and pitch-class similarity between reference and played chords.

    Recognizes exact chord symbols, semantic chord qualities, and pitch-class recall
    even in the presence of acoustic guitar string resonance or microphone overtone noise.
    """
    ref_name = str(ref.get("name", "") or ref.get("chord", "")).strip()
    det_name = str(played.get("detected_name", "") or played.get("chord", "")).strip()

    # 1. Exact chord symbol match (e.g. 'C' == 'C', 'Am' == 'Am')
    if ref_name and det_name and ref_name.lower() == det_name.lower():
        return 1.0

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

    # 2. Chord symbol semantic similarity
    chord_name_sim = 0.0
    if ref_name and det_name:
        try:
            ref_pcs = parse_chord_notes(ref_name)
            det_pcs = parse_chord_notes(det_name)
            chord_name_sim = chord_similarity(ref_pcs, det_pcs)
        except Exception:
            pass

    # 3. Raw note overlap
    raw_sim = chord_similarity(exp_notes, det_notes)

    # 4. Harmonic recall (are all or most reference chord tones present in detected notes?)
    recall_score = 0.0
    if exp_notes and det_notes:
        exp_pcs_set = {n % 12 for n in exp_notes}
        det_pcs_set = {n % 12 for n in det_notes}
        overlap = len(exp_pcs_set & det_pcs_set)
        recall = overlap / len(exp_pcs_set) if exp_pcs_set else 0.0
        if recall == 1.0:
            recall_score = 0.90
        elif recall >= 0.66:
            recall_score = 0.65

    return max(raw_sim, chord_name_sim, recall_score)


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
    lead_in_sec: float = 0.0,
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

    # Apply lead-in / count-in offset correction
    offset_sec = float(lead_in_sec)
    if offset_sec <= 0.0 and played_chords and reference_chords:
        # Auto-detect standard 4-beat or 3-beat count-in delay if performance starts late
        first_played_t = float(played_chords[0].get("timestamp_sec", 0.0))
        sim_first = _compute_chord_similarity(reference_chords[0], played_chords[0])
        approx_4beat_count_in = 4.0 * beat_sec
        approx_3beat_count_in = 3.0 * beat_sec
        if sim_first >= 0.6 and first_played_t >= 1.5 and first_played_t >= 2.0 * beat_sec:
            if abs(first_played_t - approx_4beat_count_in) < (1.0 * beat_sec):
                offset_sec = first_played_t
            elif abs(first_played_t - approx_3beat_count_in) < (1.0 * beat_sec):
                offset_sec = first_played_t

    if offset_sec > 0.0:
        norm_played: list[dict[str, Any]] = []
        for c in played_chords:
            t = float(c.get("timestamp_sec", c.get("onset_time", 0.0)))
            if t >= (offset_sec - 0.25):
                norm_played.append({
                    **c,
                    "timestamp_sec": max(0.0, t - offset_sec),
                })
        played_chords = norm_played
        n = len(played_chords)

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
        expected_chord_name = str(ref.get("name", "") or ref.get("chord", ""))

        played_idx = aligned_pairs.get(ref_idx)
        if played_idx is not None:
            played = played_chords[played_idx]
            played_time = float(played.get("timestamp_sec", played.get("onset_time", 0.0)))
            det_pitches = [int(p) for p in played.get("pitches", [])]
            detected_chord_name = str(played.get("detected_name", "") or played.get("chord", "")) or expected_chord_name

            timing_error_ms = (played_time - exp_time) * 1000.0
            voicing = evaluate_chord_voicing(det_pitches, exp_pitches, expected_chord_name)

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
            missed_names = [midi_to_pitch_name(p) for p in sorted(exp_pitches)]
            if not missed_names and expected_chord_name:
                try:
                    missed_names = [_NOTE_NAMES[pc] for pc in sorted(parse_chord_notes(expected_chord_name))]
                except Exception:
                    missed_names = []
            results.append({
                "chord_index": ref_idx,
                "expected_chord": expected_chord_name,
                "detected_chord": "",
                "is_matched": False,
                "onset_error_ms": 0.0,
                "voicing_completeness": 0.0,
                "missed_notes": missed_names,
                "extra_notes": [],
            })

    return results

    return results
