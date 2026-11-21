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

# Upgrade build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install dependencies from pyproject.toml
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

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
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn src.services.api.app:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
