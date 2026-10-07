# PRISM Backend Roadmap (Learning Guide)

This roadmap is designed for you to build the Python backend step-by-step. The frontend is already set up to point to `http://127.0.0.1:8000`.

## Prerequisite: Python Environment
The `pnpm run dev` command failed on the `service:api` step because we haven't created the Python virtual environment yet. 

1. Install dependencies and create the `.venv`:
   ```bash
   # If you use Poetry:
   poetry install
   # OR if you use standard pip/uv:
   uv venv
   uv pip install -r requirements.txt # (you will create this later)
   ```
2. Once the `.venv` folder exists, `pnpm run dev` will successfully start the API alongside the frontend.

---

## Phase 1: The API & Database Foundation
**Goal:** Serve the basic endpoints and connect to a PostgreSQL database.

1. **Setup FastAPI (`src/services/api/app.py`):** 
   Initialize the FastAPI app, configure CORS to allow `http://localhost:5173`, and create a basic `/health` route.
2. **Define Models (`src/models/`):** 
   Use **SQLModel** to define your database tables.
   - `User`: Basic user info (ID from Clerk).
   - `Exercise`: Expected notes & tempo for a specific practice piece.
   - `PracticeSession`: Links a user to an exercise.
3. **Migrations:** 
   Configure **Alembic** (`alembic.ini` and `env.py`). Use `pnpm run db:make "init"` to generate your first migration and `pnpm run db:upgrade` to create the tables in Postgres.
4. **Basic Endpoints:** 
   - `POST /sessions` to initialize a new practice run.
   - `GET /exercises` to fetch available practice sheets.

---

## Phase 2: Audio Ingestion & Background Workers
**Goal:** Safely accept WAV audio blobs and queue them for heavy processing.

1. **Upload Endpoint (`src/services/api/routes/sessions.py`):** 
   Create `POST /sessions/{id}/upload` accepting a `UploadFile` (the WAV blob from the browser frontend) and save it temporarily to disk.
2. **Setup Redis & RQ:** 
   Run a local Redis server (e.g., via Docker or native Windows Redis). Install `rq` in your Python environment.
3. **The Worker (`src/services/worker/worker.py`):** 
   Write a script that listens to the Redis queue. Start it in a separate terminal.
4. **Queue the Job:** 
   In your upload endpoint, enqueue the audio processing function and immediately return a `202 Accepted` status to the frontend.

---

## Phase 3: The Audio Analysis Engine (The Core)
**Goal:** Process the raw audio into musical notes. Write pure Python functions that the RQ worker executes.

1. **Pitch Detection:** 
   Load the audio using `librosa`. Use `librosa.pyin` (or the **SwiftF0** ONNX model) to extract fundamental frequencies (F0) across time.
2. **Segmentation:** 
   Use `librosa.onset.onset_detect` to find where the player actually plucked/blew a note.
3. **Dynamic Time Warping (DTW):** 
   Use `librosa.sequence.dtw` to align the player's messy array of played notes against the clean array of expected notes from the database.
4. **Calculate Errors:** 
   For every matched note, calculate how far off it is (pitch error in cents, timing error in milliseconds).

---

## Phase 4: Adaptive Patterns & API Delivery
**Goal:** Provide feedback based on multiple sessions.

1. **Pattern Engine (`src/analysis/core/pattern_engine.py`):** 
   Write a function that queries a user's past 5 sessions. If they consistently play `F4` 20 cents flat when the tempo is > 100 BPM, flag it as a `Pattern`.
2. **Results Endpoint:** 
   Create `GET /sessions/{id}/analysis` for the frontend to fetch the final stats, the DTW alignment data, and the flagged patterns.
