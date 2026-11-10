"""Unified cognitive modeling engine for student musical transition mastery."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from src.lib.adaptive.bandit import ThompsonSamplingBandit, UCB1Bandit
from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.knowledge_tracing import BKTParameters, BKTState, update_bkt
from src.lib.adaptive.patterns import detect_cusum_changepoint

from src.lib.adaptive.spaced_repetition import SM2Record, compute_musical_quality_grade, update_sm2
from src.lib.schemas.mastery import TransitionRecommendationItem
from src.models.practice import TransitionMastery

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class TransitionSkillAssessment:
    """Consolidated cognitive assessment for a specific musical transition."""

    chord_from: str
    chord_to: str
    transition_latency_ms: float
    prior_mastery_probability: float
    posterior_mastery_probability: float
    is_mastered: bool
    quality_grade: int
    next_review_interval_days: int
    ease_factor: float
    repetition_count: int
    is_changepoint: bool
    changepoint_direction: str | None


class StudentMasteryEngine:
    """Unified cognitive modeling engine for student musical practice.

    Encapsulates:
    1. Corbett & Anderson Bayesian Knowledge Tracing (BKT)
    2. SuperMemo SM-2 Spaced Repetition
    3. Page's Two-Sided CUSUM Change-Point Detection
    4. Multi-Armed Bandit (Thompson Sampling / UCB1) Reinforcement Learning
    """

    DEFAULT_DRILL_STRATEGIES: list[str] = [
        "isolated_transition",
        "subdivision_click",
        "voicing_arpeggio",
        "gradual_tempo_ramp",
    ]

    @classmethod
    def assess_transition(
        cls,
        chord_from: str,
        chord_to: str,
        timing_error_ms: float,
        voicing_completeness: float,
        overall_accuracy: float = 1.0,
        prior_mastery: float = 0.20,
        repetition_count: int = 0,
        ease_factor: float = 2.5,
        interval_days: int = 1,
        latency_history: list[float] | None = None,
    ) -> TransitionSkillAssessment:
        """Evaluate a transition take across BKT, SM-2, and CUSUM in a single call."""
        skill_id = f"{chord_from}->{chord_to}"
        is_success = abs(timing_error_ms) <= 45.0 and voicing_completeness >= 0.80

        # 1. Bayesian Knowledge Tracing update
        current_bkt = BKTState(
            skill_id=skill_id,
            p_known=prior_mastery,
            opportunities=repetition_count,
            is_mastered=prior_mastery >= 0.95,
        )
        updated_bkt = update_bkt(current_bkt, is_correct=is_success)

        # 2. SuperMemo SM-2 Spaced Repetition update
        grade = compute_musical_quality_grade(
            overall_accuracy=overall_accuracy,
            avg_timing_error_ms=timing_error_ms,
            voicing_completeness=voicing_completeness,
        )
        current_sm2 = SM2Record(
            repetitions=repetition_count,
            interval_days=interval_days,
            ease_factor=ease_factor,
        )
        updated_sm2 = update_sm2(current_sm2, grade=grade)

        # 3. CUSUM Change-Point Detection across latency history
        is_cp = False
        cp_direction: str | None = None
        if latency_history and len(latency_history) >= 4:
            history_with_current = [*latency_history, abs(timing_error_ms)]
            cp_result = detect_cusum_changepoint(history_with_current)
            if cp_result.get("detected"):
                is_cp = True
                cp_direction = cp_result.get("direction")


        return TransitionSkillAssessment(
            chord_from=chord_from,
            chord_to=chord_to,
            transition_latency_ms=abs(timing_error_ms),
            prior_mastery_probability=current_bkt.p_known,
            posterior_mastery_probability=updated_bkt.p_known,
            is_mastered=updated_bkt.is_mastered,
            quality_grade=grade,
            next_review_interval_days=updated_sm2.interval_days,
            ease_factor=updated_sm2.ease_factor,
            repetition_count=updated_sm2.repetitions,
            is_changepoint=is_cp,
            changepoint_direction=cp_direction,
        )

    @classmethod
    def select_remedial_strategy(
        cls,
        strategies: list[str] | None = None,
        strategy_history: dict[str, tuple[int, int]] | None = None,
        policy: str = "thompson_sampling",
    ) -> str:
        """Select optimal remedial drill policy via Multi-Armed Bandit exploration/exploitation."""
        candidate_strategies = strategies or cls.DEFAULT_DRILL_STRATEGIES

        if policy == "ucb1":
            bandit_ucb = UCB1Bandit(arms=candidate_strategies)
            if strategy_history:
                for arm_name, (wins, losses) in strategy_history.items():
                    total_pulls = wins + losses
                    if total_pulls > 0 and arm_name in bandit_ucb.arms:
                        arm = bandit_ucb.arms[arm_name]
                        arm.pulls = total_pulls
                        arm.total_reward = float(wins)
                        bandit_ucb.total_pulls += total_pulls
            return bandit_ucb.select_arm()

        # Default: Thompson Sampling
        bandit_ts = ThompsonSamplingBandit(arms=candidate_strategies)
        if strategy_history:
            for arm_name, (wins, losses) in strategy_history.items():
                if arm_name in bandit_ts.arms:
                    arm = bandit_ts.arms[arm_name]
                    arm.alpha += wins
                    arm.beta += losses
                    arm.pulls += (wins + losses)
                    arm.total_reward += wins
        return bandit_ts.select_arm()

    @classmethod
    def generate_adaptive_drill_plan(
        cls,
        habit_pattern: dict[str, Any],
        user_id: str,
        reference_tempo: int,
        strategy_history: dict[str, tuple[int, int]] | None = None,
        policy: str = "thompson_sampling",
    ) -> dict[str, Any]:
        """Generate tailored remedial intervention using Multi-Armed Bandit strategy selection."""
        selected_strategy = cls.select_remedial_strategy(
            strategy_history=strategy_history,
            policy=policy,
        )

        drill_data = generate_intervention(
            pattern=habit_pattern,
            user_id=user_id,
            reference_tempo=reference_tempo,
        )
        drill_data["selected_strategy"] = selected_strategy
        return drill_data

    @classmethod
    def rank_transition_prescriptions(
        cls,
        records: list[TransitionMastery],
        top_k: int | None = None,
    ) -> list[TransitionRecommendationItem]:
        """Rank user transition mastery states into pedagogical remedial prescriptions."""
        scored_items: list[tuple[float, TransitionRecommendationItem]] = []
        now = datetime.now(UTC)

        for t in records:
            learning_gap = max(0.0, 1.0 - t.p_known)
            last_practiced = (
                t.last_practiced_at
                if t.last_practiced_at.tzinfo is not None
                else t.last_practiced_at.replace(tzinfo=UTC)
            )
            days_since = max(0, (now - last_practiced).days)
            overdue_ratio = min(2.0, days_since / max(1, t.sm2_interval_days))
            latency_severity = min(1.0, abs(t.ewma_latency_ms) / 160.0)
            voicing_deficit = max(0.0, 1.0 - t.voicing_completeness)

            priority_score = round(
                learning_gap * 45.0
                + overdue_ratio * 12.5
                + (latency_severity * 0.65 + voicing_deficit * 0.35) * 30.0,
                1,
            )

            arms = [
                ("isolated_transition", t.bandit_alpha_isolated, t.bandit_beta_isolated),
                ("subdivision_click", t.bandit_alpha_subdivision, t.bandit_beta_subdivision),
                ("voicing_arpeggio", t.bandit_alpha_voicing, t.bandit_beta_voicing),
                ("gradual_tempo_ramp", t.bandit_alpha_ramp, t.bandit_beta_ramp),
            ]

            best_arm = "isolated_transition"
            best_score = -1.0
            best_alpha = 1.0
            best_beta = 1.0
            for arm_name, alpha, beta in arms:
                mean_r = alpha / (alpha + beta)
                variance = (alpha * beta) / (((alpha + beta) ** 2) * (alpha + beta + 1))
                exploration = 1.25 * (variance ** 0.5)

                boost = 0.0
                if arm_name == "voicing_arpeggio" and t.voicing_completeness < 0.8:
                    boost = 0.14
                elif arm_name == "isolated_transition" and t.ewma_latency_ms >= 100:
                    boost = 0.12
                elif arm_name == "subdivision_click" and 45 <= t.ewma_latency_ms < 100:
                    boost = 0.08
                elif arm_name == "gradual_tempo_ramp" and t.p_known >= 0.72:
                    boost = 0.15

                total_score = mean_r + exploration + boost
                if total_score > best_score:
                    best_score = total_score
                    best_arm = arm_name
                    best_alpha = alpha
                    best_beta = beta

            target_bpm = 80 if t.instrument.lower() == "guitar" else 120
            iso_bpm = max(40, round(target_bpm * 0.7))

            urgency_label = (
                f"Overdue ({days_since}d / {t.sm2_interval_days}d)"
                if days_since >= t.sm2_interval_days
                else f"Interval {t.sm2_interval_days}d"
            )
            math_breakdown = (
                f"BKT P(L_t) = {round(t.p_known * 100, 1)}% · SM-2 EF {round(t.sm2_ease_factor, 2)} "
                f"({urgency_label}) · Bandit Beta(α={best_alpha}, β={best_beta})"
            )

            item = TransitionRecommendationItem(
                id=f"rec_{t.id}",
                rank=0,
                transition_label=f"{t.chord_from} → {t.chord_to}",
                chord_from=t.chord_from,
                chord_to=t.chord_to,
                instrument=t.instrument,
                priority_score=priority_score,
                p_known=round(t.p_known, 4),
                learning_gap_pct=round(learning_gap * 100, 1),
                ewma_latency_ms=round(t.ewma_latency_ms, 1),
                voicing_completeness_pct=round(t.voicing_completeness * 100, 1),
                selected_drill_strategy=best_arm,
                recommended_bpm=iso_bpm,
                mathematical_breakdown=math_breakdown,
            )
            scored_items.append((priority_score, item))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        slice_items = scored_items if top_k is None else scored_items[:top_k]
        ranked_recommendations: list[TransitionRecommendationItem] = []
        for rank_idx, (_, item) in enumerate(slice_items, start=1):
            item.rank = rank_idx
            ranked_recommendations.append(item)

        return ranked_recommendations

