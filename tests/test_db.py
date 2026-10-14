from __future__ import annotations

import os
from unittest.mock import patch

from src.lib.db import _pooler_mode, build_database_url, sync_database_url


def test_build_database_url_fallback_when_env_unset() -> None:
    """When DATABASE_* variables are not in the environment, fallback URLs are safely returned."""
    with patch.dict(os.environ, {}, clear=True):
        url_sync = sync_database_url()
        assert url_sync.startswith("postgresql+psycopg2://")
        assert "localhost:5432" in url_sync

        url_async = build_database_url(driver="postgresql+asyncpg")
        assert url_async.startswith("postgresql+asyncpg://")
        assert "localhost:5432" in url_async


def test_pooler_mode_fallback_when_env_unset() -> None:
    """When no pooler variables are set, _pooler_mode returns None without raising an error."""
    with patch.dict(os.environ, {}, clear=True):
        assert _pooler_mode() is None


def test_build_database_url_from_explicit_database_url() -> None:
    """When DATABASE_URL is set, it is adapted for the requested driver."""
    env = {
        "DATABASE_URL": "postgresql://testuser:testpass@db.example.com:5432/testdb",
    }
    with patch.dict(os.environ, env, clear=True):
        url_sync = build_database_url(driver="postgresql+psycopg2")
        assert "testuser" in url_sync
        assert "testpass" in url_sync
        assert "db.example.com" in url_sync
        assert "testdb" in url_sync
        assert url_sync.startswith("postgresql+psycopg2://")
