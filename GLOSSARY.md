# Sonus Domain Glossary

Adaptive Musical Practice System (PRISM) domain language for polyphonic instrument chord practice and longitudinal habit tracking.

## Language

**Take**:
A single recorded performance attempt of an exercise containing audio WAV data or detected chord events.
_Avoid_: Recording, submission, track, attempt

**Practice Session**:
A bounded learning activity tying a user to a specific musical exercise and target tempo.
_Avoid_: Workout, rehearsal, study session

**Exercise**:
A structured musical progression template specifying instrument, tempo, key, and chord sequence with reference MIDI pitch sets.
_Avoid_: Song, drill, score, track

**Session Chord Metric**:
An aligned performance measurement for a single chord occurrence within a take, recording onset timing error, voicing completeness, and strike duration.
_Avoid_: Note score, chord mark, evaluation point

**Voicing Completeness**:
The ratio (0.0 to 1.0) of required harmonic constituent notes that rang out clearly during a chord strike.
_Avoid_: Note accuracy, chord clarity, resonance factor

**Onset Timing Error**:
The millisecond difference between a player's chord strike attack and the reference metronome beat, where positive indicates rushing and negative indicates dragging.
_Avoid_: Latency delta, tempo offset, beat skew

**Habit Pattern**:
A persistent mechanical motor tendency (such as transition lag, tempo rushing, or voicing drop) detected across three or more historical practice sessions under specific conditions.
_Avoid_: Error pattern, bad habit, flaw, mistake

**Adaptive Intervention**:
A dynamically configured remedial drill (such as 2-chord transition isolation, arpeggio sweep, or subdivision click) targeted at reversing an active habit pattern.
_Avoid_: Remedial exercise, drill recommendation, homework

**Grounded Fact Bundle**:
A tamper-proof deterministic JSON collection of pre-computed mathematical performance facts passed to the AI coach to prevent hallucination.
_Avoid_: Context prompt, metrics dump, AI payload
