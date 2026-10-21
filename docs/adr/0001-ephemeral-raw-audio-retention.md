# 1. Ephemeral Raw Audio Processing with Zero Audio Retention

Date: 2026-10-21  
Status: Accepted

## Context

Musicians practicing at home with microphones inadvertently capture ambient room acoustics, private background conversations, and family activities. Furthermore, storing uncompressed or lossless acoustic audio recordings across thousands of repeated user takes incurs non-trivial cloud storage costs and creates substantial GDPR/CCPA compliance overhead.

We considered two alternatives:
1. Upload and persist all raw WAV takes to S3/Supabase Storage with presigned playback URLs.
2. Ephemeral audio stream processing: extract discrete musical events (MIDI notes, onset timestamps, amplitudes) in-memory or in a temporary file, evaluate the take, and permanently delete the raw audio immediately.

## Decision

We chose **ephemeral audio processing with zero raw audio retention**. Raw audio uploaded to `POST /api/sessions/{id}/take` or `POST /api/audio/test-transcribe` is written only to a secure temporary file, processed by Spotify Basic Pitch, and immediately unlinked and deleted in a `finally` block. 

Only symbolic mathematical artifacts (`SessionChordMetric`, aligned pitch sets, onset timing offsets in milliseconds) are persisted in PostgreSQL.

## Consequences

- **Privacy & Compliance**: Users enjoy absolute acoustic privacy; no room audio or voice recordings are ever stored on servers or cloud databases.
- **Infrastructure & Cost**: Storage requirements for practice history scale in kilobytes of PostgreSQL rows rather than gigabytes of audio blobs.
- **Trade-off**: The user cannot play back the raw acoustic recording of a past take for auditory self-listening; they can only inspect the symbolic timing and voicing charts.
