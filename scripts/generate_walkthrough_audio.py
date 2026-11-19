import math
import struct
import wave
import numpy as np

SAMPLE_RATE = 44100

def generate_woodblock(freq, duration=0.04, sample_rate=SAMPLE_RATE):
    """Dual-cavity wooden metronome click (1150 Hz accent, 850 Hz regular)."""
    n_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    # Fast exponential decay envelope
    envelope = np.exp(-t * 90.0)
    # Sine wave with a touch of 2nd harmonic
    signal = 0.8 * np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(2 * np.pi * freq * 1.6 * t)
    return signal * envelope

def karplus_strong(freq, duration=1.2, sample_rate=SAMPLE_RATE, decay=0.985):
    """Karplus-Strong plucked string physical model."""
    n_samples = int(sample_rate * duration)
    period = int(sample_rate / freq)
    if period <= 0:
        return np.zeros(n_samples)
    
    # Noise excitation buffer
    buffer = np.random.uniform(-1.0, 1.0, period)
    output = np.zeros(n_samples)
    
    # Ring buffer feedback loop with low-pass filter
    current_val = 0.0
    for i in range(n_samples):
        idx = i % period
        output[i] = buffer[idx]
        # Low-pass filter (averaging adjacent samples) and decay
        next_idx = (idx + 1) % period
        new_val = 0.5 * (buffer[idx] + buffer[next_idx]) * decay
        buffer[idx] = new_val
        
    return output

def piano_note(freq, duration=1.5, sample_rate=SAMPLE_RATE, B=0.0004):
    """Inharmonic multi-partial acoustic piano synthesis with stiffness dispersion."""
    n_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    output = np.zeros(n_samples)
    
    # 6 inharmonic partials: f_k = k * f0 * sqrt(1 + B * k^2)
    partials = [
        (1, 1.0, 2.0),
        (2, 0.6, 3.5),
        (3, 0.35, 5.0),
        (4, 0.18, 7.0),
        (5, 0.08, 9.5),
        (6, 0.04, 12.0)
    ]
    for k, amp, decay_rate in partials:
        fk = k * freq * math.sqrt(1.0 + B * (k ** 2))
        env = np.exp(-t * decay_rate)
        output += amp * np.sin(2 * np.pi * fk * t) * env
        
    return output / 1.8

def build_audio(total_duration=36.0):
    total_samples = int(SAMPLE_RATE * total_duration)
    mix = np.zeros(total_samples, dtype=np.float32)

    def add_sound(sound, start_time, gain=0.6):
        start_idx = int(start_time * SAMPLE_RATE)
        end_idx = min(start_idx + len(sound), total_samples)
        if start_idx < total_samples:
            mix[start_idx:end_idx] += (sound[:end_idx - start_idx] * gain).astype(np.float32)

    # 1. Metronome clicks throughout (108 BPM -> beat every ~0.555s)
    beat_sec = 60.0 / 108.0
    for beat in range(int(total_duration / beat_sec)):
        t = beat * beat_sec
        is_downbeat = (beat % 4 == 0)
        freq = 1150 if is_downbeat else 850
        gain = 0.35 if is_downbeat else 0.2
        click = generate_woodblock(freq, duration=0.04)
        add_sound(click, t, gain=gain)

    # 2. Section 1 (0s - 10s): Shostakovich Waltz No. 2 Piano (C minor / G7)
    # MIDI notes: C3=130.81, Eb3=155.56, G3=196.0, C4=261.63, D4=293.66, Eb4=311.13
    piano_chords = [
        (0.555, [130.81, 155.56, 196.0]),   # Cm
        (1.665, [130.81, 155.56, 196.0]),   # Cm
        (2.775, [116.54, 146.83, 174.61]),  # Bb
        (3.885, [103.83, 130.81, 155.56]),  # Ab
        (5.000, [98.00, 123.47, 146.83]),   # G
        (6.110, [130.81, 155.56, 196.0, 261.63]), # Cm resolve
        (7.220, [196.0, 246.94, 293.66]),   # G7
        (8.330, [130.81, 155.56, 196.0, 261.63])  # Cm
    ]
    for start_t, freqs in piano_chords:
        for f in freqs:
            p_note = piano_note(f, duration=1.2)
            add_sound(p_note, start_t, gain=0.25)

    # 3. Section 2 (10s - 22s): House of the Rising Sun Guitar Arpeggio (Am, C, D, F, Am, E7)
    # Karplus-Strong string arpeggiation (6/8 feel or flowing picked notes)
    # Am: A2(110), E3(164.81), A3(220), C4(261.63), E4(329.63)
    # C:  C3(130.81), E3(164.81), G3(196), C4(261.63), E4(329.63)
    # D:  D3(146.83), A3(220), D4(293.66), F#4(369.99)
    # F:  F2(87.31), C3(130.81), F3(174.61), A3(220), C4(261.63)
    arpeggios = [
        (10.5, [110.0, 164.81, 220.0, 261.63, 329.63]), # Am
        (12.5, [130.81, 164.81, 196.0, 261.63, 329.63]), # C
        (14.5, [146.83, 220.0, 293.66, 369.99]),         # D
        (16.5, [87.31, 130.81, 174.61, 220.0, 261.63]), # F
        (18.5, [110.0, 164.81, 220.0, 261.63]),         # Am
        (20.0, [82.41, 123.47, 164.81, 207.65, 246.94]),# E
    ]
    for chord_start, notes in arpeggios:
        for i, f in enumerate(notes):
            pluck = karplus_strong(f, duration=1.8, decay=0.988)
            note_t = chord_start + i * 0.18
            add_sound(pluck, note_t, gain=0.35)

    # 4. Section 3 (22s - 28s): Guitar Tuner Harmonic Strings (E2, A2, D3, G3, B3, E4)
    tuner_strings = [
        (22.5, 82.41),  # Low E
        (23.5, 110.0),  # A
        (24.5, 146.83), # D
        (25.5, 196.0),  # G
        (26.5, 246.94), # B
        (27.5, 329.63)  # High E
    ]
    for t_str, freq in tuner_strings:
        pluck = karplus_strong(freq, duration=2.0, decay=0.992)
        add_sound(pluck, t_str, gain=0.4)

    # 5. Section 4 (28s - 35s): Grand Cadence Resolution
    # Final warm acoustic piano & guitar resonance resolving on C Major / A Minor
    cadence_piano = [
        (29.0, [130.81, 164.81, 196.0, 261.63]), # C major
        (31.0, [110.0, 164.81, 220.0, 261.63, 329.63]) # Am resolve
    ]
    for t_cad, freqs in cadence_piano:
        for f in freqs:
            add_sound(piano_note(f, duration=3.0), t_cad, gain=0.3)
            add_sound(karplus_strong(f, duration=3.0, decay=0.99), t_cad + 0.05, gain=0.25)

    # Normalize to prevent clipping (-1 dB headroom)
    max_amp = np.max(np.abs(mix))
    if max_amp > 0:
        mix = (mix / max_amp) * 0.88

    # Convert to 16-bit PCM WAV
    int16_samples = (mix * 32767.0).astype(np.int16)
    return int16_samples

def main():
    wav_path = 'docs/assets/demo/walkthrough_audio.wav'
    samples = build_audio(total_duration=35.0)
    
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(samples.tobytes())
        
    print(f"Generated realistic practice audio at {wav_path} (35.0s, {SAMPLE_RATE}Hz)")

if __name__ == '__main__':
    main()
