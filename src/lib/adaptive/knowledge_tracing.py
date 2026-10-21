"""Bayesian Knowledge Tracing (BKT) engine for procedural music skill acquisition.

Models latent cognitive mastery of chord transitions and fingering patterns as a
Hidden Markov Model across practice opportunities (Corbett & Anderson, 1995).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BKTParameters:
    """Standard BKT model parameters for musical skill transitions."""

    p_init: float = 0.20  # P(L_0): Prior probability of initial mastery
    p_transit: float = 0.15  # P(T): Probability of learning/transitioning on drill
    p_slip: float = 0.08  # P(S): Probability of motor slip despite knowing transition
    p_guess: float = 0.12  # P(G): Probability of accidental correct onset without mastery


@dataclass(frozen=True, slots=True)
class BKTState:
    """Represents a student's latent knowledge state for a specific chord transition."""

    skill_id: str
    p_known: float  # P(L_t): Latent probability of mastery
    opportunities: int
    is_mastered: bool  # True when P(L_t) >= mastery_threshold (default 0.95)


def update_bkt(
    state: BKTState,
    is_correct: bool,
    params: BKTParameters | None = None,
    mastery_threshold: float = 0.95,
) -> BKTState:
    """Update latent knowledge probability P(L_t) given practice outcome.

    P(L_t | Correct) = [P(L_{t-1}) * (1 - P(S))] / [P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)]
    P(L_t | Incorrect) = [P(L_{t-1}) * P(S)] / [P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G))]
    P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
    """
    p = params or BKTParameters()
    p_l = state.p_known

    if is_correct:
        numerator = p_l * (1.0 - p.p_slip)
        denominator = numerator + (1.0 - p_l) * p.p_guess
    else:
        numerator = p_l * p.p_slip
        denominator = numerator + (1.0 - p_l) * (1.0 - p.p_guess)

    p_l_obs = (numerator / denominator) if denominator > 0 else p_l

    # Learning transition probability
    p_next = p_l_obs + (1.0 - p_l_obs) * p.p_transit
    p_next = max(0.001, min(0.999, round(p_next, 4)))

    return BKTState(
        skill_id=state.skill_id,
        p_known=p_next,
        opportunities=state.opportunities + 1,
        is_mastered=p_next >= mastery_threshold,
    )
