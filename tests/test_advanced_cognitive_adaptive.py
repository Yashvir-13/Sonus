from __future__ import annotations

import pytest

from src.lib.adaptive.bandit import ThompsonSamplingBandit, UCB1Bandit
from src.lib.adaptive.knowledge_tracing import BKTParameters, BKTState, update_bkt
from src.lib.adaptive.patterns import detect_cusum_changepoint
from src.lib.adaptive.spaced_repetition import (
    SM2Record,
    compute_musical_quality_grade,
    update_sm2,
)


def test_sm2_grade_and_interval_progression() -> None:
    # 1. Grade mapping test
    # Flawless take: 100% acc, 12ms error, 100% voicing -> Grade 5
    g5 = compute_musical_quality_grade(overall_accuracy=1.0, avg_timing_error_ms=12.0, voicing_completeness=1.0)
    assert g5 == 5

    # Hesitant take: 75% acc, 70ms error -> Grade 3
    g3 = compute_musical_quality_grade(overall_accuracy=0.75, avg_timing_error_ms=70.0, voicing_completeness=0.8)
    assert g3 == 3

    # Failed take: 20% acc -> Grade 0
    g0 = compute_musical_quality_grade(overall_accuracy=0.20, avg_timing_error_ms=160.0, voicing_completeness=0.3)
    assert g0 == 0

    # 2. Interval progression across successful practice sessions
    rec0 = SM2Record(repetitions=0, interval_days=1, ease_factor=2.5)

    # First repetition: interval 1 day
    rec1 = update_sm2(rec0, grade=5)
    assert rec1.repetitions == 1
    assert rec1.interval_days == 1
    assert rec1.ease_factor >= 2.5

    # Second repetition: interval 6 days
    rec2 = update_sm2(rec1, grade=5)
    assert rec2.repetitions == 2
    assert rec2.interval_days == 6

    # Third repetition: interval = 6 * EF
    rec3 = update_sm2(rec2, grade=4)
    assert rec3.repetitions == 3
    assert rec3.interval_days >= 14

    # Failure resets repetitions and interval to 1
    rec_fail = update_sm2(rec3, grade=1)
    assert rec_fail.repetitions == 0
    assert rec_fail.interval_days == 1
    assert rec_fail.ease_factor < rec3.ease_factor


def test_bayesian_knowledge_tracing_transition_mastery() -> None:
    initial_state = BKTState(skill_id="transition_F_G", p_known=0.20, opportunities=0, is_mastered=False)
    params = BKTParameters(p_init=0.20, p_transit=0.15, p_slip=0.08, p_guess=0.12)

    # Successful take increases P(L_t)
    state_1 = update_bkt(initial_state, is_correct=True, params=params)
    assert state_1.p_known > initial_state.p_known
    assert state_1.opportunities == 1

    # Consecutive successful takes drive mastery towards threshold
    current = state_1
    for _ in range(6):
        current = update_bkt(current, is_correct=True, params=params)

    assert current.p_known >= 0.95
    assert current.is_mastered is True

    # Motor slip on mastered skill slightly lowers P(L), but maintains high posterior
    slip_state = update_bkt(current, is_correct=False, params=params)
    assert slip_state.p_known > 0.50


def test_multi_armed_bandit_thompson_sampling_and_ucb1() -> None:
    # 1. Thompson Sampling
    ts_bandit = ThompsonSamplingBandit(arms=["drill_isolation", "drill_click", "drill_arpeggio"])
    # Reward isolation drill heavily
    for _ in range(10):
        ts_bandit.update_reward("drill_isolation", success=True)
    # Fail click drill
    for _ in range(5):
        ts_bandit.update_reward("drill_click", success=False)

    # Over 20 selections, drill_isolation should dominate
    selections = [ts_bandit.select_arm() for _ in range(20)]
    assert selections.count("drill_isolation") > selections.count("drill_click")

    # 2. UCB1 Deterministic Policy
    ucb_bandit = UCB1Bandit(arms=["arm_a", "arm_b"])
    # Initial pulls explore each arm once
    arm1 = ucb_bandit.select_arm()
    ucb_bandit.update_reward(arm1, reward=1.0)
    arm2 = ucb_bandit.select_arm()
    ucb_bandit.update_reward(arm2, reward=0.0)

    # High reward arm should be selected next
    next_arm = ucb_bandit.select_arm()
    assert next_arm == "arm_a"


def test_cusum_changepoint_detection() -> None:
    # Baseline stable latency: ~50ms
    # Sudden deterioration at take 6 to ~140ms
    series_deterioration = [50.0, 52.0, 48.0, 51.0, 53.0, 130.0, 140.0, 145.0, 150.0]
    result_det = detect_cusum_changepoint(series_deterioration, target_mean=50.0)
    assert result_det["detected"] is True
    assert result_det["direction"] == "deterioration"
    assert result_det["changepoint_index"] >= 5

    # Remediation: latencies drop from 140ms to 45ms
    series_improvement = [140.0, 145.0, 138.0, 142.0, 140.0, 50.0, 45.0, 42.0, 40.0]
    result_imp = detect_cusum_changepoint(series_improvement, target_mean=140.0)
    assert result_imp["detected"] is True
    assert result_imp["direction"] == "improvement"
    assert result_imp["changepoint_index"] >= 5
