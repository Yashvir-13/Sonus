from __future__ import annotations

import os
from unittest.mock import MagicMock

import pytest
from starlette.requests import Request

from src.lib.auth.clerk import ClerkIdentity, require_clerk_identity
from src.lib.exception import Unauthorized


def _make_request(headers: dict[str, str] | None = None) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(k.lower().encode("latin1"), v.encode("latin1")) for k, v in (headers or {}).items()],
    }
    return Request(scope)


def test_require_clerk_identity_missing_header(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_mock_secret_key")
    req = _make_request()

    # Mock clerk SDK client authenticate_request returning unsigned
    mock_state = MagicMock(is_signed_in=False, payload=None, reason="Missing token")
    mock_client = MagicMock()
    mock_client.authenticate_request.return_value = mock_state
    monkeypatch.setattr("src.lib.auth.clerk.clerk_client", lambda: mock_client)

    with pytest.raises(Unauthorized):
        require_clerk_identity(req)


def test_require_clerk_identity_dev_token_rejected_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "development")
    monkeypatch.delenv("ALLOW_DEV_TOKEN_AUTH", raising=False)
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_mock_secret_key")

    req = _make_request({"Authorization": "Bearer dev_token"})

    mock_state = MagicMock(is_signed_in=False, payload=None, reason="Invalid token")
    mock_client = MagicMock()
    mock_client.authenticate_request.return_value = mock_state
    monkeypatch.setattr("src.lib.auth.clerk.clerk_client", lambda: mock_client)

    with pytest.raises(Unauthorized):
        require_clerk_identity(req)


def test_require_clerk_identity_dev_token_accepted_when_explicitly_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TOKEN_AUTH", "true")
    monkeypatch.setenv("DEV_USER_ID", "user_dev_test_123")
    monkeypatch.setenv("DEV_USER_EMAIL", "test@sonus.studio")

    req = _make_request({"Authorization": "Bearer dev_token"})
    identity = require_clerk_identity(req)
    assert identity.user_id == "user_dev_test_123"
    assert identity.email == "test@sonus.studio"
