"""Typed music progression, chord voicing, and tab schemas."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class TempoRange(BaseModel):
    """Tempo boundaries and practice stepping for an exercise."""

    min_bpm: int = Field(default=50, ge=30, le=240)
    default_bpm: int = Field(default=80, ge=30, le=240)
    max_bpm: int = Field(default=120, ge=30, le=240)
    gradual_step_bpm: int = Field(default=5, ge=1, le=20)


class GuitarTabs(BaseModel):
    """Fretboard fingering and string positions for guitar."""

    frets: list[int | None] = Field(default_factory=list, description="Fret numbers per string (None for muted)")
    strings: str = Field(default="E-A-D-G-B-e")
    fingering: str | None = None


class PianoVoicings(BaseModel):
    """Left hand and right hand piano voicings and inversions."""

    lh_note: str | None = None
    rh_notes: list[str] = Field(default_factory=list)
    lh_pitches: list[int] = Field(default_factory=list)
    rh_pitches: list[int] = Field(default_factory=list)
    inversion: str | None = None


class ChordDefinition(BaseModel):
    """Discrete reference chord event in an exercise."""

    name: str
    beat: float = Field(default=1.0, ge=0.0)
    duration_beats: float = Field(default=4.0, ge=0.5)
    expected_pitches: list[int] = Field(default_factory=list)
    guitar_tabs: GuitarTabs | None = None
    piano_voicings: PianoVoicings | None = None
    common_mistakes: list[str] = Field(default_factory=list)


class ProgressionData(BaseModel):
    """Full structured progression metadata and chord timeline."""

    key: str = "C Major"
    time_signature: str = "4/4"
    default_tempo_bpm: int = 80
    tempo_range: TempoRange | None = None
    strumming_pattern: str | None = None
    educational_focus: str | None = None
    chords: list[ChordDefinition] = Field(default_factory=list)


class ExerciseDetailRead(BaseModel):
    """Detailed exercise view with parsed progression schema."""

    id: str
    title: str
    description: str | None = None
    instrument: str
    tempo_bpm: int
    difficulty: int
    progression: ProgressionData


class CustomExerciseCreate(BaseModel):
    """Payload for creating a custom practice exercise."""

    title: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    instrument: str = Field(pattern="^(piano|guitar)$")
    tempo_bpm: int = Field(default=80, ge=40, le=220)
    difficulty: int = Field(default=1, ge=1, le=5)
    progression: ProgressionData
