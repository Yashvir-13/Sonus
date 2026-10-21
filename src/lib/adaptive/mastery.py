"""Unified cognitive modeling engine for student musical transition mastery."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from src.lib.adaptive.bandit import ThompsonSamplingBandit, UCB1Bandit
from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.knowledge_tracing import BKTParameters, BKTState, update_bkt
from src.lib.adaptive.patterns import detect_cusum_changepoint

from src.lib.adaptive.spaced_repetition import SM2Record, compute_musical_quality_grade, update_sm2

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
