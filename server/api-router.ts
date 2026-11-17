import type { IncomingMessage, ServerResponse } from 'node:http'
import crypto from 'node:crypto'
import { db, ensureUserExists } from './db.ts'
import {
  alignChordSequence,
  buildCoachingReport,
  detectHabitsFromMetrics,
  extractPlayedChordsFromWav,
  parseWavBuffer,
  updateBkt,
  updateSm2,
  type ChordMetricRecord,
  type PlayedChordEvent,
  type ReferenceChord,
} from './practice-engine.ts'

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function sendProblem(res: ServerResponse, statusCode: number, title: string, detail: string): void {
  const body = JSON.stringify({
    type: 'about:blank',
    title,
    status: statusCode,
    detail,
  })
  res.writeHead(statusCode, {
    'Content-Type': 'application/problem+json; charset=utf-8',
  })
  res.end(body)
}

async function readRawBody(req: IncomingMessage, maxBytes = 16 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > maxBytes) {
      throw new Error('Request payload exceeds maximum 16 MB limit')
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function resolveUserIdentity(req: IncomingMessage): { userId: string; email?: string } {
  const auth = req.headers.authorization ?? ''
  const defaultId = process.env.DEV_USER_ID || 'user_studio_local'
  const defaultEmail = process.env.DEV_USER_EMAIL || 'musician@sonus.studio'

  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim()
    if (!token || token === 'dev' || token === 'dev_token' || token === 'dev-token') {
      return { userId: defaultId, email: defaultEmail }
    }
    const parts = token.split('.')
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
          sub?: string
          email?: string
        }
        if (typeof payload.sub === 'string' && payload.sub) {
          return { userId: payload.sub, email: payload.email }
        }
      } catch {
        // Fallback to local studio user if token cannot be decoded locally
      }
    }
    return { userId: defaultId, email: defaultEmail }
  }
  return { userId: defaultId, email: defaultEmail }
}

function parseReferenceChords(progressionJson: string): ReferenceChord[] {
  try {
    const parsed = JSON.parse(progressionJson) as { chords?: ReferenceChord[] } | ReferenceChord[]
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.chords)) return parsed.chords
  } catch {
    // ignore
  }
  return []
}

function mapTransitionRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    chord_from: String(r.chord_from),
    chord_to: String(r.chord_to),
    instrument: String(r.instrument),
    p_known: Number(r.p_known),
    is_mastered: Boolean(r.is_mastered),
    opportunities: Number(r.opportunities),
    ewma_latency_ms: Number(r.ewma_latency_ms),
    voicing_completeness: Number(r.voicing_completeness),
    sm2_interval_days: Number(r.sm2_interval_days),
    sm2_ease_factor: Number(r.sm2_ease_factor),
    sm2_repetitions: Number(r.sm2_repetitions),
    last_practiced_at: String(r.last_practiced_at),
    bandit_alpha_isolated: Number(r.bandit_alpha_isolated),
    bandit_beta_isolated: Number(r.bandit_beta_isolated),
    bandit_alpha_subdivision: Number(r.bandit_alpha_subdivision),
    bandit_beta_subdivision: Number(r.bandit_beta_subdivision),
    bandit_alpha_voicing: Number(r.bandit_alpha_voicing),
    bandit_beta_voicing: Number(r.bandit_beta_voicing),
    bandit_alpha_ramp: Number(r.bandit_alpha_ramp),
    bandit_beta_ramp: Number(r.bandit_beta_ramp),
  }
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const rawUrl = req.url || '/'
  const url = new URL(rawUrl, 'http://localhost')
  const pathname = url.pathname
  const method = (req.method || 'GET').toUpperCase()

  if (pathname === '/health' || pathname === '/api/health') {
    try {
      db.prepare('SELECT 1 AS ok').get()
      sendJson(res, 200, { status: 'ok', database: 'sqlite' })
    } catch (err) {
      sendProblem(res, 500, 'Database Error', err instanceof Error ? err.message : 'Health check failed')
    }
    return true
  }

  if (!pathname.startsWith('/api')) {
    return false
  }

  const identity = resolveUserIdentity(req)
  const user = ensureUserExists(identity.userId, identity.email)

  try {
    // ── EXERCISES ─────────────────────────────────────────────────────────────
    if (pathname === '/api/exercises' && method === 'GET') {
      const instrument = url.searchParams.get('instrument')?.toLowerCase()
      const difficulty = url.searchParams.get('difficulty')?.toLowerCase()
      const search = url.searchParams.get('search')?.toLowerCase()

      const rows = db
        .prepare('SELECT * FROM exercises ORDER BY difficulty ASC, title ASC')
        .all() as Array<Record<string, unknown>>

      const filtered = rows.filter((row) => {
        if (instrument && String(row.instrument).toLowerCase() !== instrument) return false
        if (difficulty) {
          const d = Number(row.difficulty)
          if (/^\d+$/.test(difficulty) && d !== Number(difficulty)) return false
          if (difficulty === 'beginner' && (d < 1 || d > 2)) return false
          if (difficulty === 'intermediate' && d !== 3) return false
          if (difficulty === 'advanced' && d < 4) return false
        }
        if (search) {
          const hay = `${row.title} ${row.description ?? ''}`.toLowerCase()
          if (!hay.includes(search)) return false
        }
        return true
      })

      sendJson(res, 200, filtered)
      return true
    }

    const exerciseDetailMatch = /^\/api\/exercises\/([^/]+)$/.exec(pathname)
    if (exerciseDetailMatch && method === 'GET') {
      const exId = decodeURIComponent(exerciseDetailMatch[1])
      const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exId) as
        | Record<string, unknown>
        | undefined
      if (!row) {
        sendProblem(res, 404, 'Not Found', `Exercise '${exId}' not found`)
        return true
      }
      let progression: Record<string, unknown> = {
        default_tempo_bpm: Number(row.tempo_bpm),
        chords: [],
      }
      try {
        const parsed = JSON.parse(String(row.progression_json))
        progression = Array.isArray(parsed)
          ? { default_tempo_bpm: Number(row.tempo_bpm), chords: parsed }
          : parsed
      } catch {
        // fallback
      }
      sendJson(res, 200, {
        id: row.id,
        title: row.title,
        description: row.description,
        instrument: row.instrument,
        tempo_bpm: row.tempo_bpm,
        difficulty: row.difficulty,
        progression,
      })
      return true
    }

    if (pathname === '/api/exercises' && method === 'POST') {
      const raw = await readRawBody(req)
      const body = JSON.parse(raw.toString('utf8')) as {
        title?: string
        description?: string
        instrument?: string
        tempo_bpm?: number
        difficulty?: number
        progression?: unknown
      }
      if (!body.title || !body.instrument) {
        sendProblem(res, 422, 'Validation Error', 'title and instrument are required')
        return true
      }
      const id = `ex_custom_${crypto.randomBytes(6).toString('hex')}`
      const tempoBpm = Number(body.tempo_bpm || 80)
      const difficulty = Number(body.difficulty || 2)
      const progJson = JSON.stringify(body.progression ?? { default_tempo_bpm: tempoBpm, chords: [] })

      db.prepare(
        `INSERT INTO exercises (id, title, description, instrument, tempo_bpm, difficulty, progression_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, body.title, body.description ?? null, body.instrument, tempoBpm, difficulty, progJson)

      sendJson(res, 201, {
        id,
        title: body.title,
        description: body.description ?? null,
        instrument: body.instrument,
        tempo_bpm: tempoBpm,
        difficulty,
        progression: body.progression ?? { default_tempo_bpm: tempoBpm, chords: [] },
      })
      return true
    }

    // ── ME / USER ROUTES ──────────────────────────────────────────────────────
    if (pathname === '/api/me' && method === 'GET') {
      sendJson(res, 200, user)
      return true
    }

    if (pathname === '/api/me' && (method === 'PATCH' || method === 'POST')) {
      const raw = await readRawBody(req)
      const body = JSON.parse(raw.toString('utf8')) as {
        name?: string
        username?: string
        onboarding_done?: boolean
      }
      const nextName = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : user.name
      const nextUsername =
        typeof body.username === 'string' && /^[a-zA-Z0-9_]{3,30}$/.test(body.username.trim())
          ? body.username.trim().toLowerCase()
          : user.username
      const nextOnboarding =
        typeof body.onboarding_done === 'boolean' ? (body.onboarding_done ? 1 : 0) : user.onboarding_done ? 1 : 0
      const now = new Date().toISOString()

      db.prepare(
        'UPDATE users SET name = ?, username = ?, onboarding_done = ?, updated_at = ? WHERE id = ?'
      ).run(nextName, nextUsername, nextOnboarding, now, user.id)

      const updated = ensureUserExists(user.id)
      sendJson(res, method === 'POST' ? 201 : 200, updated)
      return true
    }

    if (pathname === '/api/me/sessions' && method === 'GET') {
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
      const rows = db
        .prepare(
          `SELECT ps.*, e.title AS exercise_title, e.instrument AS exercise_instrument
           FROM practice_sessions ps
           LEFT JOIN exercises e ON ps.exercise_id = e.id
           WHERE ps.user_id = ?
           ORDER BY ps.created_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(user.id, limit, offset) as Array<Record<string, unknown>>

      sendJson(
        res,
        200,
        rows.map((r) => ({
          id: r.id,
          exercise_id: r.exercise_id,
          exercise_title: r.exercise_title || 'Custom Exercise',
          instrument: r.exercise_instrument || 'piano',
          tempo_bpm: Number(r.tempo_bpm),
          state: r.state,
          overall_accuracy: r.overall_accuracy !== null ? Number(r.overall_accuracy) : null,
          avg_timing_error_ms: r.avg_timing_error_ms !== null ? Number(r.avg_timing_error_ms) : null,
          voicing_score: r.voicing_score !== null ? Number(r.voicing_score) : null,
          created_at: r.created_at,
        }))
      )
      return true
    }

    if (pathname === '/api/me/stats' && method === 'GET') {
      const agg = db
        .prepare(
          `SELECT
             COUNT(id) AS total_count,
             AVG(overall_accuracy) AS avg_acc,
             AVG(avg_timing_error_ms) AS avg_timing,
             AVG(voicing_score) AS avg_voicing
           FROM practice_sessions
           WHERE user_id = ? AND state = 'completed'`
        )
        .get(user.id) as Record<string, unknown>

      const habitsCount = db
        .prepare('SELECT COUNT(*) AS cnt FROM habit_patterns WHERE user_id = ?')
        .get(user.id) as { cnt: number }

      const interventionsCount = db
        .prepare('SELECT COUNT(*) AS cnt FROM adaptive_interventions WHERE user_id = ? AND completed = 1')
        .get(user.id) as { cnt: number }

      const total = Number(agg.total_count || 0)
      const rawAcc = agg.avg_acc !== null ? Number(agg.avg_acc) : 0
      const accPct = rawAcc <= 1 ? rawAcc * 100 : rawAcc

      sendJson(res, 200, {
        user_id: user.id,
        total_sessions_completed: total,
        overall_accuracy_pct: Number(accPct.toFixed(1)),
        avg_timing_error_ms: Number(Number(agg.avg_timing || 0).toFixed(1)),
        avg_voicing_score: Number(Number(agg.avg_voicing || 0).toFixed(2)),
        active_habits_count: Number(habitsCount.cnt || 0),
        interventions_completed: Number(interventionsCount.cnt || 0),
        streak_days: total > 0 ? Math.min(total, 3) : 0,
      })
      return true
    }

    if (pathname === '/api/me/habits' && method === 'GET') {
      const rows = db
        .prepare('SELECT * FROM habit_patterns WHERE user_id = ? ORDER BY evidence_count DESC')
        .all(user.id)
      sendJson(res, 200, rows)
      return true
    }

    if (pathname === '/api/me/interventions' && method === 'GET') {
      const rows = db
        .prepare('SELECT * FROM adaptive_interventions WHERE user_id = ? ORDER BY created_at DESC')
        .all(user.id) as Array<Record<string, unknown>>
      sendJson(
        res,
        200,
        rows.map((r) => ({
          ...r,
          completed: Boolean(r.completed),
        }))
      )
      return true
    }

    if (pathname === '/api/me/mastery' && method === 'GET') {
      const rows = db
        .prepare(
          'SELECT * FROM transition_mastery WHERE user_id = ? ORDER BY p_known ASC, ewma_latency_ms DESC'
        )
        .all(user.id) as Array<Record<string, unknown>>

      const records = rows.map(mapTransitionRow)
      const recommendations = records.slice(0, 5).map((r, idx) => {
        const learningGap = Math.round((1 - r.p_known) * 100)
        const priorityScore = Number(
          ((1 - r.p_known) * 60 + Math.min(40, r.ewma_latency_ms / 4)).toFixed(1)
        )
        const strategy =
          r.ewma_latency_ms >= 90
            ? 'isolated_transition'
            : r.voicing_completeness < 0.85
            ? 'voicing_arpeggio'
            : 'gradual_tempo_ramp'
        return {
          id: r.id,
          rank: idx + 1,
          transition_label: `${r.chord_from} → ${r.chord_to}`,
          chord_from: r.chord_from,
          chord_to: r.chord_to,
          instrument: r.instrument,
          priority_score: priorityScore,
          p_known: r.p_known,
          learning_gap_pct: learningGap,
          ewma_latency_ms: r.ewma_latency_ms,
          voicing_completeness_pct: Math.round(r.voicing_completeness * 100),
          selected_drill_strategy: strategy,
          recommended_bpm: 60,
          mathematical_breakdown: `BKT gap ${learningGap}%, EWMA latency ${Math.round(r.ewma_latency_ms)}ms`,
        }
      })

      sendJson(res, 200, { records, recommendations })
      return true
    }

    // ── SESSIONS ROUTES ───────────────────────────────────────────────────────
    if (pathname === '/api/sessions' && method === 'POST') {
      const raw = await readRawBody(req)
      const body = JSON.parse(raw.toString('utf8')) as {
        exercise_id?: string
        tempo_bpm?: number
        intervention_id?: string
      }
      if (!body.exercise_id) {
        sendProblem(res, 422, 'Validation Error', 'exercise_id is required')
        return true
      }

      const exercise = db
        .prepare('SELECT * FROM exercises WHERE id = ?')
        .get(body.exercise_id) as Record<string, unknown> | undefined
      if (!exercise) {
        sendProblem(res, 404, 'Not Found', 'Exercise not found')
        return true
      }

      const now = new Date().toISOString()
      const sessionId = `sess_${crypto.randomBytes(8).toString('hex')}`
      const tempoBpm = Number(body.tempo_bpm || exercise.tempo_bpm || 80)

      db.prepare(
        `INSERT INTO practice_sessions (id, user_id, exercise_id, tempo_bpm, state, intervention_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'recording', ?, ?, ?)`
      ).run(sessionId, user.id, body.exercise_id, tempoBpm, body.intervention_id ?? null, now, now)

      sendJson(res, 201, {
        id: sessionId,
        user_id: user.id,
        exercise_id: body.exercise_id,
        tempo_bpm: tempoBpm,
        state: 'recording',
        intervention_id: body.intervention_id ?? null,
        created_at: now,
        updated_at: now,
      })
      return true
    }

    const sessionGetMatch = /^\/api\/sessions\/([^/]+)$/.exec(pathname)
    if (sessionGetMatch && method === 'GET') {
      const sessionId = decodeURIComponent(sessionGetMatch[1])
      const row = db
        .prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, user.id)
      if (!row) {
        sendProblem(res, 404, 'Not Found', 'Practice session not found')
        return true
      }
      sendJson(res, 200, row)
      return true
    }

    const sessionTakeMatch = /^\/api\/sessions\/([^/]+)\/takes?$/.exec(pathname)
    if (sessionTakeMatch && method === 'POST') {
      const sessionId = decodeURIComponent(sessionTakeMatch[1])
      const practiceSession = db
        .prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, user.id) as Record<string, unknown> | undefined
      if (!practiceSession) {
        sendProblem(res, 404, 'Not Found', 'Practice session not found')
        return true
      }

      const exercise = db
        .prepare('SELECT * FROM exercises WHERE id = ?')
        .get(String(practiceSession.exercise_id)) as Record<string, unknown> | undefined
      if (!exercise) {
        sendProblem(res, 404, 'Not Found', 'Associated exercise not found')
        return true
      }

      const refChords = parseReferenceChords(String(exercise.progression_json))
      const contentType = (req.headers['content-type'] || '').toLowerCase()
      const rawBuffer = await readRawBody(req)
      let tempoBpm = Number(practiceSession.tempo_bpm || exercise.tempo_bpm || 80)
      let playedChords: PlayedChordEvent[] = []

      if (contentType.includes('multipart/form-data')) {
        const webReq = new Request('http://localhost/take', {
          method: 'POST',
          headers: { 'content-type': req.headers['content-type'] || '' },
          body: new Uint8Array(rawBuffer),
        })
        const formData = await webReq.formData()
        const fileEntry = formData.get('audio_file') ?? formData.get('file')
        if (!(fileEntry instanceof File)) {
          sendProblem(res, 422, 'Validation Error', 'Missing audio_file or file in multipart form')
          return true
        }
        const rawTempo = formData.get('tempo_bpm')
        if (typeof rawTempo === 'string' && Number(rawTempo) > 0) {
          tempoBpm = Number(rawTempo)
        }
        const wavBuf = Buffer.from(await fileEntry.arrayBuffer())
        try {
          const wav = parseWavBuffer(wavBuf)
          playedChords = extractPlayedChordsFromWav(wav, refChords, tempoBpm)
        } catch (err) {
          sendProblem(res, 422, 'Invalid Audio', err instanceof Error ? err.message : 'Invalid WAV audio')
          return true
        }
      } else if (contentType.includes('application/json')) {
        const jsonBody = JSON.parse(rawBuffer.toString('utf8')) as {
          played_chords?: PlayedChordEvent[]
          chords?: PlayedChordEvent[]
          tempo_bpm?: number
        }
        const list = jsonBody.played_chords ?? jsonBody.chords
        if (!Array.isArray(list)) {
          sendProblem(res, 422, 'Validation Error', "JSON body must contain 'played_chords' or 'chords' list")
          return true
        }
        playedChords = list
        if (typeof jsonBody.tempo_bpm === 'number' && jsonBody.tempo_bpm > 0) {
          tempoBpm = jsonBody.tempo_bpm
        }
      } else {
        sendProblem(res, 422, 'Unsupported Media Type', 'Content-Type must be application/json or multipart/form-data')
        return true
      }

      // Align against the relevant slice of reference chords if user submitted a partial take
      const targetRefs =
        playedChords.length > 0 && playedChords.length < refChords.length
          ? refChords.slice(0, Math.max(playedChords.length, Math.min(8, refChords.length)))
          : refChords

      const metrics: ChordMetricRecord[] = alignChordSequence(playedChords, targetRefs, tempoBpm)
      const matched = metrics.filter((m) => m.is_matched)
      const overallAccuracy = metrics.length > 0 ? matched.length / metrics.length : 0
      const avgTimingErrorMs =
        matched.length > 0
          ? matched.reduce((acc, m) => acc + Math.abs(m.onset_error_ms), 0) / matched.length
          : 0
      const voicingScore =
        matched.length > 0
          ? matched.reduce((acc, m) => acc + m.voicing_completeness, 0) / matched.length
          : 0

      const habits = detectHabitsFromMetrics(metrics)
      const coachingReport = buildCoachingReport({
        sessionId,
        metrics,
        habits,
        instrument: String(exercise.instrument),
        tempoBpm,
      })

      const now = new Date().toISOString()
      const maxTakeRow = db
        .prepare('SELECT COALESCE(MAX(take_number), 0) AS max_take FROM session_chord_metrics WHERE session_id = ?')
        .get(sessionId) as { max_take: number }
      const nextTake = Number(maxTakeRow.max_take || 0) + 1

      db.prepare(
        `UPDATE practice_sessions
         SET tempo_bpm = ?, state = 'completed', overall_accuracy = ?, avg_timing_error_ms = ?, voicing_score = ?, updated_at = ?
         WHERE id = ?`
      ).run(tempoBpm, overallAccuracy, avgTimingErrorMs, voicingScore, now, sessionId)

      const insertMetric = db.prepare(
        `INSERT INTO session_chord_metrics
         (id, session_id, take_number, chord_index, expected_chord, detected_chord, is_matched, onset_error_ms, voicing_completeness, missed_notes_json, extra_notes_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const m of metrics) {
        insertMetric.run(
          `scm_${crypto.randomBytes(6).toString('hex')}`,
          sessionId,
          nextTake,
          m.chord_index,
          m.expected_chord,
          m.detected_chord,
          m.is_matched ? 1 : 0,
          m.onset_error_ms,
          m.voicing_completeness,
          JSON.stringify(m.missed_notes),
          JSON.stringify(m.extra_notes)
        )
      }

      for (const h of habits) {
        const existingHabit = db
          .prepare('SELECT * FROM habit_patterns WHERE user_id = ? AND pattern_type = ? AND trigger_context = ?')
          .get(user.id, h.pattern_type, h.context) as Record<string, unknown> | undefined
        if (existingHabit) {
          const nextEv = Number(existingHabit.evidence_count) + h.evidence_count
          db.prepare(
            'UPDATE habit_patterns SET evidence_count = ?, status = ?, severity = ?, confidence = ?, updated_at = ? WHERE id = ?'
          ).run(nextEv, nextEv >= 3 ? 'active' : h.status, h.severity, h.confidence, now, String(existingHabit.id))
        } else {
          db.prepare(
            `INSERT INTO habit_patterns (id, user_id, pattern_type, trigger_context, evidence_count, status, severity, confidence, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            `hab_${crypto.randomBytes(6).toString('hex')}`,
            user.id,
            h.pattern_type,
            h.context,
            h.evidence_count,
            h.status,
            h.severity,
            h.confidence,
            now
          )
        }
      }

      // Update BKT + SM-2 transition mastery
      for (let idx = 0; idx < metrics.length - 1; idx++) {
        const from = metrics[idx].expected_chord
        const to = metrics[idx + 1].expected_chord
        if (!from || !to || from === to) continue
        const mTo = metrics[idx + 1]
        const absLag = Math.abs(mTo.onset_error_ms)
        const isClean = mTo.is_matched && absLag <= 60 && mTo.voicing_completeness >= 0.85
        const quality = isClean ? 5 : mTo.is_matched ? 3 : 1

        const existingTm = db
          .prepare(
            'SELECT * FROM transition_mastery WHERE user_id = ? AND chord_from = ? AND chord_to = ? AND instrument = ?'
          )
          .get(user.id, from, to, String(exercise.instrument)) as Record<string, unknown> | undefined

        if (existingTm) {
          const bkt = updateBkt(Number(existingTm.p_known), isClean)
          const sm2 = updateSm2(
            Number(existingTm.sm2_interval_days),
            Number(existingTm.sm2_ease_factor),
            Number(existingTm.sm2_repetitions),
            quality
          )
          const nextEwma = Number((0.35 * absLag + 0.65 * Number(existingTm.ewma_latency_ms)).toFixed(1))
          const nextVox = Number(
            (0.35 * mTo.voicing_completeness + 0.65 * Number(existingTm.voicing_completeness)).toFixed(3)
          )
          db.prepare(
            `UPDATE transition_mastery
             SET p_known = ?, is_mastered = ?, opportunities = opportunities + 1,
                 ewma_latency_ms = ?, voicing_completeness = ?,
                 sm2_interval_days = ?, sm2_ease_factor = ?, sm2_repetitions = ?, last_practiced_at = ?
             WHERE id = ?`
          ).run(
            bkt.pKnown,
            bkt.isMastered ? 1 : 0,
            nextEwma,
            nextVox,
            sm2.intervalDays,
            sm2.easeFactor,
            sm2.repetitions,
            now,
            String(existingTm.id)
          )
        } else {
          const bkt = updateBkt(0.2, isClean)
          const sm2 = updateSm2(1, 2.5, 0, quality)
          db.prepare(
            `INSERT INTO transition_mastery
             (id, user_id, chord_from, chord_to, instrument, p_known, is_mastered, opportunities, ewma_latency_ms, voicing_completeness, sm2_interval_days, sm2_ease_factor, sm2_repetitions, last_practiced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
          ).run(
            `tm_${crypto.randomBytes(6).toString('hex')}`,
            user.id,
            from,
            to,
            String(exercise.instrument),
            bkt.pKnown,
            bkt.isMastered ? 1 : 0,
            Number(absLag.toFixed(1)),
            mTo.voicing_completeness,
            sm2.intervalDays,
            sm2.easeFactor,
            sm2.repetitions,
            now
          )
        }
      }

      sendJson(res, 200, {
        session_id: sessionId,
        state: 'completed',
        analysis_status: 'complete',
        overall_accuracy: Number((overallAccuracy * 100).toFixed(1)),
        avg_timing_error_ms: Number(avgTimingErrorMs.toFixed(2)),
        voicing_score: Number(voicingScore.toFixed(3)),
        chord_metrics: metrics,
        coaching_report: coachingReport,
      })
      return true
    }

    const sessionAnalysisMatch = /^\/api\/sessions\/([^/]+)\/analysis$/.exec(pathname)
    if (sessionAnalysisMatch && method === 'GET') {
      const sessionId = decodeURIComponent(sessionAnalysisMatch[1])
      const practiceSession = db
        .prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, user.id)
      if (!practiceSession) {
        sendProblem(res, 404, 'Not Found', 'Practice session not found')
        return true
      }

      const reqTake = url.searchParams.get('take_number')
      let takeNumber = reqTake ? Number(reqTake) : 0
      if (!takeNumber) {
        const row = db
          .prepare('SELECT COALESCE(MAX(take_number), 1) AS t FROM session_chord_metrics WHERE session_id = ?')
          .get(sessionId) as { t: number }
        takeNumber = row.t
      }

      const rawMetrics = db
        .prepare(
          'SELECT * FROM session_chord_metrics WHERE session_id = ? AND take_number = ? ORDER BY chord_index ASC'
        )
        .all(sessionId, takeNumber) as Array<Record<string, unknown>>

      const chordMetrics = rawMetrics.map((m) => ({
        chord_index: Number(m.chord_index),
        expected_chord: String(m.expected_chord),
        detected_chord: String(m.detected_chord),
        is_matched: Boolean(m.is_matched),
        onset_error_ms: Number(m.onset_error_ms),
        voicing_completeness: Number(m.voicing_completeness),
        missed_notes: JSON.parse(String(m.missed_notes_json || '[]')),
        extra_notes: JSON.parse(String(m.extra_notes_json || '[]')),
      }))

      sendJson(res, 200, {
        session: practiceSession,
        chord_metrics: chordMetrics,
      })
      return true
    }

    const sessionCoachingMatch = /^\/api\/sessions\/([^/]+)\/coaching$/.exec(pathname)
    if (sessionCoachingMatch && method === 'GET') {
      const sessionId = decodeURIComponent(sessionCoachingMatch[1])
      const practiceSession = db
        .prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, user.id) as Record<string, unknown> | undefined
      if (!practiceSession) {
        sendProblem(res, 404, 'Not Found', 'Practice session not found')
        return true
      }
      const exercise = db
        .prepare('SELECT instrument FROM exercises WHERE id = ?')
        .get(String(practiceSession.exercise_id)) as { instrument?: string } | undefined

      const rawMetrics = db
        .prepare('SELECT * FROM session_chord_metrics WHERE session_id = ? ORDER BY chord_index ASC')
        .all(sessionId) as Array<Record<string, unknown>>

      const metrics: ChordMetricRecord[] = rawMetrics.map((m) => ({
        chord_index: Number(m.chord_index),
        expected_chord: String(m.expected_chord),
        detected_chord: String(m.detected_chord),
        is_matched: Boolean(m.is_matched),
        onset_error_ms: Number(m.onset_error_ms),
        voicing_completeness: Number(m.voicing_completeness),
        missed_notes: JSON.parse(String(m.missed_notes_json || '[]')),
        extra_notes: JSON.parse(String(m.extra_notes_json || '[]')),
      }))

      const habits = detectHabitsFromMetrics(metrics)
      const report = buildCoachingReport({
        sessionId,
        metrics,
        habits,
        instrument: exercise?.instrument || 'piano',
        tempoBpm: Number(practiceSession.tempo_bpm || 80),
      })
      sendJson(res, 200, report)
      return true
    }

    const sessionDrillMatch = /^\/api\/sessions\/([^/]+)\/drill$/.exec(pathname)
    if (sessionDrillMatch && method === 'POST') {
      const sessionId = decodeURIComponent(sessionDrillMatch[1])
      const practiceSession = db
        .prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
        .get(sessionId, user.id) as Record<string, unknown> | undefined
      if (!practiceSession) {
        sendProblem(res, 404, 'Not Found', 'Practice session not found')
        return true
      }
      const habit = db
        .prepare('SELECT * FROM habit_patterns WHERE user_id = ? ORDER BY evidence_count DESC LIMIT 1')
        .get(user.id) as Record<string, unknown> | undefined

      const id = `int_${crypto.randomBytes(6).toString('hex')}`
      const patternId = habit ? String(habit.id) : `pat_default_${sessionId.slice(0, 6)}`
      const drillType =
        habit?.pattern_type === 'voicing_drop'
          ? 'voicing_arpeggio'
          : habit?.pattern_type === 'tempo_rushing' || habit?.pattern_type === 'tempo_dragging'
          ? 'subdivision_click'
          : 'isolated_transition'
      const targetTempo = Math.max(40, Math.round(Number(practiceSession.tempo_bpm || 80) * 0.7))
      const now = new Date().toISOString()

      db.prepare(
        `INSERT INTO adaptive_interventions (id, pattern_id, user_id, drill_type, target_tempo, target_repetitions, completed, created_at)
         VALUES (?, ?, ?, ?, ?, 6, 0, ?)`
      ).run(id, patternId, user.id, drillType, targetTempo, now)

      sendJson(res, 201, {
        id,
        pattern_id: patternId,
        user_id: user.id,
        drill_type: drillType,
        target_tempo: targetTempo,
        target_repetitions: 6,
        completed: false,
        measured_improvement: null,
      })
      return true
    }

    sendProblem(res, 404, 'Not Found', `Unknown API route: ${method} ${pathname}`)
    return true
  } catch (err) {
    sendProblem(res, 500, 'Internal Server Error', err instanceof Error ? err.message : 'Unexpected server error')
    return true
  }
}
