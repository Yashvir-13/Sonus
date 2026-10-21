"""Deep domain module for evaluating musical practice takes and extracting habit patterns."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.adaptive.llm_coach import generate_coaching_report
from src.lib.adaptive.patterns import (
    detect_tempo_dragging_patterns,
    detect_tempo_rushing_patterns,
    detect_transition_lag_patterns,
    detect_voicing_drop_patterns,
)
from src.lib.adaptive.tracking import evaluate_drill_outcome
from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.decoder import PolyphonicAudioDecoder
from src.lib.exception import Unprocessable
from src.lib.practice.persistence import TakePersistenceAdapter
from src.models.practice import AdaptiveIntervention, Exercise, PracticeSession

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class TakeEvaluationResult:
    """Pure mathematical and pedagogical result of aligning and evaluating a practice take."""

    overall_accuracy: float
    avg_timing_error_ms: float
    voicing_score: float
    alignment: list[dict[str, Any]]
    chord_metrics: list[dict[str, Any]]
    detected_habits: list[dict[str, Any]]
    coaching_report: dict[str, Any]
    drill_outcome: dict[str, Any] | None

    def to_payload(self, session_id: str, state: str = "completed") -> dict[str, Any]:
        """Convert evaluation result into standard API response payload."""
        payload: dict[str, Any] = {
            "session_id": session_id,
            "state": state,
            "analysis_status": "complete",
            "overall_accuracy": round(self.overall_accuracy, 3),
            "avg_timing_error_ms": round(self.avg_timing_error_ms, 2),
            "voicing_score": round(self.voicing_score, 3),
            "chord_metrics": self.alignment,
            "coaching_report": self.coaching_report,
        }
        if self.drill_outcome is not None:
            payload["drill_outcome"] = self.drill_outcome
        return payload


class PracticeTakeEvaluator:
    """Pure in-memory domain evaluator for music practice takes.

    Contains ZERO database dependencies. Accepts in-memory chord events, exercise progression,
    and optional baseline metrics; performs dynamic programming alignment, habit detection,
    and outcome evaluation.
    """

    @classmethod
    def evaluate(
        cls,
        played_chords: list[dict[str, Any]],
        reference_chords: list[dict[str, Any]],
        tempo_bpm: int,
        session_id: str,
        instrument: str = "piano",
        baseline_metrics: list[dict[str, Any]] | None = None,
        drill_type: str | None = None,
    ) -> TakeEvaluationResult:
        """Run sequence alignment, compute timing/voicing scores, detect habits, and evaluate deltas."""
        # 1. Dynamic Programming Alignment
        alignment = align_chord_sequence(
            played_chords=played_chords,
            reference_chords=reference_chords,
            tempo_bpm=tempo_bpm,
        )

        matched = [m for m in alignment if m.get("is_matched")]
        overall_accuracy = (len(matched) / len(alignment)) if alignment else 0.0

        timing_errors = [abs(float(m.get("onset_error_ms", 0.0))) for m in matched]
        avg_timing_error = (sum(timing_errors) / len(timing_errors)) if timing_errors else 0.0

        voicing_scores = [float(m.get("voicing_completeness", 1.0)) for m in matched]
        voicing_score = (sum(voicing_scores) / len(voicing_scores)) if voicing_scores else 0.0

        # 2. Extract structured chord metrics
        chord_metric_records: list[dict[str, Any]] = []
        for m in alignment:
            metric_record = {
                "chord_index": int(m.get("chord_index", 0)),
                "expected_chord": str(m.get("expected_chord", "")),
                "detected_chord": str(m.get("detected_chord", "")),
                "is_matched": bool(m.get("is_matched", False)),
                "onset_error_ms": float(m.get("onset_error_ms", 0.0)),
                "voicing_completeness": float(m.get("voicing_completeness", 0.0)),
                "missed_notes": m.get("missed_notes", []),
                "extra_notes": m.get("extra_notes", []),
            }
            chord_metric_records.append(metric_record)

        # 3. Detect Habits
        detected_habits: list[dict[str, Any]] = []
        transitions: list[dict[str, Any]] = []
        for i in range(len(matched) - 1):
            transitions.append({
                "from_chord": matched[i]["expected_chord"],
                "to_chord": matched[i + 1]["expected_chord"],
                "transition_latency_ms": abs(matched[i + 1]["onset_error_ms"]),
            })
        detected_habits.extend(detect_transition_lag_patterns(transitions, threshold_ms=80.0, min_evidence=2))
        detected_habits.extend(detect_tempo_rushing_patterns(matched, rush_threshold_ms=-25.0, min_evidence=2))
        detected_habits.extend(detect_tempo_dragging_patterns(matched, drag_threshold_ms=30.0, min_evidence=2))
        detected_habits.extend(detect_voicing_drop_patterns(matched, min_evidence=1))

        # 4. Generate Grounded AI Coaching Feedback
        coaching_report = generate_coaching_report(
            session_id=session_id,
            chord_metrics=chord_metric_records,
            habits=detected_habits,
            instrument=instrument,
        )

        # 5. Longitudinal Outcome Tracking for Remedial Drill Interventions
        drill_outcome: dict[str, Any] | None = None
        if baseline_metrics and drill_type:
            follow_up_metrics = [
                {
                    "chord": cm["expected_chord"],
                    "from_chord": cm["expected_chord"],
                    "to_chord": cm["expected_chord"],
                    "transition_latency_ms": abs(cm["onset_error_ms"]),
                    "onset_error_ms": cm["onset_error_ms"],
                    "voicing_completeness": cm["voicing_completeness"],
                }
                for cm in chord_metric_records
            ]
            drill_outcome = evaluate_drill_outcome(
                baseline_metrics=baseline_metrics,
                follow_up_metrics=follow_up_metrics,
                drill_type=drill_type,
            )

        return TakeEvaluationResult(
            overall_accuracy=overall_accuracy,
            avg_timing_error_ms=avg_timing_error,
            voicing_score=voicing_score,
            alignment=alignment,
            chord_metrics=chord_metric_records,
            detected_habits=detected_habits,
            coaching_report=coaching_report,
            drill_outcome=drill_outcome,
        )


class TakeEvaluator:
    """Coordinator module wiring audio decoding, pure domain evaluation, and persistence at their seams."""

    @staticmethod
    def _extract_reference_chords(exercise: Exercise) -> list[dict[str, Any]]:
        """Safely parse reference chords from the exercise progression schema."""
        try:
            data = json.loads(exercise.progression_json)
            if isinstance(data, list):
                return [d for d in data if isinstance(d, dict)]
            if isinstance(data, dict):
                chords = data.get("chords", [])
                if isinstance(chords, list):
                    return [c for c in chords if isinstance(c, dict)]
        except Exception as exc:
            logger.error("Failed to parse exercise progression JSON (%s)", exc)
        return []

    @classmethod
    async def evaluate_take(
        cls,
        session: AsyncSession,
        practice_session: PracticeSession,
        exercise: Exercise,
        audio_bytes: bytes | None = None,
        played_chords: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Decode audio (if present), run pure evaluation, and persist results via persistence adapter."""
        if audio_bytes:
            final_played_chords = await PolyphonicAudioDecoder.decode_chords(audio_bytes)
        elif played_chords is not None:
            final_played_chords = played_chords
        else:
            raise Unprocessable("Take submission requires either audio bytes or a played_chords list.")

        reference_chords = cls._extract_reference_chords(exercise)

        # Retrieve baseline metrics if an intervention is being remediated
        intervention: AdaptiveIntervention | None = None
        baseline_metrics: list[dict[str, Any]] | None = None
        if practice_session.intervention_id:
            intervention = await session.get(AdaptiveIntervention, practice_session.intervention_id)
            if intervention and intervention.user_id == practice_session.user_id:
                baseline_metrics = await TakePersistenceAdapter.fetch_baseline_metrics(
                    session=session,
                    user_id=practice_session.user_id,
                    current_session_id=practice_session.id,
                )

        # Pure mathematical and pedagogical domain evaluation
        evaluation = PracticeTakeEvaluator.evaluate(
            played_chords=final_played_chords,
            reference_chords=reference_chords,
            tempo_bpm=practice_session.tempo_bpm,
            session_id=practice_session.id,
            instrument=exercise.instrument,
            baseline_metrics=baseline_metrics,
            drill_type=intervention.drill_type if intervention else None,
        )

        # Persist metrics, habit updates, and intervention status at the storage seam
        await TakePersistenceAdapter.persist_take(
            session=session,
            practice_session=practice_session,
            overall_accuracy=evaluation.overall_accuracy,
            avg_timing_error_ms=evaluation.avg_timing_error_ms,
            voicing_score=evaluation.voicing_score,
            chord_metric_records=evaluation.chord_metrics,
            detected_habits=evaluation.detected_habits,
            drill_outcome=evaluation.drill_outcome,
            intervention=intervention,
        )

        return evaluation.to_payload(practice_session.id, practice_session.state)
