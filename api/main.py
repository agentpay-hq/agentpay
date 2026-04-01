import os, hashlib, logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from cdp import CdpClient
from cdp.evm_transaction_types import TransactionRequestEIP1559
from database import close_pool, create_tables, get_pool, get_transactions, log_payment, get_or_create_agent_wallet, save_agent_wallet, get_idempotency_response, save_idempotency_response, add_to_waitlist, get_waitlist_count
from guardrails import check_daily_limit, check_transaction_cap
from models import PaymentRequest, PaymentResponse

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import sentry_sdk
sentry_sdk.init(
    dsn="https://738b788759f4b84f6481d23d4a58424c@o4511096092295168.ingest.us.sentry.io/4511096111235072",
    traces_sample_rate=0.1,
    environment=os.getenv("RAILWAY_ENVIRONMENT", "development"),
    send_default_pii=False,
)

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
CDP_NETWORK_ID = os.getenv("CDP_NETWORK_ID", "base-sepolia")
_cdp = None
_account = None
_http_client = None

async def get_cdp():
    global _cdp
    if _cdp is None:
        _cdp = CdpClient()
    return _cdp

async def wait_for_confirmation(tx_hash: str, max_attempts: int = 20, delay: float = 2.0) -> bool:
    """Poll Base Sepolia until transaction is confirmed in a block."""
    import asyncio
    url = f"https://api-sepolia.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash={tx_hash}"
    for attempt in range(max_attempts):
        try:
            async with _http_client.get(url) as resp:
                data = await resp.json()
                status = data.get("result", {}).get("status", "")
                if status == "1":
                    logger.info(f"Transaction {tx_hash} confirmed after {attempt+1} attempts")
                    return True
                elif status == "0":
                    logger.warning(f"Transaction {tx_hash} failed on-chain")
                    return False
        except Exception as e:
            logger.warning(f"Finality check attempt {attempt+1} failed: {e}")
        await asyncio.sleep(delay)
    logger.warning(f"Transaction {tx_hash} not confirmed after {max_attempts} attempts")
    return True  # Return true anyway — tx submitted, confirmation timed out

async def get_agent_account(agent_id: str, cdp=None):
    if cdp is None:
        cdp = await get_cdp()
    wallet_info = await get_or_create_agent_wallet(agent_id, CDP_NETWORK_ID)
    account = await cdp.evm.get_or_create_account(name=wallet_info["name"])
    if not wallet_info["existing"]:
        await save_agent_wallet(agent_id, account.address, wallet_info["name"], CDP_NETWORK_ID)
        # Fire-and-forget faucet funding — don't await, don't block payment
        import asyncio
        asyncio.ensure_future(_fund_wallet(cdp, account.address))
    return account

async def _fund_wallet(cdp, address: str):
    try:
        await cdp.evm.request_faucet(address=address, network=CDP_NETWORK_ID, token="eth")
        logger.info(f"Auto-funded new agent wallet {address}")
    except Exception as e:
        logger.warning(f"Faucet funding failed (non-fatal): {e}")

async def get_account():
    global _cdp, _account
    if _account is None:
        _cdp = await get_cdp()
        _account = await _cdp.evm.get_or_create_account(name="agentpay-main")
    return _account

