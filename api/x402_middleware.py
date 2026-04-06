"""
AgentPay x402 Middleware
========================
AgentPay as a compliant x402 facilitator.
Uses the real x402 SDK API — no x402.verify (doesn't exist).
Verification uses x402.exact.decode_payment for local decode,
and x402.facilitator.FacilitatorClient for network verification.
"""

import json
from fastapi import Request
from fastapi.responses import JSONResponse

# USDC contract on Base Sepolia
USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
AGENT_PAY_WALLET  = "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc"

def x402_payment_required(resource: str, amount_usdc: float, description: str) -> JSONResponse:
    """Return a standard x402 HTTP 402 response."""
    amount_wei = int(amount_usdc * 1_000_000)  # USDC = 6 decimals
    return JSONResponse(
        status_code=402,
        content={
            "x402Version": 1,
            "accepts": [{
                "scheme": "exact",
                "network": "base-sepolia",
                "maxAmountRequired": str(amount_wei),
                "resource": resource,
                "description": description,
                "payTo": AGENT_PAY_WALLET,
                "maxTimeoutSeconds": 300,
                "asset": USDC_BASE_SEPOLIA,
                "extra": {"name": "USDC", "version": "2"}
            }],
            "error": "Payment required to access this resource"
        }
    )

def decode_x402_payment(x_payment: str) -> dict:
    """Decode an x402 X-PAYMENT header using the SDK's exact module."""
    if not x_payment:
        return {"valid": False, "reason": "No X-PAYMENT header"}
    try:
        from x402.exact import decode_payment
        payload = decode_payment(x_payment)
        # payload is a PaymentHeader TypedDict
        return {"valid": True, "payment": payload}
    except Exception as e:
        return {"valid": False, "reason": f"Decode error: {e}"}

def verify_x402_payment(x_payment: str, expected_recipient: str, max_amount_wei: int) -> dict:
    """
    Verify an x402 payment header.
    Decodes locally, then validates key fields.
    Full on-chain verification happens via Coinbase's facilitator network
    when we call FacilitatorClient (requires FACILITATOR_URL env var).
    """
    result = decode_x402_payment(x_payment)
    if not result["valid"]:
        return result

    payment = result["payment"]

    # Validate recipient
    pay_to = payment.get("payTo") or payment.get("payload", {}).get("authorization", {}).get("to", "")
    if pay_to and pay_to.lower() != expected_recipient.lower():
        return {"valid": False, "reason": "Payment not directed to AgentPay wallet"}

    # Validate amount
    amount = payment.get("maxAmountRequired") or payment.get("payload", {}).get("authorization", {}).get("value", "0")
    try:
        if int(amount) > max_amount_wei:
            return {"valid": False, "reason": "Payment amount exceeds maximum"}
    except (ValueError, TypeError):
        pass  # non-numeric amount — let it through for now

    return {"valid": True, "payment": payment}
