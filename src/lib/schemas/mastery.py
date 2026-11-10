from __future__ import annotations

from pydantic import BaseModel

from src.models.practice import TransitionMasteryRead


class TransitionRecommendationItem(BaseModel):
    """Ranked cognitive remedial drill prescription for a musical transition."""

    id: str
    rank: int = 1
    transition_label: str
    chord_from: str
    chord_to: str
    instrument: str
    priority_score: float
    p_known: float
    learning_gap_pct: float
    ewma_latency_ms: float
    voicing_completeness_pct: float
    selected_drill_strategy: str
    recommended_bpm: int
    mathematical_breakdown: str


class MeMasteryResponse(BaseModel):
    """Response payload for user transition mastery records and ranked prescription queue."""

    records: list[TransitionMasteryRead]
    recommendations: list[TransitionRecommendationItem]
