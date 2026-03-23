from datetime import datetime, timedelta, timezone

import asyncpg

TRANSACTION_CAP = 100.0  # max USDC per single transaction
DAILY_LIMIT = 500.0  # max USDC per agent per rolling 24h window


def check_transaction_cap(agent_id: str, amount: float) -> dict:
    """Reject if a single transaction exceeds the per-tx cap."""
    if amount > TRANSACTION_CAP:
        return {
            "allowed": False,
            "reason": (
                f"Amount {amount} exceeds per-transaction cap of {TRANSACTION_CAP} USDC"
            ),
        }
    return {"allowed": True, "reason": "within transaction cap"}


async def check_daily_limit(
    agent_id: str, amount: float, db: asyncpg.Pool
) -> dict:
    """Reject if the agent's rolling 24h spend + this amount exceeds the daily limit."""
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    row = await db.fetchrow(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM audit_log
        WHERE agent_id = $1
          AND decision = 'approved'
          AND timestamp >= $2
        """,
        agent_id,
        since,
    )
    spent = float(row["total"])
    if spent + amount > DAILY_LIMIT:
        remaining = max(DAILY_LIMIT - spent, 0)
        return {
            "allowed": False,
            "reason": (
                f"Daily limit exceeded: spent {spent} + requested {amount} "
                f"> {DAILY_LIMIT} USDC (remaining: {remaining})"
            ),
        }
    return {"allowed": True, "reason": "within daily limit"}
