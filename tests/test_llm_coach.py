from unittest.mock import patch
from src.lib.adaptive.llm_coach import generate_coaching_report


def test_generate_coaching_report_deterministic_fallback() -> None:
    metrics = [
        {
            "chord_index": 0,
            "expected_chord": "C",
            "detected_chord": "C",
            "is_matched": True,
            "onset_error_ms": 12.0,
            "voicing_completeness": 1.0,
        },
        {
            "chord_index": 1,
            "expected_chord": "G",
            "detected_chord": "G",
            "is_matched": True,
            "onset_error_ms": -15.0,
            "voicing_completeness": 1.0,
        },
    ]

    habits = [
        {
            "id": "pat_1",
            "pattern_type": "transition_lag",
            "context": "C -> G",
            "evidence_count": 3,
        }
    ]

    with patch.dict("os.environ", {}, clear=True):
        report = generate_coaching_report("sess_test_123", metrics, habits=habits, instrument="guitar")
        assert report["status"] == "deterministic_fallback"
        assert report["session_id"] == "sess_test_123"
        assert report["instrument"] == "guitar"
        assert "transition latency" in report["primary_bottleneck"].lower()
        assert "finger shape" in report["ergonomic_advice"].lower()
        assert len(report["tailored_drills"]) >= 1
        assert "sess_test_123" in report["summary"]

        # Test instrument-specific default ergonomic advice without habits
        report_guitar = generate_coaching_report("sess_test_456", metrics, habits=[], instrument="guitar")
        assert "thumb" in report_guitar["ergonomic_advice"].lower()

        report_piano = generate_coaching_report("sess_test_789", metrics, habits=[], instrument="piano")
        assert "wrist" in report_piano["ergonomic_advice"].lower()
