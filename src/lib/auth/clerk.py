"""Clerk session verification for FastAPI routes."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Depends, Request

from src.lib.exception import Unauthorized, Unprocessable


@dataclass(frozen=True, slots=True)
class ClerkIdentity:
    """Authenticated Clerk user from a verified session token."""

    user_id: str
    email: str | None = None


@lru_cache
def clerk_client() -> Clerk:
    """Shared Clerk SDK client."""
    secret = os.environ.get("CLERK_SECRET_KEY")
    if not secret:
        msg = "CLERK_SECRET_KEY is not set in the environment"
        raise RuntimeError(msg)
    return Clerk(bearer_auth=secret)


def require_clerk_identity(request: Request) -> ClerkIdentity:
    """Verify the Bearer session token and return the Clerk user id."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        env = os.environ.get("ENV", "development").strip().lower()
        if env == "development":
            # Industry Standard: Allow dev_token during local API testing
            # so developers don't have to battle 60-second JWT expiration in Postman/curl.
            dev_user_id = os.environ.get("DEV_USER_ID", "user_3KEP7OZiiKMswrl5f28AjxOV7Kl")
            if token in ("dev", "dev_token", "dev-token", dev_user_id):
                return ClerkIdentity(
                    user_id=dev_user_id,
                    email=os.environ.get("DEV_USER_EMAIL", "yashvir.126@gmail.com"),
                )

    secret = os.environ.get("CLERK_SECRET_KEY")
    if not secret:
        msg = "CLERK_SECRET_KEY is not set in the environment"
        raise RuntimeError(msg)

    state = clerk_client().authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=secret,
            # Do not restrict azp here; session tokens from the browser
            # may not match CORS origin allowlists.
            authorized_parties=None,
        ),
    )
    if not state.is_signed_in or state.payload is None:
        detail = str(state.reason or "Unauthorized")
        raise Unauthorized(detail)

    user_id = state.payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise Unauthorized("Invalid session subject")

    email = state.payload.get("email")
    if isinstance(email, str) and email:
        return ClerkIdentity(user_id=user_id, email=email)

    return ClerkIdentity(user_id=user_id, email=None)


@lru_cache(maxsize=512)
def resolve_clerk_email(clerk_user_id: str) -> str:
    """Load the primary email from Clerk when it is missing from the JWT."""
    try:
        clerk_user = clerk_client().users.get(user_id=clerk_user_id)
    except Exception as exc:
        msg = "Could not load email from Clerk"
        raise Unprocessable(msg) from exc

    if clerk_user is None or not clerk_user.email_addresses:
        msg = "Clerk account has no email address"
        raise Unprocessable(msg)

    for entry in clerk_user.email_addresses:
        if entry.id == clerk_user.primary_email_address_id and entry.email_address:
            return entry.email_address

    first = clerk_user.email_addresses[0].email_address
    if not first:
        msg = "Clerk account has no email address"
        raise Unprocessable(msg)
    return first


ClerkIdentityDep = Annotated[ClerkIdentity, Depends(require_clerk_identity)]
