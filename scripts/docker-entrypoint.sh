#!/usr/bin/env bash
set -e

# Auto-apply database migrations if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
    echo "[Sonus Entrypoint] Applying database migrations..."
    python -m alembic upgrade head || echo "[Sonus Entrypoint] Migration warning: could not run alembic upgrade head"
fi

# Hand off to CMD
exec "$@"
