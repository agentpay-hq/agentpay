import os
import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://agentpay:localdev@localhost:5432/agentpay"
)

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def create_tables() -> None:
    pool = await get_pool()
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id          SERIAL PRIMARY KEY,
            timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            agent_id    TEXT NOT NULL,
            amount      NUMERIC NOT NULL,
            token       TEXT NOT NULL,
            recipient   TEXT NOT NULL,
            tx_hash     TEXT,
            decision    TEXT NOT NULL,
            reason      TEXT
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id              SERIAL PRIMARY KEY,
            email           TEXT NOT NULL UNIQUE,
            name            TEXT NOT NULL,
            api_key_id      INTEGER REFERENCES api_keys(id),
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS api_keys (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            owner       TEXT DEFAULT '',
            scope       TEXT NOT NULL DEFAULT 'admin',
            key_hash    TEXT NOT NULL UNIQUE,
            is_active   BOOLEAN DEFAULT true,
            created_at  TIMESTAMPTZ DEFAULT NOW(),
            last_used   TIMESTAMPTZ
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS agent_wallets (
            id              SERIAL PRIMARY KEY,
            agent_id        TEXT NOT NULL UNIQUE,
            wallet_address  TEXT NOT NULL,
            wallet_name     TEXT NOT NULL,
            network         TEXT NOT NULL DEFAULT 'base-sepolia',
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            key         TEXT PRIMARY KEY,
            response    JSONB NOT NULL,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS agent_webhooks (
            agent_id    TEXT PRIMARY KEY,
            url         TEXT NOT NULL,
            updated_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS agent_guardrails (
            agent_id            TEXT PRIMARY KEY,
            max_per_tx          NUMERIC,
            daily_limit         NUMERIC,
            allowed_tokens      TEXT[] DEFAULT ARRAY[]::TEXT[],
            allowed_recipients  TEXT[] DEFAULT ARRAY[]::TEXT[],
            updated_at          TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id              SERIAL PRIMARY KEY,
            email           TEXT NOT NULL UNIQUE,
            referral_code   TEXT NOT NULL UNIQUE,
            referred_by     TEXT,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    # Migrate existing DBs — add scope column if missing
    try:
        async with pool.acquire() as _mc:
            await _mc.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'admin'")
    except Exception:
        pass


async def get_or_create_agent_wallet(agent_id: str, network: str) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT wallet_address, wallet_name FROM agent_wallets WHERE agent_id = $1",
        agent_id
    )
    if row:
        return {"address": row["wallet_address"], "name": row["wallet_name"], "existing": True}
    wallet_name = f"agent-{agent_id[:32]}"
    return {"address": None, "name": wallet_name, "existing": False}


async def save_agent_wallet(agent_id: str, wallet_address: str, wallet_name: str, network: str) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO agent_wallets (agent_id, wallet_address, wallet_name, network)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (agent_id) DO NOTHING
        """,
        agent_id, wallet_address, wallet_name, network
    )


async def log_payment(
    *,
    agent_id: str,
    amount: float,
    token: str,
    recipient: str,
    tx_hash: str | None,
    decision: str,
    reason: str | None,
) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO audit_log (agent_id, amount, token, recipient, tx_hash, decision, reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        agent_id, amount, token, recipient, tx_hash, decision, reason,
    )


async def get_transactions(limit: int = 50) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, timestamp, agent_id, amount, token, recipient, tx_hash, decision, reason
        FROM audit_log
        ORDER BY timestamp DESC
        LIMIT $1
        """,
        limit,
    )
    return [dict(r) for r in rows]


async def get_idempotency_response(key: str) -> dict | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT response FROM idempotency_keys WHERE key = $1", key
    )
    if not row:
        return None
    import json
    val = row["response"]
    return json.loads(val) if isinstance(val, str) else dict(val)

async def save_idempotency_response(key: str, response: dict) -> None:
    pool = await get_pool()
    import json
    from datetime import datetime
    # Serialize datetime objects to strings for JSON storage
    def serialize(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return str(obj)
    await pool.execute(
        """
        INSERT INTO idempotency_keys (key, response)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (key) DO NOTHING
        """,
        key, json.dumps(response, default=serialize)
    )


async def add_to_waitlist(email: str, referred_by: str | None = None) -> dict:
    import secrets
    pool = await get_pool()
    code = secrets.token_urlsafe(6)
    try:
        row = await pool.fetchrow(
            """
            INSERT INTO waitlist (email, referral_code, referred_by)
            VALUES ($1, $2, $3)
            RETURNING id, referral_code
            """,
            email.lower().strip(), code, referred_by
        )
        count = await pool.fetchval("SELECT COUNT(*) FROM waitlist")
        return {"new": True, "position": int(count), "referral_code": row["referral_code"]}
    except Exception as e:
        if "unique" in str(e).lower():
            row = await pool.fetchrow("SELECT id, referral_code FROM waitlist WHERE email = $1", email.lower().strip())
            count = await pool.fetchval("SELECT COUNT(*) FROM waitlist")
            return {"new": False, "position": int(count), "referral_code": row["referral_code"]}
        raise

async def get_waitlist_count() -> int:
    pool = await get_pool()
    return int(await pool.fetchval("SELECT COUNT(*) FROM waitlist") or 0)

async def create_account(email: str, name: str) -> dict:
    pool = await get_pool()
    import secrets, hashlib
    raw = f"ap_{secrets.token_hex(24)}"
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO api_keys (name, key_hash, scope, created_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING id, created_at
            """, f"{name} — {email}", hashed, scope)
            await conn.execute("""
                INSERT INTO accounts (email, name, api_key_id, created_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (email) DO NOTHING
            """, email.lower().strip(), name.strip(), row["id"])
            existing = await conn.fetchrow(
                "SELECT id FROM accounts WHERE email = $1",
                email.lower().strip()
            )
            return {
                "api_key": raw,
                "email": email.lower().strip(),
                "name": name.strip(),
                "account_id": existing["id"],
                "created_at": row["created_at"].isoformat()
            }
        except Exception as e:
            raise Exception(f"Account creation failed: {e}")

async def get_account_by_key(key_hash: str) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT a.id, a.email, a.name, a.created_at, k.id as key_id
            FROM accounts a
            JOIN api_keys k ON k.id = a.api_key_id
            WHERE k.key_hash = $1
        """, key_hash)
        if not row:
            return None
        return dict(row)


async def set_agent_guardrails(agent_id: str, guardrails: dict) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO agent_guardrails (agent_id, max_per_tx, daily_limit, allowed_tokens, allowed_recipients, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (agent_id) DO UPDATE SET
                max_per_tx = EXCLUDED.max_per_tx,
                daily_limit = EXCLUDED.daily_limit,
                allowed_tokens = EXCLUDED.allowed_tokens,
                allowed_recipients = EXCLUDED.allowed_recipients,
                updated_at = NOW()
        """, agent_id,
            guardrails.get("max_per_tx"),
            guardrails.get("daily_limit"),
            guardrails.get("allowed_tokens", []),
            guardrails.get("allowed_recipients", []))
        return await get_agent_guardrails(agent_id)

async def get_agent_guardrails(agent_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM agent_guardrails WHERE agent_id = $1", agent_id)
        if not row:
            return None
        return dict(row)


async def set_agent_webhook(agent_id: str, url: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO agent_webhooks (agent_id, url, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (agent_id) DO UPDATE SET url = EXCLUDED.url, updated_at = NOW()
        """, agent_id, url)
        row = await conn.fetchrow("SELECT * FROM agent_webhooks WHERE agent_id = $1", agent_id)
        return dict(row)

async def get_agent_webhook(agent_id: str) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM agent_webhooks WHERE agent_id = $1", agent_id)
        return dict(row) if row else None


async def get_agent_wallet_address(agent_id: str) -> str | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT wallet_address FROM agent_wallets WHERE agent_id = $1", agent_id)
        return row["wallet_address"] if row else None

async def get_api_key_scope(raw_key: str) -> str | None:
    """Returns scope of key ('read','pay','admin') or None if invalid/revoked."""
    import hashlib
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT scope FROM api_keys WHERE key_hash = $1 AND is_active = TRUE", hashed)
        return row["scope"] if row else None
