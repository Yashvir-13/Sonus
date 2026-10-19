"""Quick helper to mint a valid Clerk session JWT and update Postman environment."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
venv_python = ROOT / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python")

# If invoked with global python, transparently re-execute inside project .venv
if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
    sys.exit(subprocess.call([str(venv_python), *sys.argv]))

# Ensure root is in PYTHONPATH
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
from src.lib.auth.clerk import clerk_client

load_dotenv(ROOT / ".env")


def update_postman_env(token: str) -> bool:
    """Update clerk_token in postman/environments/adaptive-music-practice.environment.yaml."""
    env_file = ROOT / "postman" / "environments" / "adaptive-music-practice.environment.yaml"
    if not env_file.exists():
        return False

    content = env_file.read_text(encoding="utf-8")
    # Replace the value under clerk_token (matches quoted or unquoted across lines)
    pattern = r"(- key:\s*clerk_token\s*\r?\n\s*value:\s*)['\"]?([^\r\n'\"]*)['\"]?"
    new_content, count = re.subn(pattern, rf"\g<1>'{token}'", content)
    if count == 0:
        pattern = r"(- key:\s*clerk_token\s+value:\s*)['\"]?([^\r\n'\"]*)['\"]?"
        new_content, count = re.subn(pattern, rf"\g<1>'{token}'", content)

    if count > 0:
        env_file.write_text(new_content, encoding="utf-8")
        return True
    return False


def main() -> None:
    client = clerk_client()
    users = client.users.list()
    if not users:
        print("Error: No users found in your Clerk project.", file=sys.stderr)
        sys.exit(1)

    target_user = users[0]
    sessions = client.sessions.list(user_id=target_user.id, status="active")
    if not sessions:
        # Check all sessions
        sessions = client.sessions.list(user_id=target_user.id)

    if not sessions:
        print(f"Error: No sessions found for user {target_user.id} ({target_user.first_name}).", file=sys.stderr)
        print("Please log in once via the web frontend at http://localhost:5173", file=sys.stderr)
        sys.exit(1)

    active_session = sessions[0]
    token_response = client.sessions.create_token(session_id=active_session.id)
    jwt_token = token_response.jwt

    updated = update_postman_env(jwt_token)

    print("\n==================================================")
    print("  CLERK SESSION JWT MINTED SUCCESSFULLY")
    print("==================================================")
    print(f"User ID:  {target_user.id}")
    print(f"Name:     {target_user.first_name} {target_user.last_name or ''}".strip())
    print(f"Token:    {jwt_token[:30]}...{jwt_token[-20:]}")
    if updated:
        print("\n[OK] Automatically updated postman/environments/adaptive-music-practice.environment.yaml!")
    print("--------------------------------------------------\n")


if __name__ == "__main__":
    main()
