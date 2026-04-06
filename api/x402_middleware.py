"""
AgentPay x402 Middleware
========================
Makes AgentPay a compliant x402 facilitator.
Any AI agent using the x402 protocol can now pay through AgentPay,
getting our guardrails, audit trail, and policy enforcement for free.
"""

import json
import hashlib
from fastapi import Request
from fastapi.responses import JSONResponse

# USDC contract on Base Sepolia
USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
AGENT_PAY_WALLET  = "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc"

def x402_payment_required(resource: str, amount_usdc: float, description: str) -> JSONResponse:
    """Return a standard x402 HTTP 402 response."""
    amount_wei = int(amount_usdc * 1_000_000)  # USDC has 6 decimals
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
                "extra": {
                    "name": "USDC",
                    "version": "2"
                }
            }],
            "error": "Payment required to access this resource"
        },
        headers={"Content-Type": "application/json"}
    )

def verify_x402_payment(x_payment: str, expected_recipient: str, max_amount_wei: int) -> dict:
    """
    Verify an x402 X-PAYMENT header.
    Returns {"valid": True} or {"valid": False, "reason": "..."}
    """
    if not x_payment:
        return {"valid": False, "reason": "No X-PAYMENT header"}
    try:
        from x402.verify import verify_payment
        result = verify_payment(x_payment)
        if not result.get("valid"):
            return {"valid": False, "reason": result.get("error", "Invalid payment")}
        # Check recipient matches AgentPay wallet
        if result.get("payTo", "").lower() != expected_recipient.lower():
            return {"valid": False, "reason": "Payment not directed to AgentPay wallet"}
        # Check amount
        if int(result.get("amount", 0)) > max_amount_wei:
            return {"valid": False, "reason": "Payment amount exceeds maximum"}
        return {"valid": True, "payment": result}
    except Exception as e:
        return {"valid": False, "reason": f"Payment verification error: {e}"}
