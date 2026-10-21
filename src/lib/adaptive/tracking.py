"""Longitudinal outcome tracking and drill follow-up evaluation engine."""

from __future__ import annotations

from typing import Any


def evaluate_drill_outcome(
    baseline_metrics: list[dict[str, Any]],
    follow_up_metrics: list[dict[str, Any]],
    drill_type: str,
) -> dict[str, Any]:
    """Evaluate whether a practice take shows measurable improvement over the baseline session.

    Uses relative percentage delta with a safety floor as decided in domain modeling.
    """
    if not baseline_metrics or not follow_up_metrics:
        return {
            "drill_type": drill_type,
            "outcome": "inconclusive",
            "measured_improvement": 0.0,
            "measured_improvement_pct": 0.0,
            "completed": False,
            "message": "Insufficient performance metrics to compute comparative delta.",
        }

    if drill_type == "isolated_transition":
        # Metric: Transition Latency (lower is better)
        baseline_lats = [float(m.get("transition_latency_ms", 0.0)) for m in baseline_metrics if "transition_latency_ms" in m]
        follow_up_lats = [float(m.get("transition_latency_ms", 0.0)) for m in follow_up_metrics if "transition_latency_ms" in m]

        if not baseline_lats or not follow_up_lats:
            return {"drill_type": drill_type, "outcome": "inconclusive", "completed": False, "measured_improvement_pct": 0.0}

        base_val = sum(baseline_lats) / len(baseline_lats)
        follow_val = sum(follow_up_lats) / len(follow_up_lats)
        reduction_ms = base_val - follow_val
        pct_improvement = (reduction_ms / base_val * 100.0) if base_val > 0 else 0.0

        is_improved = pct_improvement >= 15.0 or reduction_ms >= 25.0
        outcome = "improved" if is_improved else ("steady" if pct_improvement >= -5.0 else "worsened")

        return {
            "drill_type": drill_type,
            "outcome": outcome,
            "measured_improvement": round(reduction_ms, 2),
            "measured_improvement_pct": round(pct_improvement, 2),
            "completed": is_improved,
            "baseline_value": round(base_val, 2),
            "follow_up_value": round(follow_val, 2),
        }

    elif drill_type == "voicing_arpeggio":
        # Metric: Voicing Completeness (higher is better)
        base_scores = [float(m.get("voicing_completeness", 0.0)) for m in baseline_metrics if "voicing_completeness" in m]
        follow_scores = [float(m.get("voicing_completeness", 0.0)) for m in follow_up_metrics if "voicing_completeness" in m]

        if not base_scores or not follow_scores:
            return {"drill_type": drill_type, "outcome": "inconclusive", "completed": False, "measured_improvement_pct": 0.0}

        base_val = sum(base_scores) / len(base_scores)
        follow_val = sum(follow_scores) / len(follow_scores)
        gain = follow_val - base_val
        pct_improvement = gain * 100.0

        is_improved = pct_improvement >= 10.0 or follow_val >= 0.90
        outcome = "improved" if is_improved else ("steady" if gain >= -0.05 else "worsened")

        return {
            "drill_type": drill_type,
            "outcome": outcome,
            "measured_improvement": round(gain, 3),
            "measured_improvement_pct": round(pct_improvement, 2),
            "completed": is_improved,
            "baseline_value": round(base_val, 3),
            "follow_up_value": round(follow_val, 3),
        }

    else:
        # Default: Onset Timing Error (lower absolute deviation is better)
        base_errs = [abs(float(m.get("onset_error_ms", 0.0))) for m in baseline_metrics if "onset_error_ms" in m]
        follow_errs = [abs(float(m.get("onset_error_ms", 0.0))) for m in follow_up_metrics if "onset_error_ms" in m]

        if not base_errs or not follow_errs:
            return {"drill_type": drill_type, "outcome": "inconclusive", "completed": False, "measured_improvement_pct": 0.0}

        base_val = sum(base_errs) / len(base_errs)
        follow_val = sum(follow_errs) / len(follow_errs)
        reduction_err = base_val - follow_val
        pct_improvement = (reduction_err / base_val * 100.0) if base_val > 0 else 0.0

        is_improved = pct_improvement >= 15.0 or reduction_err >= 15.0
        outcome = "improved" if is_improved else ("steady" if pct_improvement >= -5.0 else "worsened")

        return {
            "drill_type": drill_type,
            "outcome": outcome,
            "measured_improvement": round(reduction_err, 2),
            "measured_improvement_pct": round(pct_improvement, 2),
            "completed": is_improved,
            "baseline_value": round(base_val, 2),
            "follow_up_value": round(follow_val, 2),
        }
