"""Interactive CLI tool to test Spotify Basic Pitch and the adaptive practice pipeline on real audio.

Usage:
    # 1. Test with an existing WAV file:
    python scripts/test_audio.py path/to/my_recording.wav

    # 2. Test with a custom chord progression:
    python scripts/test_audio.py my_piano.wav --chords "C,G,Am,F" --tempo 100

    # 3. Run self-test demo (generates a synthetic 4-chord progression):
    python scripts/test_audio.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import numpy as np
from scipy.io import wavfile

from src.lib.adaptive.interventions import generate_intervention
from src.lib.adaptive.patterns import detect_habits
from src.lib.adaptive.reports import generate_grounded_report
from src.lib.audio.alignment import align_chord_sequence
from src.lib.audio.transcription import transcribe_polyphonic_wav
from src.lib.audio.voicing import cluster_chords_from_notes
from src.lib.music.chords import parse_chord_notes

# MIDI note numbers to note names
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_note_name(midi: int) -> str:
    octave = (midi // 12) - 1
    name = NOTE_NAMES[midi % 12]
    return f"{name}{octave}"


def generate_demo_wav(filename: str = "demo_take.wav", tempo_bpm: int = 100) -> str:
    """Generate a clean synthetic audio file containing C -> G -> Am -> F chords."""
    sr = 22050
    seconds_per_beat = 60.0 / tempo_bpm
    chord_duration = seconds_per_beat * 2  # 2 beats per chord

    chords_freqs = [
        [261.63, 329.63, 392.00],          # C major (C4, E4, G4)
        [196.00, 246.94, 293.66],          # G major (G3, B3, D4)
        [220.00, 261.63, 329.63],          # A minor (A3, C4, E4)
        [174.61, 220.00, 261.63, 349.23],  # F major (F3, A3, C4, F4)
    ]

    audio_segments = []
    for freqs in chords_freqs:
        t = np.linspace(0, chord_duration, int(sr * chord_duration), endpoint=False)
        chord_wave = np.zeros_like(t)
        for f in freqs:
            chord_wave += np.sin(2 * np.pi * f * t)
        chord_wave = chord_wave / max(1, len(freqs))
        # Add smooth envelope to simulate natural strike and decay
        envelope = np.exp(-1.5 * t)
        audio_segments.append(chord_wave * envelope)

    full_audio = np.concatenate(audio_segments).astype(np.float32)
    wavfile.write(filename, sr, full_audio)
    return filename


def run_pipeline(wav_path: str, chord_names: list[str], tempo_bpm: int) -> None:
    print("\n" + "=" * 70)
    print(f"[SONUS] ANALYZING AUDIO WITH SPOTIFY BASIC PITCH")
    print(f"   Audio file : {wav_path}")
    print(f"   Target     : {' -> '.join(chord_names)} at {tempo_bpm} BPM")
    print("=" * 70)

    # 1. Transcribe with Spotify Basic Pitch
    print("\n[Step 1] Running polyphonic transcription (Spotify Basic Pitch ONNX)...")
    raw_notes = transcribe_polyphonic_wav(wav_path)

    if not raw_notes:
        print("[!] No notes detected in the audio file. Please check audio volume/clarity.")
        return

    print(f"[+] Detected {len(raw_notes)} note events:")
    print(f"  {'Pitch':<6} {'Note':<8} {'Start (s)':<12} {'End (s)':<12} {'Confidence':<10}")
    print("  " + "-" * 50)
    for n in sorted(raw_notes, key=lambda x: x["start_time"])[:15]:
        note_str = midi_to_note_name(n["pitch"])
        print(f"  {n['pitch']:<6} {note_str:<8} {n['start_time']:<12.3f} {n['end_time']:<12.3f} {n['amplitude']:<10.2f}")
    if len(raw_notes) > 15:
        print(f"  ... and {len(raw_notes) - 15} more notes")

    # 2. Cluster notes into chords
    print("\n[Step 2] Grouping notes into played chord events...")
    played_chords = cluster_chords_from_notes(raw_notes, strum_window_ms=100.0)
    print(f"[+] Formed {len(played_chords)} chord clusters:")
    for idx, pc in enumerate(played_chords):
        pitches = sorted(pc.get("pitches", []))
        pitch_names = [midi_to_note_name(p) for p in pitches]
        t_sec = pc.get("timestamp_sec", pc.get("start_time", 0.0))
        chord_name_str = f" [{pc.get('detected_name')}]" if pc.get('detected_name') else ""
        print(f"  Cluster {idx + 1}: at {t_sec:.2f}s -> Pitches: {pitches} ({', '.join(pitch_names)}){chord_name_str}")

    # 3. Build expected progression
    print("\n[Step 3] Aligning against target progression...")
    seconds_per_beat = 60.0 / tempo_bpm
    beats_per_chord = 2.0
    expected_progression = []
    for idx, name in enumerate(chord_names):
        pitch_classes = parse_chord_notes(name)
        expected_progression.append({
            "name": name,
            "beat": 1 + idx * beats_per_chord,
            "expected_pitches": pitch_classes,
        })

    chord_metrics = align_chord_sequence(
        played_chords=played_chords,
        reference_chords=expected_progression,
        tempo_bpm=tempo_bpm,
    )

    matched_count = sum(1 for m in chord_metrics if m["is_matched"])
    total_count = max(1, len(chord_metrics))
    accuracy_score = (matched_count / total_count) * 100.0

    print("\n" + "-" * 70)
    print(f"[REPORT] ALIGNMENT & VOICING REPORT (Overall Score: {accuracy_score:.1f}%)")
    print("-" * 70)
    print(f"{'Target':<10} {'Detected':<10} {'Matched?':<10} {'Timing Error':<16} {'Voicing':<10}")
    print("-" * 70)

    for m in chord_metrics:
        matched = "YES" if m["is_matched"] else "NO"
        timing = f"{m['onset_error_ms']:+.1f} ms" if m.get("onset_error_ms") is not None else "N/A"
        voicing = f"{m['voicing_completeness'] * 100:.0f}%" if m.get("voicing_completeness") is not None else "0%"
        det = m.get("detected_chord") or "-"
        print(f"{m['expected_chord']:<10} {det:<10} {matched:<10} {timing:<16} {voicing:<10}")

    chord_metrics_data = chord_metrics

    # 4. Adaptive Coaching Diagnosis
    print("\n[Step 4] Running Adaptive Learning Engine...")
    report = generate_grounded_report(session_id="test_run", chord_metrics=chord_metrics_data)
    habits = detect_habits(user_id="test_user", metrics=chord_metrics_data)

    print("\n" + "=" * 70)
    print("[COACHING] FEEDBACK & DIAGNOSIS")
    print("=" * 70)
    print("\n".join(report.get("summary_text", [])))

    if habits:
        print("\nDetected Habit Patterns:")
        for h in habits:
            inv = generate_intervention(h, user_id="test_user", reference_tempo=tempo_bpm)
            print(f"  * {h['pattern_type'].replace('_', ' ').title()}: {inv['instructions']}")
    else:
        print("\nClean execution! No timing lags or voice-leading errors detected.")
    print("=" * 70 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Test Spotify Basic Pitch and chord alignment pipeline")
    parser.add_argument("wav_path", nargs="?", default=None, help="Path to WAV audio file to analyze")
    parser.add_argument("--chords", default="C,G,Am,F", help="Comma-separated chord progression (default: C,G,Am,F)")
    parser.add_argument("--tempo", type=int, default=100, help="Tempo in BPM (default: 100)")
    args = parser.parse_args()

    chord_names = [c.strip() for c in args.chords.split(",") if c.strip()]

    if args.wav_path:
        target_path = Path(args.wav_path)
        if not target_path.exists():
            print(f"Error: file not found: {target_path}")
            sys.exit(1)
        run_pipeline(str(target_path), chord_names, args.tempo)
    else:
        print("No WAV file specified. Generating a synthetic 4-chord demo take (C -> G -> Am -> F)...")
        demo_file = generate_demo_wav("demo_take.wav", tempo_bpm=args.tempo)
        try:
            run_pipeline(demo_file, chord_names, args.tempo)
        finally:
            demo_path = Path(demo_file)
            if demo_path.exists():
                demo_path.unlink()


if __name__ == "__main__":
    main()
