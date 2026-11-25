#!/usr/bin/env bash
set -euo pipefail

# Apply database migrations and idempotent catalog seed when DB config is provided
if [ -n "${DATABASE_URL:-}" ] || [ -n "${DATABASE_URL_POOLED:-}" ] || [ -n "${DATABASE_HOST:-}" ]; then
    echo "[Sonus Entrypoint] Applying database migrations..."
    if ! python -m alembic upgrade head; then
        echo "[Sonus Entrypoint] ERROR: alembic upgrade head failed!" >&2
        exit 1
    fi

    echo "[Sonus Entrypoint] Seeding canonical exercise catalog..."
    if ! python scripts/seed_exercises.py; then
        echo "[Sonus Entrypoint] ERROR: scripts/seed_exercises.py failed!" >&2
        exit 1
    fi
else
    echo "[Sonus Entrypoint] WARNING: No DATABASE_URL/DATABASE_URL_POOLED/DATABASE_HOST set; skipping migrations and seed." >&2
fi

# Hand off to CMD
exec "$@"
