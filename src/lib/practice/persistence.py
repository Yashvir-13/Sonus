"""Persistence adapter for practice take metrics, mastery, and habit patterns."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlmodel import col
from src.lib.adaptive.mastery import StudentMasteryEngine
from src.models.practice import (
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
    TransitionMastery,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

_DEFAULT_MISSED_TIMING_MS = 200.0
_TRANSITION_SUCCESS_TIMING_MS = 45.0
_TRANSITION_SUCCESS_VOICING = 0.80
_VOICING_DROP_THRESHOLD = 0.8
_TIMING_ISOLATION_THRESHOLD_MS = 80
_EWMA_PREV_WEIGHT = 0.7
_EWMA_CURR_WEIGHT = 0.3
_MAX_CUSUM_HISTORY = 20
_MIN_PAIR_LEN = 2


class TakePersistenceAdapter:
    """Storage-seam adapter for practice take evaluation persistence."""

    @classmethod
    async def fetch_baseline_metrics(
        cls,
        session: AsyncSession,
        user_id: str,
        current_session_id: str,
        limit: int = 30,
    ) -> list[dict[str, Any]]:
        """Fetch past session chord metrics ordered by take for baseline comparisons."""
        past_metrics_query = await session.execute(
            select(SessionChordMetric)
            .join(
                PracticeSession,
                col(SessionChordMetric.session_id) == col(PracticeSession.id),
            )
            .where(
                col(PracticeSession.user_id) == user_id,
                col(PracticeSession.id) != current_session_id,
            )
            .order_by(
                col(PracticeSession.created_at).desc(),
                col(SessionChordMetric.take_number).desc(),
                col(SessionChordMetric.chord_index).asc(),
            )
            .limit(limit),
        )
        rows = list(past_metrics_query.scalars().all())
        grouped_takes: dict[tuple[str, int], list[SessionChordMetric]] = defaultdict(
            list,
        )
        for row in rows:
            grouped_takes[(row.session_id, row.take_number)].append(row)

        metrics: list[dict[str, Any]] = []
        for take_rows in grouped_takes.values():
            take_rows.sort(key=lambda r: r.chord_index)
            for idx, pm in enumerate(take_rows):
                entry: dict[str, Any] = {
                    "chord": pm.expected_chord,
                    "onset_error_ms": pm.onset_error_ms,
                    "voicing_completeness": pm.voicing_completeness,
                }
                if idx > 0:
                    prev_pm = take_rows[idx - 1]
                    if prev_pm.expected_chord != pm.expected_chord:
                        entry["from_chord"] = prev_pm.expected_chord
                        entry["to_chord"] = pm.expected_chord
                        entry["transition_latency_ms"] = abs(pm.onset_error_ms)
                elif len(take_rows) == 1:
                    entry["transition_latency_ms"] = abs(pm.onset_error_ms)
                metrics.append(entry)
        return metrics

    @classmethod
    async def _fetch_transition_latency_history(
        cls,
        session: AsyncSession,
        user_id: str,
        instrument: str,
    ) -> dict[tuple[str, str], list[float]]:
        """Collect chronological transition latencies per ``(from_chord, to_chord)``."""
        hist_query = await session.execute(
            select(SessionChordMetric)
            .join(
                PracticeSession,
                col(SessionChordMetric.session_id) == col(PracticeSession.id),
            )
            .join(
                Exercise,
                col(PracticeSession.exercise_id) == col(Exercise.id),
            )
            .where(
                col(PracticeSession.user_id) == user_id,
                col(Exercise.instrument) == instrument,
            )
            .order_by(
                col(PracticeSession.created_at).asc(),
                col(PracticeSession.id).asc(),
                col(SessionChordMetric.take_number).asc(),
                col(SessionChordMetric.chord_index).asc(),
            ),
        )
        grouped: dict[tuple[str, int], list[SessionChordMetric]] = defaultdict(list)
        for row in hist_query.scalars().all():
            grouped[(row.session_id, row.take_number)].append(row)

        history_by_pair: dict[tuple[str, str], list[float]] = defaultdict(list)
        for take_rows in grouped.values():
            take_rows.sort(key=lambda r: r.chord_index)
            for i in range(len(take_rows) - 1):
                m_from = take_rows[i]
                m_to = take_rows[i + 1]
                if not m_from.is_matched and not m_to.is_matched:
                    continue
                latency = (
                    abs(float(m_to.onset_error_ms))
                    if m_to.is_matched
                    else _DEFAULT_MISSED_TIMING_MS
                )
                history_by_pair[(m_from.expected_chord, m_to.expected_chord)].append(
                    latency,
                )
        return history_by_pair

    _BANDIT_ARM_RULES: tuple[tuple[tuple[str, ...], str, str], ...] = (
        (("isolat",), "bandit_alpha_isolated", "bandit_beta_isolated"),
        (
            ("subdivision", "subdivid", "click", "pocket_groove"),
            "bandit_alpha_subdivision",
            "bandit_beta_subdivision",
        ),
        (("voic", "arpeggio"), "bandit_alpha_voicing", "bandit_beta_voicing"),
        (("ramp", "tempo"), "bandit_alpha_ramp", "bandit_beta_ramp"),
    )

    @classmethod
    def _apply_bandit_update(
        cls,
        mastery_row: TransitionMastery,
        *,
        active_drill: str | None,
        is_transition_success: bool,
        timing_err: float,
        voicing_comp: float,
    ) -> None:
        if active_drill:
            for keywords, alpha_attr, beta_attr in cls._BANDIT_ARM_RULES:
                if any(kw in active_drill for kw in keywords):
                    target = alpha_attr if is_transition_success else beta_attr
                    setattr(mastery_row, target, getattr(mastery_row, target) + 1.0)
                    return
            return

        if is_transition_success:
            mastery_row.bandit_alpha_isolated += 0.2
        elif voicing_comp < _VOICING_DROP_THRESHOLD:
            mastery_row.bandit_beta_voicing += 0.5
        elif abs(timing_err) > _TIMING_ISOLATION_THRESHOLD_MS:
            mastery_row.bandit_beta_isolated += 0.5
        else:
            mastery_row.bandit_beta_subdivision += 0.5

    @classmethod
    async def _update_transition_masteries(
        cls,
        session: AsyncSession,
        practice_session: PracticeSession,
        chord_metric_records: list[dict[str, Any]],
        latency_history_by_pair: dict[tuple[str, str], list[float]],
        *,
        norm_acc: float,
        instrument: str,
        active_drill: str | None,
    ) -> None:
        existing_masteries_query = await session.execute(
            select(TransitionMastery).where(
                col(TransitionMastery.user_id) == practice_session.user_id,
                col(TransitionMastery.instrument) == instrument,
            ),
        )
        transitions_cache: dict[tuple[str, str, str, str], TransitionMastery] = {
            (row.user_id, row.instrument, row.chord_from, row.chord_to): row
            for row in existing_masteries_query.scalars().all()
        }

        for i in range(len(chord_metric_records) - 1):
            m_from = chord_metric_records[i]
            m_to = chord_metric_records[i + 1]
            from_matched = bool(m_from.get("is_matched", False))
            to_matched = bool(m_to.get("is_matched", False))

            if not from_matched and not to_matched:
                continue

            from_chord = m_from["expected_chord"]
            to_chord = m_to["expected_chord"]
            cache_key = (practice_session.user_id, instrument, from_chord, to_chord)

            timing_err = (
                float(m_to["onset_error_ms"])
                if to_matched
                else _DEFAULT_MISSED_TIMING_MS
            )
            voicing_comp = float(m_to["voicing_completeness"]) if to_matched else 0.0

            mastery_row = transitions_cache.get(cache_key)
            if mastery_row is None:
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
                transitions_cache[cache_key] = mastery_row

            pair_key = (from_chord, to_chord)
            pair_history = latency_history_by_pair[pair_key][-_MAX_CUSUM_HISTORY:]
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
                latency_history=pair_history or None,
            )
            latency_history_by_pair[pair_key].append(abs(timing_err))

            mastery_row.p_known = round(assessment.posterior_mastery_probability, 4)
            mastery_row.is_mastered = assessment.is_mastered
            mastery_row.opportunities += 1

            curr_latency = abs(timing_err)
            if mastery_row.opportunities <= 1 or mastery_row.ewma_latency_ms == 0.0:
                mastery_row.ewma_latency_ms = round(curr_latency, 2)
            else:
                mastery_row.ewma_latency_ms = round(
                    _EWMA_PREV_WEIGHT * mastery_row.ewma_latency_ms
                    + _EWMA_CURR_WEIGHT * curr_latency,
                    2,
                )

            mastery_row.voicing_completeness = round(
                _EWMA_PREV_WEIGHT * mastery_row.voicing_completeness
                + _EWMA_CURR_WEIGHT * voicing_comp,
                3,
            )
            mastery_row.sm2_interval_days = assessment.next_review_interval_days
            mastery_row.sm2_ease_factor = round(assessment.ease_factor, 2)
            mastery_row.sm2_repetitions = assessment.repetition_count
            mastery_row.last_practiced_at = datetime.now(UTC)

            is_transition_success = (
                to_matched
                and abs(timing_err) <= _TRANSITION_SUCCESS_TIMING_MS
                and voicing_comp >= _TRANSITION_SUCCESS_VOICING
            )
            cls._apply_bandit_update(
                mastery_row,
                active_drill=active_drill,
                is_transition_success=is_transition_success,
                timing_err=timing_err,
                voicing_comp=voicing_comp,
            )
            session.add(mastery_row)

    @classmethod
    async def _upsert_habits(
        cls,
        session: AsyncSession,
        user_id: str,
        detected_habits: list[dict[str, Any]],
    ) -> None:
        existing_habits_query = await session.execute(
            select(HabitPattern).where(col(HabitPattern.user_id) == user_id),
        )
        habits_cache: dict[tuple[str, str], HabitPattern] = {
            (h.pattern_type, h.trigger_context): h
            for h in existing_habits_query.scalars().all()
        }
        for habit in detected_habits:
            p_type = habit["pattern_type"]
            ctx = habit["context"]
            h_key = (p_type, ctx)
            pattern_row = habits_cache.get(h_key)
            if pattern_row is not None:
                pattern_row.evidence_count += habit.get("evidence_count", 1)
                pattern_row.status = habit.get("status", "emerging")
                session.add(pattern_row)
            else:
                new_pat = HabitPattern(
                    id=f"pat_{uuid4().hex[:16]}",
                    user_id=user_id,
                    pattern_type=p_type,
                    trigger_context=ctx,
                    evidence_count=habit.get("evidence_count", 1),
                    status=habit.get("status", "emerging"),
                )
                session.add(new_pat)
                habits_cache[h_key] = new_pat

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
        """Persist take metrics, transition mastery, and habit patterns."""
        # 1. Fetch chronological transition history BEFORE staging the current take
        latency_history_by_pair: dict[tuple[str, str], list[float]] = {}
        if len(chord_metric_records) >= _MIN_PAIR_LEN:
            latency_history_by_pair = await cls._fetch_transition_latency_history(
                session=session,
                user_id=practice_session.user_id,
                instrument=instrument,
            )

        # 2. Determine next take_number for this session
        max_take_query = await session.execute(
            select(func.max(SessionChordMetric.take_number)).where(
                col(SessionChordMetric.session_id) == practice_session.id,
            ),
        )
        current_take_number = (max_take_query.scalar() or 0) + 1

        # 3. Persist new chord metric rows for this take in batch
        metrics_to_add: list[SessionChordMetric] = [
            SessionChordMetric(
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
            for m in chord_metric_records
        ]
        if metrics_to_add:
            session.add_all(metrics_to_add)

        # 4. Assess and update TransitionMastery for consecutive chord pairs
        norm_acc = (
            overall_accuracy / 100.0
            if overall_accuracy > 1.0
            else overall_accuracy
        )
        if len(chord_metric_records) >= _MIN_PAIR_LEN:
            active_drill = intervention.drill_type.lower() if intervention else None
            await cls._update_transition_masteries(
                session=session,
                practice_session=practice_session,
                chord_metric_records=chord_metric_records,
                latency_history_by_pair=latency_history_by_pair,
                norm_acc=norm_acc,
                instrument=instrument,
                active_drill=active_drill,
            )

        # 5. Upsert detected habit patterns in batch
        if detected_habits:
            await cls._upsert_habits(session, practice_session.user_id, detected_habits)

        # 6. Update intervention completion if applicable
        if intervention and drill_outcome and drill_outcome.get("completed"):
            intervention.completed = True
            val = drill_outcome.get("measured_improvement")
            if val is not None:
                intervention.measured_improvement = float(val)
            session.add(intervention)

        # 7. Update practice session state
        practice_session.state = "completed"
        practice_session.overall_accuracy = round(norm_acc, 3)
        practice_session.avg_timing_error_ms = round(avg_timing_error_ms, 2)
        practice_session.voicing_score = round(voicing_score, 3)
        session.add(practice_session)

        await session.commit()
        await session.refresh(practice_session)
