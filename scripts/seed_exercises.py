"""Database seeder for reference guitar and piano exercises."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

# Ensure root is in PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from src.lib.db import sync_database_url
from src.lib.music.seed_data import SEED_EXERCISES
from src.models.practice import Exercise

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def seed_exercises() -> None:
    """Upsert reference exercises into the database using psycopg2 sync engine."""
    url = sync_database_url()
    engine = create_engine(url, pool_pre_ping=True)

    with Session(engine) as session:
        for data in SEED_EXERCISES:
            exercise_id = data["id"]
            existing = session.get(Exercise, exercise_id)
            if existing:
                logger.info("Updating existing exercise: %s (%s)", data["title"], exercise_id)
                existing.title = data["title"]
                existing.description = data["description"]
                existing.instrument = data["instrument"]
                existing.tempo_bpm = data["tempo_bpm"]
                existing.difficulty = data["difficulty"]
                existing.progression_json = data["progression_json"]
            else:
                logger.info("Creating new exercise: %s (%s)", data["title"], exercise_id)
                new_ex = Exercise(
                    id=data["id"],
                    title=data["title"],
                    description=data["description"],
                    instrument=data["instrument"],
                    tempo_bpm=data["tempo_bpm"],
                    difficulty=data["difficulty"],
                    progression_json=data["progression_json"],
                )
                session.add(new_ex)

        session.commit()
        logger.info("Successfully seeded %d exercises.", len(SEED_EXERCISES))


if __name__ == "__main__":
    seed_exercises()
