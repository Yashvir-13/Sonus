# Production Dockerfile for Sonus Adaptive Music Practice API
FROM python:3.12-slim

# Install system audio codecs and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv binary from official image for fast, package-mode-agnostic dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install dependencies from pyproject.toml using uv
COPY pyproject.toml README.md ./
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application source, migrations, and scripts
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY alembic.ini ./

# Pre-warm neural audio transcription weights during build to eliminate runtime latency
RUN python -c "from src.lib.audio.transcription import warmup_transcription_engine; warmup_transcription_engine()" || true

# Make entrypoint executable
RUN chmod +x scripts/docker-entrypoint.sh

# Run as non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV FORWARDED_ALLOW_IPS="127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,100.64.0.0/10"
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health/live || exit 1

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn src.services.api.app:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips=${FORWARDED_ALLOW_IPS}"]
