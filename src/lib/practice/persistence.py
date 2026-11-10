"""Persistence adapter for recording musical practice take metrics and habit patterns."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from src.lib.adaptive.mastery import StudentMasteryEngine
from src.models.practice import (
    AdaptiveIntervention,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
    TransitionMastery,
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
        instrument: str = "guitar",
    ) -> None:
        """Persist chord metrics versioned by take_number, assess transition mastery, upsert habit patterns, and commit session state."""
        # 1. Determine next take_number for this session (preserving longitudinal history)
        max_take_query = await session.execute(
            select(func.max(SessionChordMetric.take_number)).where(
                col(SessionChordMetric.session_id) == practice_session.id
            )
        )
        max_take = max_take_query.scalar()
        current_take_number = (max_take or 0) + 1

        # 2. Persist new chord metric rows for this take with tempo_bpm preserved
        for m in chord_metric_records:
            metric_db = SessionChordMetric(
                id=f"metric_{uuid4().hex[:16]}",
                session_id=practice_session.id,
                take_number=current_take_number,
                tempo_bpm=practice_session.tempo_bpm,
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

        # 3. Assess and update student TransitionMastery for each consecutive chord transition
        norm_acc = overall_accuracy / 100.0 if overall_accuracy > 1.0 else overall_accuracy
        if len(chord_metric_records) >= 2:
            transitions_cache: dict[tuple[str, str, str, str], TransitionMastery] = {}
            for i in range(len(chord_metric_records) - 1):
                m_from = chord_metric_records[i]
                m_to = chord_metric_records[i + 1]
                from_matched = bool(m_from.get("is_matched", False))
                to_matched = bool(m_to.get("is_matched", False))

                # If neither chord was played, the transition was never reached in this take
                if not from_matched and not to_matched:
                    continue

                from_chord = m_from["expected_chord"]
                to_chord = m_to["expected_chord"]
                cache_key = (practice_session.user_id, instrument, from_chord, to_chord)

                timing_err = float(m_to["onset_error_ms"]) if to_matched else 200.0
                voicing_comp = float(m_to["voicing_completeness"]) if to_matched else 0.0

                mastery_row: TransitionMastery
                if cache_key in transitions_cache:
                    mastery_row = transitions_cache[cache_key]
                else:
                    mastery_query = await session.execute(
                        select(TransitionMastery).where(
                            col(TransitionMastery.user_id) == practice_session.user_id,
                            col(TransitionMastery.instrument) == instrument,
                            col(TransitionMastery.chord_from) == from_chord,
                            col(TransitionMastery.chord_to) == to_chord,
                        )
                    )
                    existing_row = mastery_query.scalar_one_or_none()
                    if existing_row is None:
                        mastery_row = TransitionMastery(
                            id=f"tm_{uuid4().hex[:16]}",
                            user_id=practice_session.user_id,
                            chord_from=from_chord,
                            chord_to=to_chord,
                            instrument=instrument,
                            p_known=0.20,
                            is_mastered=False,
                            opportunities=0,
                            ewma_latency_ms=abs(timing_err),
                            voicing_completeness=voicing_comp,
                            sm2_interval_days=1,
                            sm2_ease_factor=2.5,
                            sm2_repetitions=0,
                            last_practiced_at=datetime.now(UTC),
                        )
                        session.add(mastery_row)
                    else:
                        mastery_row = existing_row
                    transitions_cache[cache_key] = mastery_row

                # Assess transition cognitive mastery (BKT, SM-2, CUSUM)
                assessment = StudentMasteryEngine.assess_transition(
                    chord_from=from_chord,
                    chord_to=to_chord,
                    timing_error_ms=timing_err,
                    voicing_completeness=voicing_comp,
                    overall_accuracy=norm_acc,
                    prior_mastery=mastery_row.p_known,
                    repetition_count=mastery_row.sm2_repetitions,
                    ease_factor=mastery_row.sm2_ease_factor,
                    interval_days=mastery_row.sm2_interval_days,
                )

                mastery_row.p_known = round(assessment.posterior_mastery_probability, 4)
                mastery_row.is_mastered = assessment.is_mastered
                mastery_row.opportunities += 1

                curr_latency = abs(timing_err)
                if mastery_row.opportunities <= 1 or mastery_row.ewma_latency_ms == 0.0:
                    mastery_row.ewma_latency_ms = round(curr_latency, 2)
                else:
                    mastery_row.ewma_latency_ms = round(
                        0.7 * mastery_row.ewma_latency_ms + 0.3 * curr_latency, 2
                    )

                mastery_row.voicing_completeness = round(
                    0.7 * mastery_row.voicing_completeness + 0.3 * voicing_comp, 3
                )
                mastery_row.sm2_interval_days = assessment.next_review_interval_days
                mastery_row.sm2_ease_factor = round(assessment.ease_factor, 2)
                mastery_row.sm2_repetitions = assessment.repetition_count
                mastery_row.last_practiced_at = datetime.now(UTC)

                # Update Multi-Armed Bandit posteriors based on transition success and active intervention
                is_transition_success = to_matched and abs(timing_err) <= 45.0 and voicing_comp >= 0.80
                active_drill = intervention.drill_type.lower() if intervention else None
                if active_drill:
                    if "isolat" in active_drill:
                        if is_transition_success:
                            mastery_row.bandit_alpha_isolated += 1.0
                        else:
                            mastery_row.bandit_beta_isolated += 1.0
                    elif "subdivid" in active_drill or "click" in active_drill:
                        if is_transition_success:
                            mastery_row.bandit_alpha_subdivision += 1.0
                        else:
                            mastery_row.bandit_beta_subdivision += 1.0
                    elif "voic" in active_drill or "arpeggio" in active_drill:
                        if is_transition_success:
                            mastery_row.bandit_alpha_voicing += 1.0
                        else:
                            mastery_row.bandit_beta_voicing += 1.0
                    elif "ramp" in active_drill or "tempo" in active_drill:
                        if is_transition_success:
                            mastery_row.bandit_alpha_ramp += 1.0
                        else:
                            mastery_row.bandit_beta_ramp += 1.0
                else:
                    if is_transition_success:
                        mastery_row.bandit_alpha_isolated += 0.2
                    else:
                        if voicing_comp < 0.8:
                            mastery_row.bandit_beta_voicing += 0.5
                        elif abs(timing_err) > 80:
                            mastery_row.bandit_beta_isolated += 0.5
                        else:
                            mastery_row.bandit_beta_subdivision += 0.5

                session.add(mastery_row)

        # 4. Upsert detected habit patterns
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

        # 5. Update intervention completion if applicable
        if intervention and drill_outcome and drill_outcome.get("completed"):
            intervention.completed = True
            val = drill_outcome.get("measured_improvement")
            if val is not None:
                intervention.measured_improvement = float(val)
            session.add(intervention)

        # 6. Update practice session state
        practice_session.state = "completed"
        practice_session.overall_accuracy = round(norm_acc, 3)
        practice_session.avg_timing_error_ms = round(avg_timing_error_ms, 2)
        practice_session.voicing_score = round(voicing_score, 3)
        session.add(practice_session)

        await session.commit()
        await session.refresh(practice_session)