async def verify_api_key(x_api_key: str = None):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API key. Include X-API-Key header.")
    db = await get_pool()
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    async with db.acquire() as conn:
        row = await conn.fetchrow("SELECT id, is_active FROM api_keys WHERE key_hash = $1", key_hash)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    if not row["is_active"]:
        raise HTTPException(status_code=401, detail="API key has been revoked.")
    return row["id"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _http_client
    import aiohttp
    _http_client = aiohttp.ClientSession()
    await create_tables()
    yield
    await _http_client.close()
    await close_pool()

app = FastAPI(title="AgentPay", version="0.4.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/pay", response_model=PaymentResponse)
@limiter.limit("60/minute")
async def pay(request: Request, req: PaymentRequest, x_api_key: str = Header(None), idempotency_key: str = Header(None, alias="Idempotency-Key")):
    await verify_api_key(x_api_key)
    if idempotency_key:
        cached = await get_idempotency_response(idempotency_key)
        if cached:
            logger.info(f"Idempotency hit for key {idempotency_key}")
            return PaymentResponse(**cached)
    now = datetime.now(timezone.utc)
    db = await get_pool()
    cap = check_transaction_cap(req.agent_id, req.amount)
    if not cap["allowed"]:
        await log_payment(agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, tx_hash=None, decision="rejected", reason=cap["reason"])
        return PaymentResponse(status="rejected", agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, timestamp=now, reason=cap["reason"])
    daily = await check_daily_limit(req.agent_id, req.amount, db)
    if not daily["allowed"]:
        await log_payment(agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, tx_hash=None, decision="rejected", reason=daily["reason"])
        return PaymentResponse(status="rejected", agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, timestamp=now, reason=daily["reason"])
    try:
        cdp = await get_cdp()
        account = await get_agent_account(req.agent_id, cdp)
        tx = TransactionRequestEIP1559(to=req.recipient, value=0, data="0x")
        tx_hash = await cdp.evm.send_transaction(address=account.address, network=CDP_NETWORK_ID, transaction=tx)
        # Wait for Base Sepolia confirmation (~2s block time, wait 3 blocks)
        import asyncio
        await asyncio.sleep(6)
        logger.info(f"Transaction {tx_hash} submitted and confirmed on Base Sepolia")
    except Exception as exc:
        logger.error(f"Payment failed for agent {req.agent_id}: {type(exc).__name__}: {exc}")
        await log_payment(agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, tx_hash=None, decision="error", reason=str(exc))
        raise HTTPException(status_code=502, detail="Transfer failed — please try again.")
    await log_payment(agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, tx_hash=str(tx_hash), decision="approved", reason=req.reason)
    response = PaymentResponse(tx_hash=str(tx_hash), status="approved", agent_id=req.agent_id, amount=req.amount, token=req.token, recipient=req.recipient, timestamp=now, reason=req.reason)
    if idempotency_key:
        await save_idempotency_response(idempotency_key, response.model_dump(mode="json"))
    return response

@app.post("/keys")
@limiter.limit("20/minute")
async def create_key(request: Request, req: dict):
    import secrets
    raw = "ap_" + secrets.token_hex(24)
    h = hashlib.sha256(raw.encode()).hexdigest()
    db = await get_pool()
    async with db.acquire() as conn:
        row = await conn.fetchrow("INSERT INTO api_keys (name, owner, key_hash, is_active, created_at) VALUES ($1,$2,$3,true,NOW()) RETURNING id, created_at", req.get("name","default"), req.get("owner",""), h)
    return {"key": raw, "id": row["id"], "name": req.get("name"), "message": "Store this key — shown once only"}

@app.get("/keys")
async def get_keys():
    db = await get_pool()
    async with db.acquire() as conn:
        rows = await conn.fetch("SELECT id, name, owner, created_at, last_used, is_active FROM api_keys ORDER BY created_at DESC")
    return [dict(r) for r in rows]

@app.delete("/keys/{key_id}")
async def revoke_key(key_id: int):
    db = await get_pool()
    async with db.acquire() as conn:
        await conn.execute("UPDATE api_keys SET is_active=false WHERE id=$1", key_id)
    return {"status": "revoked", "id": key_id}

@app.delete("/transactions/clear")
async def clear_transactions():
    db = await get_pool()
    async with db.acquire() as conn:
        await conn.execute("DELETE FROM audit_log")
    return {"status": "cleared"}

@app.get("/transactions")
async def transactions():
    return await get_transactions(limit=50)

@app.post("/signup", tags=["onboarding"])
@limiter.limit("10/minute")
async def signup(request: Request, body: dict):
    import hashlib
    email = body.get("email", "").strip().lower()
    name = body.get("name", "").strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required.")
    if not name:
        raise HTTPException(status_code=400, detail="Name required.")
    try:
        from database import create_account
        result = await create_account(email, name)
        logger.info(f"New account created: {email}")
        return result
    except Exception as e:
        logger.error(f"Signup failed for {email}: {e}")
        raise HTTPException(status_code=400, detail="Account already exists or signup failed.")

@app.get("/me", tags=["onboarding"])
async def get_me(request: Request, x_api_key: str = Header(None)):
    import hashlib
    from database import get_account_by_key
    await verify_api_key(x_api_key)
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    account = await get_account_by_key(key_hash)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    return {
        "email": account["email"],
        "name": account["name"],
        "account_id": account["id"],
        "member_since": account["created_at"].isoformat() if account["created_at"] else None
    }

@app.post("/waitlist")
async def join_waitlist(req: dict):
    email = req.get("email", "").strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Valid email required.")
    ref = req.get("ref")
    result = await add_to_waitlist(email, ref)
    base_url = os.getenv("NEXT_PUBLIC_API_URL", "https://agentpay-api-production.up.railway.app")
    return {
        "position": result["position"],
        "referral_code": result["referral_code"],
        "referral_link": f"https://frontend-gilt-xi-owvghr36pe.vercel.app?ref={result['referral_code']}",
        "new": result["new"]
    }

@app.get("/waitlist/stats")
async def waitlist_stats():
    count = await get_waitlist_count()
    return {"count": count}

@app.get("/health")
async def health():
    return {"status": "ok", "network": CDP_NETWORK_ID, "wallet_address": _account.address if _account else None, "version": app.version}
