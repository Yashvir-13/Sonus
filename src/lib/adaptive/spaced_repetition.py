"""SuperMemo SM-2 Spaced Repetition engine adapted for musical motor performance.

Maps continuous timing latencies and harmonic voicing completeness into objective
performance grades (q in 0..5) to compute dynamic Ease Factors (EF) and review intervals.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class SM2Record:
    """Represents a skill's SM-2 spaced repetition state."""

    repetitions: int
    interval_days: int
    ease_factor: float


def compute_musical_quality_grade(
    overall_accuracy: float,
    avg_timing_error_ms: float,
    voicing_completeness: float,
) -> int:
    """Convert continuous musical performance metrics into an SM-2 grade (0..5).

    Pedagogical rubric:
    - 5: Perfect recall & flawless mechanical execution (< 25ms error, > 95% voicing & acc)
    - 4: Correct execution after minor hesitation (< 45ms error, > 85% acc)
    - 3: Serious difficulty / hesitation, but essentially correct (< 80ms error, > 70% acc)
    - 2: Severe timing hesitation or dropped essential chord voicing (< 130ms error)
    - 1: Breakdown on transition / wrong chords played
    - 0: Complete failure / blackout
    """
    abs_timing = abs(avg_timing_error_ms)

    if overall_accuracy >= 0.95 and abs_timing <= 25.0 and voicing_completeness >= 0.95:
        return 5
    if overall_accuracy >= 0.85 and abs_timing <= 45.0 and voicing_completeness >= 0.80:
        return 4
    if overall_accuracy >= 0.70 and abs_timing <= 80.0 and voicing_completeness >= 0.65:
        return 3
    if overall_accuracy >= 0.50 and abs_timing <= 130.0:
        return 2
    if overall_accuracy >= 0.25:
        return 1
    return 0


def update_sm2(
    current: SM2Record,
    grade: int,
) -> SM2Record:
    """Calculate the next SM-2 interval and Ease Factor given performance grade q (0..5).

    EF' = max(1.3, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    """
    q = max(0, min(5, grade))

    # Calculate new Ease Factor
    new_ef = current.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = max(1.3, round(new_ef, 3))

    if q >= 3:
        # Successful recall / repetition
        if current.repetitions == 0:
            new_interval = 1
        elif current.repetitions == 1:
            new_interval = 6
        else:
            new_interval = max(1, int(round(current.interval_days * new_ef)))

        new_reps = current.repetitions + 1
    else:
        # Failed repetition: reset review interval to day 1, retain learned EF with penalty
        new_reps = 0
        new_interval = 1

    return SM2Record(
        repetitions=new_reps,
        interval_days=new_interval,
        ease_factor=new_ef,
    )
