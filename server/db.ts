import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { SEED_EXERCISES } from './seed.ts'

const DATA_DIR = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'sonus.db')
export const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    onboarding_done INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instrument TEXT NOT NULL,
    tempo_bpm INTEGER NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 1,
    progression_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    tempo_bpm INTEGER NOT NULL,
    state TEXT NOT NULL,
    overall_accuracy REAL,
    avg_timing_error_ms REAL,
    voicing_score REAL,
    intervention_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session_chord_metrics (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    take_number INTEGER NOT NULL DEFAULT 1,
    chord_index INTEGER NOT NULL,
    expected_chord TEXT NOT NULL,
    detected_chord TEXT NOT NULL,
    is_matched INTEGER NOT NULL,
    onset_error_ms REAL NOT NULL,
    voicing_completeness REAL NOT NULL,
    missed_notes_json TEXT NOT NULL,
    extra_notes_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habit_patterns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    trigger_context TEXT NOT NULL,
    evidence_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'emerging',
    severity REAL NOT NULL DEFAULT 2.0,
    confidence REAL NOT NULL DEFAULT 0.7,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS adaptive_interventions (
    id TEXT PRIMARY KEY,
    pattern_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    drill_type TEXT NOT NULL,
    target_tempo INTEGER NOT NULL,
    target_repetitions INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    measured_improvement REAL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transition_mastery (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chord_from TEXT NOT NULL,
    chord_to TEXT NOT NULL,
    instrument TEXT NOT NULL,
    p_known REAL NOT NULL DEFAULT 0.2,
    is_mastered INTEGER NOT NULL DEFAULT 0,
    opportunities INTEGER NOT NULL DEFAULT 0,
    ewma_latency_ms REAL NOT NULL DEFAULT 0,
    voicing_completeness REAL NOT NULL DEFAULT 1.0,
    sm2_interval_days INTEGER NOT NULL DEFAULT 1,
    sm2_ease_factor REAL NOT NULL DEFAULT 2.5,
    sm2_repetitions INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TEXT NOT NULL,
    bandit_alpha_isolated REAL NOT NULL DEFAULT 1.0,
    bandit_beta_isolated REAL NOT NULL DEFAULT 1.0,
    bandit_alpha_subdivision REAL NOT NULL DEFAULT 1.0,
    bandit_beta_subdivision REAL NOT NULL DEFAULT 1.0,
    bandit_alpha_voicing REAL NOT NULL DEFAULT 1.0,
    bandit_beta_voicing REAL NOT NULL DEFAULT 1.0,
    bandit_alpha_ramp REAL NOT NULL DEFAULT 1.0,
    bandit_beta_ramp REAL NOT NULL DEFAULT 1.0
  );
`)

export function seedExercises(): void {
  const stmt = db.prepare(`
    INSERT INTO exercises (id, title, description, instrument, tempo_bpm, difficulty, progression_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      instrument = excluded.instrument,
      tempo_bpm = excluded.tempo_bpm,
      difficulty = excluded.difficulty,
      progression_json = excluded.progression_json
  `)
  for (const ex of SEED_EXERCISES) {
    stmt.run(
      ex.id,
      ex.title,
      ex.description,
      ex.instrument,
      ex.tempo_bpm,
      ex.difficulty,
      ex.progression_json
    )
  }
}

export type UserRow = {
  id: string
  name: string
  username: string
  email: string
  onboarding_done: boolean
  created_at: string
  updated_at: string
}

export function ensureUserExists(userId: string, email?: string): UserRow {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined
  if (existing) {
    return {
      id: String(existing.id),
      name: String(existing.name),
      username: String(existing.username),
      email: String(existing.email),
      onboarding_done: Boolean(existing.onboarding_done),
      created_at: String(existing.created_at),
      updated_at: String(existing.updated_at),
    }
  }

  const now = new Date().toISOString()
  const safeSuffix = userId.replace(/[^a-zA-Z0-9_]/g, '').slice(-8) || 'local'
  const row: UserRow = {
    id: userId,
    name: 'Studio Musician',
    username: `musician_${safeSuffix}`.toLowerCase().slice(0, 30),
    email: email || `${safeSuffix}@sonus.studio`,
    onboarding_done: true,
    created_at: now,
    updated_at: now,
  }

  db.prepare(`
    INSERT INTO users (id, name, username, email, onboarding_done, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(row.id, row.name, row.username, row.email, 1, row.created_at, row.updated_at)

  return row
}

seedExercises()
