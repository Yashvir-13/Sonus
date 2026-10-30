"""Database connection and session management."""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from pathlib import Path
from urllib.parse import quote_plus
from uuid import uuid4

from dotenv import load_dotenv
import socket
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        msg = f"{name} is not set in the environment"
        raise RuntimeError(msg)
    return value


from functools import lru_cache
import ssl


@lru_cache(maxsize=128)
def _resolve_ipv4(host: str, port: int = 5432) -> str | None:
    try:
        infos = socket.getaddrinfo(host, port, socket.AF_INET)
        if infos:
            return str(infos[0][4][0])
    except Exception:
        pass
    return None


def _is_cloud_ssl_host(host: str) -> bool:
    return "supabase.co" in host or "pooler.supabase.com" in host or "neon.tech" in host


def _url_from_environment(*, driver: str) -> str | None:
    """Return a configured database URL adapted for the requested driver."""
    is_async = driver.endswith("+asyncpg")
    raw_url = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_URL_POOLED")
    if not raw_url:
        return None

    raw_url = raw_url.strip().strip("'\"")
    url = make_url(raw_url).set(drivername=driver)
    query = dict(url.query)
    query.pop("channel_binding", None)
    if is_async:
        query.pop("sslmode", None)
        query["ssl"] = "require"
    elif _is_cloud_ssl_host(url.host or ""):
        query.setdefault("sslmode", "require")
        ipv4 = _resolve_ipv4(url.host or "", url.port or 5432)
        if ipv4:
            query["hostaddr"] = ipv4
    url = url.set(query=query)

    return url.render_as_string(hide_password=False)


def _pooler_mode() -> str | None:
    """Return pooler mode from host/port, or None for direct connections."""
    configured_url = os.environ.get("DATABASE_URL_POOLED") or os.environ.get("DATABASE_URL")
    if configured_url:
        parsed_url = make_url(configured_url.strip().strip("'\""))
        host = parsed_url.host or ""
        port = str(parsed_url.port or 5432)
    else:
        host = os.environ.get("DATABASE_HOST", "")
        port = str(os.environ.get("DATABASE_PORT", "5432"))

    if "neon.tech" in host and "-pooler" in host:
        return "transaction"
    if "pooler.supabase.com" not in host:
        return None
    if port == "6543":
        return "transaction"
    if port == "5432":
        return "session"
    return None


def build_database_url(*, driver: str) -> str:
    """Build a SQLAlchemy URL with encoded credentials and cloud SSL when needed."""
    configured_url = _url_from_environment(driver=driver)
    if configured_url is not None:
        return configured_url

    user_val = os.environ.get("DATABASE_USER")
    if not user_val:
        return f"{driver}://postgres:postgres@localhost:5432/postgres"

    user = quote_plus(user_val)
    password = quote_plus(os.environ.get("DATABASE_PASSWORD", ""))
    host = os.environ.get("DATABASE_HOST", "localhost")
    port = os.environ.get("DATABASE_PORT", "5432")
    name = os.environ.get("DATABASE_NAME", "postgres")

    url = f"{driver}://{user}:{password}@{host}:{port}/{name}"
    if _is_cloud_ssl_host(host):
        if driver.endswith("+asyncpg"):
            return f"{url}?ssl=require"
        return f"{url}?sslmode=require"
    return url


def sync_database_url() -> str:
    """Sync driver URL for Alembic and bootstrap scripts."""
    return build_database_url(driver="postgresql+psycopg2")


_sync_engine = create_engine(
    sync_database_url(),
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SyncSessionLocal = sessionmaker(
    bind=_sync_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


_async_url = build_database_url(driver="postgresql+asyncpg")

_async_connect_args: dict[str, object] = {}
_async_engine_kwargs: dict[str, object] = {
    "echo": False,
    "future": True,
    "pool_size": 10,
    "max_overflow": 20,
    "pool_recycle": 300,
}

_parsed_async = make_url(_async_url)
_orig_host = _parsed_async.host or ""
# Note: asyncpg relies on hostname for TLS SNI routing to cloud proxies (e.g. Neon, Supabase)
if _pooler_mode() == "transaction":
    _async_connect_args.update({
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    })

engine: AsyncEngine = create_async_engine(
    _async_url,
    connect_args=_async_connect_args,
    **_async_engine_kwargs,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a session per request, always closes cleanly."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
