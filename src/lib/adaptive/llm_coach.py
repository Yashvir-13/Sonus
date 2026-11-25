"""Grounded AI practice coaching via Gemini 2.5 Flash with deterministic fallback."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx
from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.reports import generate_grounded_report

logger = logging.getLogger(__name__)

_LOW_ACC_THRESHOLD = 70.0
_HIGH_TIMING_ERROR_MS = 40.0
_TEMPO_DECREASE_THRESHOLD = 80.0
_TEMPO_INCREASE_THRESHOLD = 95.0
_PERCENT_SCALE = 100
_GRADE_THRESHOLDS: tuple[tuple[float, str], ...] = (
    (93.0, "A"),
    (90.0, "A-"),
    (85.0, "B+"),
    (80.0, "B"),
    (70.0, "C"),
    (60.0, "D"),
)


def _compute_letter_grade(score_pct: float) -> str:
    for cutoff, grade in _GRADE_THRESHOLDS:
        if score_pct >= cutoff:
            return grade
    return "F"


def generate_deterministic_fallback(
    session_id: str,
    grounded_data: dict[str, Any],
    habits: list[dict[str, Any]],
    instrument: str,
) -> dict[str, Any]:
    """Generate a high-quality pedagogical report strictly from deterministic facts."""
    facts = grounded_data.get("facts", {})
    accuracy_pct = float(facts.get("accuracy_pct", 0.0))
    avg_onset = float(facts.get("avg_onset_error_ms", 0.0))
    avg_abs_onset = float(facts.get("avg_abs_timing_error_ms", abs(avg_onset)))
    avg_voicing = float(facts.get("avg_voicing_completeness", 1.0))

    primary_bottleneck = "Timing consistency across chord transitions"
    ergonomic_advice = (
        "Keep your wrist relaxed and aligned with your forearm to minimize tension."
        if instrument == "piano"
        else (
            "Keep your fretting thumb anchored near the midpoint of the neck "
            "for reach and leverage."
        )
    )

    if habits:
        first_habit = habits[0]
        h_type = first_habit.get("pattern_type")
        ctx = first_habit.get("context", "")
        if h_type == "transition_lag":
            primary_bottleneck = f"Transition latency entering {ctx}"
            ergonomic_advice = (
                f"Anticipate the finger shape for {ctx} one beat ahead "
                "to prevent hesitation."
            )
        elif h_type == "tempo_rushing":
            primary_bottleneck = "Tendency to rush measure downbeats"
            ergonomic_advice = (
                "Breathe on beat 4 and let the metronome pulse settle "
                "before attacking beat 1."
            )
        elif h_type == "voicing_drop":
            primary_bottleneck = f"Incomplete harmonic voicing on {ctx}"
            ergonomic_advice = (
                f"Ensure all required notes in {ctx} ring out cleanly "
                "with balanced finger weight."
            )
    elif accuracy_pct < _LOW_ACC_THRESHOLD:
        primary_bottleneck = "Chord shape recognition and finger placement speed"
    elif avg_abs_onset > _HIGH_TIMING_ERROR_MS:
        primary_bottleneck = "Subdivision tempo synchronization with backing click"

    coaching_letter = (
        f"Great session work on Session {session_id}! You achieved {accuracy_pct}% "
        f"overall accuracy with an average onset delta of {avg_onset:+.1f}ms "
        f"(±{avg_abs_onset:.1f}ms spread) and {int(avg_voicing * _PERCENT_SCALE)}% "
        f"voicing completeness. Our primary focus for the next session is addressing: "
        f"{primary_bottleneck}. {ergonomic_advice}"
    )

    tailored_drills: list[dict[str, Any]] = []
    if habits:
        for h in habits[:2]:
            drill = generate_intervention(
                h,
                user_id=f"user_{session_id}",
                reference_tempo=80,
            )
            tailored_drills.append(drill)
    else:
        desc = (
            f"Play through the progression at 70 BPM with steady dynamics, "
            f"focusing on {primary_bottleneck}."
        )
        tailored_drills.append({
            "id": f"drill_{session_id}_base",
            "drill_type": "metronome_lock",
            "target_tempo": 70,
            "target_repetitions": 3,
            "description": desc,
            "instructions": desc,
            "completed": False,
        })

    report_dict = {
        "status": "deterministic_fallback",
        "summary": grounded_data.get("summary", ""),
    }
    return _enrich_report_fields(
        base=report_dict,
        session_id=session_id,
        instrument=instrument,
        facts=facts,
        habits=habits,
        primary_bottleneck=primary_bottleneck,
        ergonomic_advice=ergonomic_advice,
        coaching_letter=coaching_letter,
        tailored_drills=tailored_drills,
    )


def _enrich_report_fields(
    base: dict[str, Any],
    session_id: str,
    instrument: str,
    facts: dict[str, Any],
    habits: list[dict[str, Any]],
    primary_bottleneck: str,
    ergonomic_advice: str,
    coaching_letter: str,
    tailored_drills: list[dict[str, Any]],
) -> dict[str, Any]:
    """Ensure report contains all required pedagogical and DTO-aligned fields."""
    accuracy_pct = float(facts.get("accuracy_pct", 0.0))
    matched = int(facts.get("matched_chords", 0))
    total = int(facts.get("total_chords", 0))

    tempo_adj = (
        -5
        if accuracy_pct < _TEMPO_DECREASE_THRESHOLD
        else (5 if accuracy_pct >= _TEMPO_INCREASE_THRESHOLD else 0)
    )

    key_strengths = (
        [
            f"{matched} of {total} target chords accurately aligned",
            "Clear harmonic recognition maintained across primary cadences",
        ]
        if matched > 0
        else ["Dedicated practice attempt logged"]
    )

    normalized_drills: list[dict[str, Any]] = []
    for raw_drill in tailored_drills:
        text = str(
            raw_drill.get("description")
            or raw_drill.get("instructions")
            or "Practice with metronome click",
        )
        normalized_drills.append({
            **raw_drill,
            "description": text,
            "instructions": text,
        })

    growth_areas = [primary_bottleneck, ergonomic_advice]
    habit_alerts = [
        f"Detected {h.get('pattern_type')}: {h.get('context', '')}" for h in habits
    ]
    recommended_actions = [d["description"] for d in normalized_drills]

    return {
        **base,
        "session_id": session_id,
        "instrument": instrument,
        "headline": f"Coaching Review: {primary_bottleneck}",
        "score": round(accuracy_pct),
        "letter_grade": _compute_letter_grade(accuracy_pct),
        "primary_bottleneck": primary_bottleneck,
        "ergonomic_advice": ergonomic_advice,
        "coaching_letter": coaching_letter,
        "key_strengths": key_strengths,
        "growth_areas": growth_areas,
        "habit_alerts": habit_alerts,
        "recommended_actions": recommended_actions,
        "recommended_tempo_adjustment": tempo_adj,
        "recommended_tempo_adjustment_bpm": tempo_adj,
        "tailored_drills": normalized_drills,
        "facts": facts,
    }


def _prepare_gemini_request(
    grounded_data: dict[str, Any],
    habit_list: list[dict[str, Any]],
    instrument: str,
    gemini_key: str,
) -> tuple[str, dict[str, str], dict[str, Any]]:
    """Build the request URL, headers, and payload for Gemini."""
    model = (
        os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
        or "gemini-2.5-flash"
    )
    prompt = {
        "system_instruction": (
            "You are an encouraging, world-class conservatory music instructor "
            "for piano and guitar. You are given pre-computed, deterministic facts "
            "about a student's practice take. Never invent notes or contradict "
            "the facts. Respond ONLY with valid JSON."
        ),
        "facts": grounded_data.get("facts", {}),
        "detected_habits": habit_list,
        "instrument": instrument,
        "instructions": (
            "Return a JSON object with: 'primary_bottleneck' (string), "
            "'ergonomic_advice' (string), and 'coaching_letter' (a 2-3 paragraph "
            "pedagogical feedback note referring directly to the facts)."
        ),
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    headers = {"x-goog-api-key": gemini_key}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": json.dumps(prompt)},
                ],
            },
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
        },
    }
    return url, headers, payload


def _process_gemini_response(
    response: httpx.Response,
    session_id: str,
    grounded_data: dict[str, Any],
    habit_list: list[dict[str, Any]],
    instrument: str,
) -> dict[str, Any] | None:
    """Extract and validate pedagogical fields from Gemini response."""
    if response.status_code == httpx.codes.OK:
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates:
            raw_text = (
                candidates[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            parsed = json.loads(raw_text)

            fallback = generate_deterministic_fallback(
                session_id,
                grounded_data,
                habit_list,
                instrument,
            )
            ai_base = {
                "status": "ai_grounded",
                "summary": grounded_data.get("summary", ""),
            }
            return _enrich_report_fields(
                base=ai_base,
                session_id=session_id,
                instrument=instrument,
                facts=grounded_data.get("facts", {}),
                habits=habit_list,
                primary_bottleneck=parsed.get(
                    "primary_bottleneck",
                    fallback["primary_bottleneck"],
                ),
                ergonomic_advice=parsed.get(
                    "ergonomic_advice",
                    fallback["ergonomic_advice"],
                ),
                coaching_letter=parsed.get(
                    "coaching_letter",
                    fallback["coaching_letter"],
                ),
                tailored_drills=fallback["tailored_drills"],
            )
    logger.warning(
        "Gemini API returned status %d; using fallback.",
        response.status_code,
    )
    return None


async def generate_coaching_report_async(
    session_id: str,
    chord_metrics: list[dict[str, Any]],
    habits: list[dict[str, Any]] | None = None,
    instrument: str = "piano",
) -> dict[str, Any]:
    """Generate hybrid AI coaching report asynchronously."""
    habit_list = habits or []
    grounded_data = generate_grounded_report(session_id, chord_metrics)

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not gemini_key or not gemini_key.startswith("AIzaSy"):
        logger.info(
            "Valid GEMINI_API_KEY not configured; returning deterministic fallback.",
        )
        return generate_deterministic_fallback(
            session_id,
            grounded_data,
            habit_list,
            instrument,
        )

    url, headers, payload = _prepare_gemini_request(
        grounded_data,
        habit_list,
        instrument,
        gemini_key,
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(url, headers=headers, json=payload)
        result = _process_gemini_response(
            response,
            session_id,
            grounded_data,
            habit_list,
            instrument,
        )
        if result is not None:
            return result
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.warning(
            "Error querying Gemini API asynchronously (%s); using fallback.",
            exc,
        )

    return generate_deterministic_fallback(
        session_id,
        grounded_data,
        habit_list,
        instrument,
    )


def generate_coaching_report(
    session_id: str,
    chord_metrics: list[dict[str, Any]],
    habits: list[dict[str, Any]] | None = None,
    instrument: str = "piano",
) -> dict[str, Any]:
    """Generate a hybrid AI coaching report grounded in verified session metrics."""
    habit_list = habits or []
    grounded_data = generate_grounded_report(session_id, chord_metrics)

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not gemini_key or not gemini_key.startswith("AIzaSy"):
        logger.info(
            "Valid GEMINI_API_KEY not configured; returning deterministic fallback.",
        )
        return generate_deterministic_fallback(
            session_id,
            grounded_data,
            habit_list,
            instrument,
        )

    url, headers, payload = _prepare_gemini_request(
        grounded_data,
        habit_list,
        instrument,
        gemini_key,
    )
    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.post(url, headers=headers, json=payload)
        result = _process_gemini_response(
            response,
            session_id,
            grounded_data,
            habit_list,
            instrument,
        )
        if result is not None:
            return result
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.warning("Error querying Gemini API (%s); using fallback.", exc)

    return generate_deterministic_fallback(
        session_id,
        grounded_data,
        habit_list,
        instrument,
    )
