"""API key authentication and rate limiting for AgentPay."""

import hashlib
import os
import secrets
from datetime import datetime, timezone

import asyncpg


API_KEY_PREFIX = "ap_"
API_KEY_LENGTH = 32

# Public endpoints that don't require authentication
PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/transactions",
    "/transactions/clear",
}

# Rate limit: requests per minute per key
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "100"))


def generate_api_key() -> str:
    """Generate a new API key with the ap_ prefix."""
    raw = secrets.token_hex(API_KEY_LENGTH)
    return f"{API_KEY_PREFIX}{raw}"


def hash_api_key(key: str) -> str:
    """Hash an API key using SHA-256."""
    return hashlib.sha256(key.encode()).hexdigest()


async def create_api_keys_table(pool: asyncpg.Pool) -> None:
    """Create the api_keys table if it doesn't exist."""
    await pool.execute(
        """
        CREATE TABLE IF NOT EXISTS api_keys (
            id          SERIAL PRIMARY KEY,
            key_hash    TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            owner       TEXT NOT NULL DEFAULT '',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_used   TIMESTAMPTZ,
            is_active   BOOLEAN NOT NULL DEFAULT TRUE
        );
        """
    )


async def store_api_key(
    pool: asyncpg.Pool, key_hash: str, name: str, owner: str = ""
) -> dict:
    """Store a hashed API key in the database."""
    row = await pool.fetchrow(
        """
        INSERT INTO api_keys (key_hash, name, owner)
        VALUES ($1, $2, $3)
        RETURNING id, name, owner, created_at, is_active
        """,
        key_hash,
        name,
        owner,
    )
    return dict(row)


async def validate_api_key(pool: asyncpg.Pool, key: str) -> dict | None:
    """Validate an API key and update last_used timestamp."""
    key_hash = hash_api_key(key)
    row = await pool.fetchrow(
        """
        UPDATE api_keys
        SET last_used = NOW()
        WHERE key_hash = $1 AND is_active = TRUE
        RETURNING id, name, owner
        """,
        key_hash,
    )
    if row is None:
        return None
    return dict(row)


async def list_api_keys(pool: asyncpg.Pool) -> list[dict]:
    """List all API keys (without the raw key or hash)."""
    rows = await pool.fetch(
        """
        SELECT id, name, owner, created_at, last_used, is_active
        FROM api_keys
        ORDER BY created_at DESC
        """
    )
    return [dict(r) for r in rows]


async def revoke_api_key(pool: asyncpg.Pool, key_id: int) -> bool:
    """Revoke an API key by setting is_active to false."""
    result = await pool.execute(
        """
        UPDATE api_keys SET is_active = FALSE WHERE id = $1
        """,
        key_id,
    )
    return result == "UPDATE 1"


# Simple in-memory rate limiter (production would use Redis)
_rate_limit_store: dict[str, list[float]] = {}


def check_rate_limit(key_hash: str) -> bool:
    """Check if a key has exceeded the rate limit. Returns True if allowed."""
    import time

    now = time.time()
    window_start = now - 60  # 1-minute window

    if key_hash not in _rate_limit_store:
        _rate_limit_store[key_hash] = []

    # Clean old entries
    _rate_limit_store[key_hash] = [
        ts for ts in _rate_limit_store[key_hash] if ts > window_start
    ]

    if len(_rate_limit_store[key_hash]) >= RATE_LIMIT_RPM:
        return False

    _rate_limit_store[key_hash].append(now)
    return True
