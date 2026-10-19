"""Grounded AI practice coaching via Google Gemini 1.5 Flash with deterministic fallback."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.reports import generate_grounded_report

logger = logging.getLogger(__name__)


def generate_deterministic_fallback(
    session_id: str,
    grounded_data: dict[str, Any],
    habits: list[dict[str, Any]],
    instrument: str,
) -> dict[str, Any]:
    """Generate a high-quality pedagogical report strictly from deterministic facts."""
    facts = grounded_data.get("facts", {})
    accuracy_pct = facts.get("accuracy_pct", 0.0)
    avg_onset = facts.get("avg_onset_error_ms", 0.0)
    avg_voicing = facts.get("avg_voicing_completeness", 1.0)

    # Determine primary bottleneck
    primary_bottleneck = "Timing consistency across chord transitions"
    ergonomic_advice = (
        "Keep your wrist relaxed and aligned with your forearm to minimize tension."
        if instrument == "piano"
        else "Keep your fretting thumb anchored near the midpoint of the neck for reach and leverage."
    )

    if habits:
        first_habit = habits[0]
        h_type = first_habit.get("pattern_type")
        ctx = first_habit.get("context", "")
        if h_type == "transition_lag":
            primary_bottleneck = f"Transition latency entering {ctx}"
            ergonomic_advice = (
                f"Anticipate the finger shape for {ctx} one beat ahead to prevent hesitation."
            )
        elif h_type == "tempo_rushing":
            primary_bottleneck = "Tendency to rush measure downbeats"
            ergonomic_advice = (
                "Breathe on beat 4 and let the metronome pulse settle before attacking beat 1."
            )
        elif h_type == "voicing_drop":
            primary_bottleneck = f"Incomplete harmonic voicing on {ctx}"
            ergonomic_advice = (
                f"Ensure all required notes in {ctx} ring out cleanly with balanced finger weight."
            )
    elif accuracy_pct < 70.0:
        primary_bottleneck = "Chord shape recognition and finger placement speed"
    elif abs(avg_onset) > 40.0:
        primary_bottleneck = "Subdivision tempo synchronization with backing click"

    coaching_letter = (
        f"Great session work on Session {session_id}! You achieved {accuracy_pct}% overall accuracy "
        f"with an average onset delta of {avg_onset:+.1f}ms and {int(avg_voicing * 100)}% voicing completeness. "
        f"Our primary focus for the next session is addressing: {primary_bottleneck}. {ergonomic_advice}"
    )

    # Generate tailored drills
    tailored_drills: list[dict[str, Any]] = []
    if habits:
        for h in habits[:2]:
            drill = generate_intervention(h, user_id=f"user_{session_id}", reference_tempo=80)
            tailored_drills.append(drill)
    else:
        # Default maintenance drill
        tailored_drills.append({
            "id": f"drill_{session_id}_base",
            "drill_type": "metronome_lock",
            "target_tempo": 70,
            "target_repetitions": 3,
            "instructions": f"Play through the progression at 70 BPM with steady dynamics, focusing on {primary_bottleneck}.",
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
    """Ensure report contains all required pedagogical attributes."""
    accuracy_pct = float(facts.get("accuracy_pct", 0.0))
    matched = int(facts.get("matched_chords", 0))
    total = int(facts.get("total_chords", 0))

    tempo_adj = -5 if accuracy_pct < 80.0 else (+5 if accuracy_pct >= 95.0 else 0)

    key_strengths = [
        f"{matched} of {total} target chords accurately aligned",
        "Clear harmonic recognition maintained across primary cadences",
    ] if matched > 0 else ["Dedicated practice attempt logged"]

    growth_areas = [primary_bottleneck, ergonomic_advice]
    habit_alerts = [f"Detected {h.get('pattern_type')}: {h.get('context', '')}" for h in habits]
    recommended_actions = [d.get("instructions", "Practice with metronome click") for d in tailored_drills]

    return {
        **base,
        "session_id": session_id,
        "instrument": instrument,
        "headline": f"Coaching Review: {primary_bottleneck}",
        "score": int(accuracy_pct),
        "primary_bottleneck": primary_bottleneck,
        "ergonomic_advice": ergonomic_advice,
        "coaching_letter": coaching_letter,
        "key_strengths": key_strengths,
        "growth_areas": growth_areas,
        "habit_alerts": habit_alerts,
        "recommended_actions": recommended_actions,
        "recommended_tempo_adjustment": tempo_adj,
        "tailored_drills": tailored_drills,
        "facts": facts,
    }


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
    if not gemini_key:
        logger.info("GEMINI_API_KEY not configured; returning deterministic fallback coaching report.")
        return generate_deterministic_fallback(session_id, grounded_data, habit_list, instrument)

    prompt = {
        "system_instruction": (
            "You are an encouraging, world-class conservatory music instructor for piano and guitar. "
            "You are given pre-computed, deterministic facts about a student's practice take. "
            "Never invent notes or contradict the facts. Respond ONLY with valid JSON."
        ),
        "facts": grounded_data.get("facts", {}),
        "detected_habits": habit_list,
        "instrument": instrument,
        "instructions": (
            "Return a JSON object with: 'primary_bottleneck' (string), 'ergonomic_advice' (string), "
            "and 'coaching_letter' (a 2-3 paragraph pedagogical feedback note referring directly to the facts)."
        ),
    }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": json.dumps(prompt)}
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        }

        with httpx.Client(timeout=8.0) as client:
            response = client.post(url, json=payload)

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(raw_text)

                fallback = generate_deterministic_fallback(session_id, grounded_data, habit_list, instrument)
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
                    primary_bottleneck=parsed.get("primary_bottleneck", fallback["primary_bottleneck"]),
                    ergonomic_advice=parsed.get("ergonomic_advice", fallback["ergonomic_advice"]),
                    coaching_letter=parsed.get("coaching_letter", fallback["coaching_letter"]),
                    tailored_drills=fallback["tailored_drills"],
                )

        logger.warning("Gemini API returned status %d; using fallback.", response.status_code)
    except Exception as exc:
        logger.warning("Error querying Gemini API (%s); using fallback.", exc)

    return generate_deterministic_fallback(session_id, grounded_data, habit_list, instrument)
