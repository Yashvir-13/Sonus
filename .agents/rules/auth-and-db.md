# Auth and database modules

Activation: `src/lib/auth/**`, `src/lib/db.py`, `src/services/api/routes/**`

## Auth — `src/lib/auth/clerk.py`

**Does:** verify Bearer Clerk session JWT; return `ClerkIdentity`; optional email lookup.

**Does not:** open DB sessions; create `User` rows; know about routes.

```python
@dataclass(frozen=True, slots=True)
class ClerkIdentity:
    user_id: str
    email: str | None = None

def require_clerk_identity(request: Request) -> ClerkIdentity:
    ...

ClerkIdentityDep = Annotated[ClerkIdentity, Depends(require_clerk_identity)]
```

- Env: `CLERK_SECRET_KEY` (fail if missing)
- Errors: `Unauthorized` / `Unprocessable` from `src.lib.exception`
- `User.id` == Clerk JWT `sub` == `identity.user_id`

## DB — `src/lib/db.py`

**Does:** build URLs from `DATABASE_*`; sync+async engines; `get_session`.

**Does not:** business queries; Clerk verification.

```python
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- Alembic uses `sync_database_url()` + `import src.models`
- Routes take `Depends(get_session)`, not raw engines (health may ping `engine`)
- On Windows or networks with partial IPv6 routing, cloud hosts (Neon, Supabase) must resolve IPv4 to set `hostaddr` to prevent libpq socket dropouts

## Route wiring (SOLID)

```python
@router.get("/me", response_model=User)
async def get_me(
    identity: ClerkIdentityDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    user = await session.get(User, identity.user_id)
    if user is None:
        raise NotFound("User not found")
    return user
```

```python
# ❌ BAD — Clerk + engine + SQL inside the route
```

## Dual-Payload Endpoints (Audio / JSON)

For endpoints supporting both file uploads (e.g. WAV multipart takes) and client telemetry/events (JSON):
- Use `request: Request` with `request.headers.get("content-type")` branching.
- Do not combine `File()` and JSON Pydantic bodies in the same route signature (causes Starlette 422 conflicts).

