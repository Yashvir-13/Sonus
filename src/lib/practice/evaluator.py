"""Deep domain module for processing and evaluating musical practice takes."""

from __future__ import annotations

import json
import logging
import tempfile
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from src.lib.adaptive.llm_coach import generate_coaching_report
from src.lib.adaptive.patterns import (
    detect_tempo_rushing_patterns,
    detect_transition_lag_patterns,
    detect_voicing_drop_patterns,
)
from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.transcription import transcribe_polyphonic_wav
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.exception import Unprocessable
from src.models.practice import Exercise, HabitPattern, PracticeSession, SessionChordMetric

logger = logging.getLogger(__name__)


class TakeEvaluator:
    """Encapsulates the end-to-end take evaluation, alignment, metrics, and habit detection pipeline."""

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
        """Process audio or pre-detected chord events, run alignment, persist metrics, and analyze habits."""
        final_played_chords: list[dict[str, Any]] = []

        if audio_bytes:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = Path(tmp.name)
                tmp_path.write_bytes(audio_bytes)

            try:
                notes = transcribe_polyphonic_wav(tmp_path)
                final_played_chords = cluster_chords_from_notes(notes)
            finally:
                if tmp_path.exists():
                    tmp_path.unlink()
        elif played_chords is not None:
            final_played_chords = played_chords
        else:
            raise Unprocessable("Take submission requires either audio bytes or a played_chords list.")

        reference_chords = cls._extract_reference_chords(exercise)

        # 1. Dynamic Programming Alignment
        alignment = align_chord_sequence(
            played_chords=final_played_chords,
            reference_chords=reference_chords,
            tempo_bpm=practice_session.tempo_bpm,
        )

        matched = [m for m in alignment if m.get("is_matched")]
        overall_accuracy = (len(matched) / len(alignment)) if alignment else 0.0

        timing_errors = [abs(float(m.get("onset_error_ms", 0.0))) for m in matched]
        avg_timing_error = (sum(timing_errors) / len(timing_errors)) if timing_errors else 0.0

        voicing_scores = [float(m.get("voicing_completeness", 1.0)) for m in matched]
        voicing_score = (sum(voicing_scores) / len(voicing_scores)) if voicing_scores else 0.0

        # 2. Clear existing metrics for re-takes on the same session
        existing_metrics = await session.execute(
            select(SessionChordMetric).where(col(SessionChordMetric.session_id) == practice_session.id)
        )
        for row in existing_metrics.scalars().all():
            await session.delete(row)

        # 3. Persist new chord metrics
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

            metric_db = SessionChordMetric(
                id=f"metric_{uuid4().hex[:16]}",
                session_id=practice_session.id,
                chord_index=metric_record["chord_index"],
                expected_chord=metric_record["expected_chord"],
                detected_chord=metric_record["detected_chord"],
                is_matched=metric_record["is_matched"],
                onset_error_ms=metric_record["onset_error_ms"],
                voicing_completeness=metric_record["voicing_completeness"],
                missed_notes_json=json.dumps(metric_record["missed_notes"]),
                extra_notes_json=json.dumps(metric_record["extra_notes"]),
            )
            session.add(metric_db)

        # 4. Detect Habits & Interventions
        detected_habits: list[dict[str, Any]] = []
        # Check transition latencies
        transitions: list[dict[str, Any]] = []
        for i in range(len(matched) - 1):
            transitions.append({
                "from_chord": matched[i]["expected_chord"],
                "to_chord": matched[i + 1]["expected_chord"],
                "transition_latency_ms": abs(matched[i + 1]["onset_error_ms"]),
            })
        detected_habits.extend(detect_transition_lag_patterns(transitions, threshold_ms=80.0, min_evidence=2))
        detected_habits.extend(detect_tempo_rushing_patterns(matched, rush_threshold_ms=-25.0, min_evidence=2))
        detected_habits.extend(detect_voicing_drop_patterns(matched, min_evidence=1))

        # Persist detected habit patterns if new
        for habit in detected_habits:
            p_type = habit["pattern_type"]
            ctx = habit["context"]
            existing_p = await session.execute(
                select(HabitPattern).where(
                    col(HabitPattern.user_id) == practice_session.user_id,
                    col(HabitPattern.pattern_type) == p_type,
                    col(HabitPattern.trigger_context) == ctx,
                )
            )
            pattern_row = existing_p.scalar_one_or_none()
            if pattern_row:
                pattern_row.evidence_count += habit.get("evidence_count", 1)
                pattern_row.status = habit.get("status", "emerging")
                session.add(pattern_row)
            else:
                new_pat = HabitPattern(
                    id=f"pat_{uuid4().hex[:16]}",
                    user_id=practice_session.user_id,
                    pattern_type=p_type,
                    trigger_context=ctx,
                    evidence_count=habit.get("evidence_count", 1),
                    status=habit.get("status", "emerging"),
                )
                session.add(new_pat)

        # 5. Generate Grounded AI Coaching Feedback
        coaching_report = generate_coaching_report(
            session_id=practice_session.id,
            chord_metrics=chord_metric_records,
            habits=detected_habits,
            instrument=exercise.instrument,
        )

        # 6. Update Practice Session State
        practice_session.state = "completed"
        practice_session.overall_accuracy = round(overall_accuracy, 3)
        practice_session.avg_timing_error_ms = round(avg_timing_error, 2)
        practice_session.voicing_score = round(voicing_score, 3)
        session.add(practice_session)

        await session.commit()
        await session.refresh(practice_session)

        return {
            "session_id": practice_session.id,
            "state": practice_session.state,
            "analysis_status": "complete",
            "overall_accuracy": practice_session.overall_accuracy,
            "avg_timing_error_ms": practice_session.avg_timing_error_ms,
            "voicing_score": practice_session.voicing_score,
            "chord_metrics": alignment,
            "coaching_report": coaching_report,
        }
