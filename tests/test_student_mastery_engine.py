"""Unit tests for the deep StudentMasteryEngine module."""

from __future__ import annotations

from src.lib.adaptive.mastery import StudentMasteryEngine, TransitionSkillAssessment


def test_assess_transition_high_performance() -> None:
    """Verify that a high-accuracy transition elevates BKT mastery and schedules review."""
    assessment = StudentMasteryEngine.assess_transition(
        chord_from="C",
        chord_to="G",
        timing_error_ms=12.0,
        voicing_completeness=1.0,
        prior_mastery=0.30,
        repetition_count=1,
        ease_factor=2.5,
        interval_days=1,
        latency_history=[15.0, 18.0, 14.0, 12.0],
    )

    assert isinstance(assessment, TransitionSkillAssessment)
    assert assessment.chord_from == "C"
    assert assessment.chord_to == "G"
    assert assessment.posterior_mastery_probability > 0.30
    assert assessment.next_review_interval_days >= 6
    assert assessment.repetition_count == 2
    assert assessment.ease_factor >= 2.5


def test_select_remedial_strategy_via_bandit() -> None:
    """Verify that the engine selects an intervention strategy using Multi-Armed Bandit policies."""
    strategy_history = {
        "isolated_transition": (15, 1),   # 15 wins, 1 loss (high win rate)
        "subdivision_click": (1, 6),
        "voicing_arpeggio": (2, 4),
        "gradual_tempo_ramp": (1, 5),
    }

    # Under Thompson Sampling or UCB1, valid arm is chosen
    strategy = StudentMasteryEngine.select_remedial_strategy(
        strategy_history=strategy_history,
        policy="thompson_sampling",
    )
    assert strategy in StudentMasteryEngine.DEFAULT_DRILL_STRATEGIES

    # Test UCB1 policy
    strategy_ucb = StudentMasteryEngine.select_remedial_strategy(
        strategy_history=strategy_history,
        policy="ucb1",
    )
    assert strategy_ucb in StudentMasteryEngine.DEFAULT_DRILL_STRATEGIES


def test_generate_adaptive_drill_plan() -> None:
    """Verify generation of a complete adaptive intervention drill plan."""
    habit = {
        "id": "pat_test_lag",
        "pattern_type": "transition_lag",
        "context": "C -> G",
    }
    plan = StudentMasteryEngine.generate_adaptive_drill_plan(
        habit_pattern=habit,
        user_id="user_test_mastery",
        reference_tempo=100,
    )

    assert plan["user_id"] == "user_test_mastery"
    assert "target_tempo" in plan
    assert "drill_type" in plan
    assert "selected_strategy" in plan
    assert "tempo_stages" in plan
    assert plan["tempo_stages"]["isolation_bpm"] == 70
