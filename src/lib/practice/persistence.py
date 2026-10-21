"""Persistence adapter for recording musical practice take metrics and habit patterns."""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from src.models.practice import (
    AdaptiveIntervention,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
)


class TakePersistenceAdapter:
    """Database persistence adapter at the storage seam for practice take evaluation results."""

    @classmethod
    async def fetch_baseline_metrics(
        cls,
        session: AsyncSession,
        user_id: str,
        current_session_id: str,
        limit: int = 30,
    ) -> list[dict[str, Any]]:
        """Fetch past session chord metrics for longitudinal baseline comparison."""
        past_metrics_query = await session.execute(
            select(SessionChordMetric)
            .join(PracticeSession, col(SessionChordMetric.session_id) == col(PracticeSession.id))
            .where(
                col(PracticeSession.user_id) == user_id,
                col(PracticeSession.id) != current_session_id,
            )
            .order_by(col(PracticeSession.created_at).desc())
            .limit(limit)
        )
        return [
            {
                "chord": pm.expected_chord,
                "from_chord": pm.expected_chord,
                "to_chord": pm.expected_chord,
                "transition_latency_ms": abs(pm.onset_error_ms),
                "onset_error_ms": pm.onset_error_ms,
                "voicing_completeness": pm.voicing_completeness,
            }
            for pm in past_metrics_query.scalars().all()
        ]

    @classmethod
    async def persist_take(
        cls,
        session: AsyncSession,
        practice_session: PracticeSession,
        overall_accuracy: float,
        avg_timing_error_ms: float,
        voicing_score: float,
        chord_metric_records: list[dict[str, Any]],
        detected_habits: list[dict[str, Any]],
        drill_outcome: dict[str, Any] | None = None,
        intervention: AdaptiveIntervention | None = None,
    ) -> None:
        """Persist chord metrics, upsert habit patterns, update intervention, and commit session state."""
        # 1. Clear any prior metrics for this session (idempotent re-takes)
        existing_metrics = await session.execute(
            select(SessionChordMetric).where(col(SessionChordMetric.session_id) == practice_session.id)
        )
        for row in existing_metrics.scalars().all():
            await session.delete(row)

        # 2. Persist new chord metric rows
        for m in chord_metric_records:
            metric_db = SessionChordMetric(
                id=f"metric_{uuid4().hex[:16]}",
                session_id=practice_session.id,
                chord_index=m["chord_index"],
                expected_chord=m["expected_chord"],
                detected_chord=m["detected_chord"],
                is_matched=m["is_matched"],
                onset_error_ms=m["onset_error_ms"],
                voicing_completeness=m["voicing_completeness"],
                missed_notes_json=json.dumps(m.get("missed_notes", [])),
                extra_notes_json=json.dumps(m.get("extra_notes", [])),
            )
            session.add(metric_db)

        # 3. Upsert detected habit patterns
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

        # 4. Update intervention completion if applicable
        if intervention and drill_outcome and drill_outcome.get("completed"):
            intervention.completed = True
            val = drill_outcome.get("measured_improvement")
            if val is not None:
                intervention.measured_improvement = float(val)
            session.add(intervention)

        # 5. Update practice session state
        practice_session.state = "completed"
        practice_session.overall_accuracy = round(overall_accuracy, 3)
        practice_session.avg_timing_error_ms = round(avg_timing_error_ms, 2)
        practice_session.voicing_score = round(voicing_score, 3)
        session.add(practice_session)

        await session.commit()
        await session.refresh(practice_session)
