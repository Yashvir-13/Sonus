from __future__ import annotations

import re

# Pitch class constants mapping note letter/accidental to pitch class 0-11
NOTE_TO_PITCH_CLASS: dict[str, int] = {
    "C": 0,
    "C#": 1,
    "DB": 1,
    "D": 2,
    "D#": 3,
    "EB": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "GB": 6,
    "G": 7,
    "G#": 8,
    "AB": 8,
    "A": 9,
    "A#": 10,
    "BB": 10,
    "B": 11,
}

# Intervals from root in semitones (0-11)
CHORD_INTERVALS: dict[str, list[int]] = {
    "": [0, 4, 7],  # Major triad
    "maj": [0, 4, 7],
    "M": [0, 4, 7],
    "m": [0, 3, 7],  # Minor triad
    "min": [0, 3, 7],
    "-": [0, 3, 7],
    "7": [0, 4, 7, 10],  # Dominant 7th
    "dom7": [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],  # Major 7th
    "M7": [0, 4, 7, 11],
    "m7": [0, 3, 7, 10],  # Minor 7th
    "min7": [0, 3, 7, 10],
    "-7": [0, 3, 7, 10],
    "dim": [0, 3, 6],  # Diminished triad
    "o": [0, 3, 6],
    "dim7": [0, 3, 6, 9],  # Diminished 7th
    "o7": [0, 3, 6, 9],
    "m7b5": [0, 3, 6, 10],  # Half-diminished
    "ø": [0, 3, 6, 10],
    "aug": [0, 4, 8],  # Augmented triad
    "+": [0, 4, 8],
    "aug7": [0, 4, 8, 10],
    "+7": [0, 4, 8, 10],
    "sus4": [0, 5, 7],  # Suspended 4th
    "sus": [0, 5, 7],
    "sus2": [0, 2, 7],  # Suspended 2nd
    "7sus4": [0, 5, 7, 10],
    "5": [0, 7],  # Power chord
    "6": [0, 4, 7, 9],  # Major 6th
    "m6": [0, 3, 7, 9],  # Minor 6th
    "add9": [0, 4, 7, 2],  # Add 9
    "madd9": [0, 3, 7, 2],  # Minor add 9
    "9": [0, 4, 7, 10, 2],  # Dominant 9th
    "maj9": [0, 4, 7, 11, 2],  # Major 9th
    "m9": [0, 3, 7, 10, 2],  # Minor 9th
}

CHORD_REGEX = re.compile(
    r"^(?P<root>[A-Ga-g][#b]?)(?P<quality>[^/]*)(?:/(?P<bass>[A-Ga-g][#b]?))?$"
)


def _parse_pitch_class(note_str: str) -> int:
    """Normalize and convert note name (e.g., 'C', 'f#', 'Bb') to pitch class 0-11."""
    if not note_str:
        raise ValueError("Empty note name")

    root_letter = note_str[0].upper()
    accidental = note_str[1:].replace("♯", "#").replace("♭", "b")

    # Normalize accidental casing
    if accidental.lower() == "b":
        norm = f"{root_letter}B"
    elif accidental == "#":
        norm = f"{root_letter}#"
    elif accidental == "":
        norm = root_letter
    else:
        raise ValueError(f"Invalid accidental in note: '{note_str}'")

    if norm not in NOTE_TO_PITCH_CLASS:
        raise ValueError(f"Unrecognized note: '{note_str}'")

    return NOTE_TO_PITCH_CLASS[norm]


def parse_chord_notes(chord_name: str) -> list[int]:
    """Map a chord symbol (e.g., 'C', 'Am7', 'G/B', 'F#m') to MIDI pitch classes (0-11).

    If a slash bass note is provided, the bass pitch class is placed first.
    """
    clean_chord = chord_name.strip()
    if not clean_chord:
        raise ValueError("Chord name cannot be empty")

    match = CHORD_REGEX.match(clean_chord)
    if not match:
        raise ValueError(f"Invalid chord format: '{chord_name}'")

    root_str = match.group("root")
    quality_str = match.group("quality") or ""
    bass_str = match.group("bass")

    root_pitch = _parse_pitch_class(root_str)

    if quality_str not in CHORD_INTERVALS:
        raise ValueError(
            f"Unrecognized chord quality '{quality_str}' in '{chord_name}'"
        )

    intervals = CHORD_INTERVALS[quality_str]
    chord_pitches: list[int] = [(root_pitch + interval) % 12 for interval in intervals]

    if bass_str is not None:
        bass_pitch = _parse_pitch_class(bass_str)
        # Put bass note first, followed by remaining chord tones preserving chord tone order
        remaining_pitches = [p for p in chord_pitches if p != bass_pitch]
        return [bass_pitch] + remaining_pitches

    return chord_pitches


def chord_similarity(expected_notes: list[int], detected_notes: list[int]) -> float:
    """Calculate the harmonic overlap score (0.0 to 1.0) between expected and detected notes.

    Uses the Jaccard similarity index of pitch class sets.
    """
    if not expected_notes and not detected_notes:
        return 1.0
    if not expected_notes or not detected_notes:
        return 0.0

    exp_set = {n % 12 for n in expected_notes}
    det_set = {n % 12 for n in detected_notes}

    intersection = len(exp_set & det_set)
    union = len(exp_set | det_set)

    if union == 0:
        return 1.0

    return float(intersection) / float(union)
