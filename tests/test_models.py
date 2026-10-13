from collections.abc import Generator

import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from src.models.practice import (
    AdaptiveIntervention,
    Exercise,
    HabitPattern,
    PracticeSession,
    SessionChordMetric,
)
from src.models.user import User


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite:///:memory:", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_create_exercise_and_session(db_session: Session) -> None:
    user = User(
        id="user_clerk_123",
        name="Test Musician",
        username="musician1",
        email="test@music.com",
    )
    exercise = Exercise(
        id="ex_1",
        title="Pop Progression",
        instrument="guitar",
        tempo_bpm=80,
        difficulty=1,
        progression_json="[]",
    )
    db_session.add(user)
    db_session.add(exercise)
    db_session.commit()

    practice_session = PracticeSession(
        id="sess_1",
        user_id=user.id,
        exercise_id=exercise.id,
        tempo_bpm=80,
        state="recording",
    )
    db_session.add(practice_session)
    db_session.commit()

    retrieved = db_session.exec(
        select(PracticeSession).where(PracticeSession.id == "sess_1")
    ).first()
    assert retrieved is not None
    assert retrieved.user_id == "user_clerk_123"
    assert retrieved.exercise_id == "ex_1"
    assert retrieved.state == "recording"


def test_create_session_chord_metric(db_session: Session) -> None:
    user = User(
        id="user_clerk_456",
        name="Pianist",
        username="pianist1",
        email="pianist@music.com",
    )
    exercise = Exercise(
        id="ex_piano_01",
        title="Jazz Turnaround",
        instrument="piano",
        tempo_bpm=100,
        difficulty=2,
        progression_json="[]",
    )
    session_obj = PracticeSession(
        id="sess_piano_01",
        user_id=user.id,
        exercise_id=exercise.id,
        tempo_bpm=100,
        state="completed",
        overall_accuracy=0.92,
    )
    db_session.add(user)
    db_session.add(exercise)
    db_session.add(session_obj)
    db_session.commit()

    metric = SessionChordMetric(
        id="metric_01",
        session_id=session_obj.id,
        chord_index=0,
        expected_chord="Cmaj7",
        detected_chord="Cmaj7",
        is_matched=True,
        onset_error_ms=12.5,
        voicing_completeness=1.0,
        missed_notes_json="[]",
        extra_notes_json="[]",
    )
    db_session.add(metric)
    db_session.commit()

    retrieved = db_session.exec(
        select(SessionChordMetric).where(SessionChordMetric.id == "metric_01")
    ).first()
    assert retrieved is not None
    assert retrieved.is_matched is True
    assert retrieved.expected_chord == "Cmaj7"
    assert retrieved.onset_error_ms == 12.5


def test_create_habit_pattern_and_intervention(db_session: Session) -> None:
    user = User(
        id="user_clerk_789",
        name="Guitarist",
        username="guitarist1",
        email="guitarist@music.com",
    )
    db_session.add(user)
    db_session.commit()

    pattern = HabitPattern(
        id="pattern_01",
        user_id=user.id,
        pattern_type="transition_lag",
        trigger_context="F -> G at >85 BPM",
        evidence_count=4,
        status="active",
    )
    db_session.add(pattern)
    db_session.commit()

    intervention = AdaptiveIntervention(
        id="interv_01",
        pattern_id=pattern.id,
        user_id=user.id,
        drill_type="isolation_loop",
        target_tempo=70,
        target_repetitions=5,
        completed=False,
    )
    db_session.add(intervention)
    db_session.commit()

    retrieved_pattern = db_session.exec(
        select(HabitPattern).where(HabitPattern.id == "pattern_01")
    ).first()
    assert retrieved_pattern is not None
    assert retrieved_pattern.evidence_count == 4
    assert retrieved_pattern.status == "active"

    retrieved_interv = db_session.exec(
        select(AdaptiveIntervention).where(AdaptiveIntervention.id == "interv_01")
    ).first()
    assert retrieved_interv is not None
    assert retrieved_interv.pattern_id == "pattern_01"
    assert retrieved_interv.drill_type == "isolation_loop"
    assert retrieved_interv.completed is False
