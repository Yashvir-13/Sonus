from __future__ import annotations

from dataclasses import dataclass

from src.lib.music.chords import (
    CHORD_REGEX,
    chord_similarity,
    parse_chord_notes,
)


@dataclass(frozen=True, slots=True)
class MusicalChord:
    """Rich domain entity for musical chord representation and enharmonic analysis."""

    symbol: str
    root: str
    quality: str
    bass: str
    pitch_classes: tuple[int, ...]

    @classmethod
    def from_symbol(cls, symbol: str) -> MusicalChord:
        clean = symbol.strip()
        if not clean:
            raise ValueError("Chord symbol cannot be empty")

        match = CHORD_REGEX.match(clean)
        if not match:
            raise ValueError(f"Invalid chord format: '{symbol}'")

        root_str = match.group("root")
        quality_str = match.group("quality") or ""
        bass_str = match.group("bass") or root_str
        pcs = tuple(parse_chord_notes(clean))

        return cls(
            symbol=clean,
            root=root_str,
            quality=quality_str,
            bass=bass_str,
            pitch_classes=pcs,
        )

    @property
    def pitch_class_set(self) -> frozenset[int]:
        return frozenset(p % 12 for p in self.pitch_classes)

    def is_enharmonically_equivalent(self, other: MusicalChord | str) -> bool:
        if isinstance(other, str):
            try:
                target = MusicalChord.from_symbol(other)
            except ValueError:
                return False
        else:
            target = other
        return self.pitch_class_set == target.pitch_class_set

    def similarity(self, detected_pitches: list[int]) -> float:
        return chord_similarity(list(self.pitch_classes), detected_pitches)
