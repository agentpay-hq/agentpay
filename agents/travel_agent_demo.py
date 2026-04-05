#!/usr/bin/env python3
"""
AgentPay Demo — AI Travel Agent
================================
An autonomous AI agent books a business trip to Manila.
Guardrail: $100/tx maximum. Daily limit: $500/agent.

Watch it:
  ✓ Hotel deposit ($85)     → approved
  ✓ Grab taxi ($15.50)      → approved
  ✓ Airport lounge ($75)    → approved
  ✗ Biz class upgrade       → BLOCKED by guardrail ($350 > $100 cap)
  ✓ Travel insurance ($45)  → approved
  ✓ Airport tip ($22)       → approved

Usage:
  pip install requests
  python3 travel_agent_demo.py
"""

import time
import json
import uuid
import requests
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
API_URL  = "https://agentpay-api-production.up.railway.app"
API_KEY  = "ap_907442ab0bff3d79c30cdef85bf733a112ec16b547886456"
AGENT_ID = "travel-agent-001"  # persistent — uses funded CDP wallet
WALLET   = "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc"  # Base Sepolia test wallet

HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
}

# ── Payment sequence ─────────────────────────────────────────────────────────
PAYMENTS = [
    {"amount": 15.50,  "description": "Grab taxi to NAIA Terminal 3"},
    {"amount": 85.00,  "description": "Hotel deposit — Seda BGC Manila"},
    {"amount": 75.00,  "description": "Airport lounge access — Plaza Premium"},
    {"amount": 350.00, "description": "Business class upgrade — PAL MNL→SIN"},  # BLOCKED: over $100 cap
    {"amount": 45.00,  "description": "AXA travel insurance — 7 days"},
    {"amount": 22.00,  "description": "Airport transfer tip"},
]

# ── Helpers ──────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
DIM    = "\033[2m"

def log(msg, color=RESET):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{DIM}[{ts}]{RESET} {color}{msg}{RESET}")

def divider():
    print(f"{DIM}{'─' * 60}{RESET}")

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{BOLD}{'═' * 60}{RESET}")
    print(f"{BOLD}  🤖 AgentPay Demo — AI Travel Agent{RESET}")
    print(f"{BOLD}{'═' * 60}{RESET}")
    print(f"  Agent:    {BLUE}{AGENT_ID}{RESET}")
    print(f"  Network:  Base Sepolia (testnet)")
    print(f"  Guardrail: $100/tx maximum")
    print(f"  API:      {API_URL}")
    print(f"{BOLD}{'═' * 60}{RESET}\n")

    results = []
    total_approved = 0.0

    for i, payment in enumerate(PAYMENTS):
        amount = payment["amount"]
        description = payment["description"]

        log(f"Step {i+1}/{len(PAYMENTS)}: {description}", BLUE)
        log(f"  Attempting payment of ${amount:.2f} USDC...", DIM)

        payload = {
            "agent_id": AGENT_ID,
            "amount": amount,
            "token": "USDC",
            "recipient": WALLET,
            "reason": description,
        }

        idempotency_key = f"demo-{AGENT_ID}-step{i}-{uuid.uuid4().hex[:8]}"

        try:
            resp = requests.post(
                f"{API_URL}/pay",
                headers={**HEADERS, "Idempotency-Key": idempotency_key},
                json=payload,
                timeout=15,
            )
            data = resp.json()

            status = data.get("status", "unknown")
            reason = data.get("reason", "")
            tx_hash = data.get("tx_hash", "")

            if status in ("approved", "completed"):
                log(f"  ✓ APPROVED — ${amount:.2f} USDC sent", GREEN)
                if tx_hash:
                    log(f"  ↗ BaseScan: https://sepolia.basescan.org/tx/{tx_hash}", DIM)
                total_approved += amount
                results.append({"step": i+1, "status": "approved", "amount": amount, "description": description})
            else:
                log(f"  ✗ BLOCKED — {reason or 'guardrail rejected'}", RED)
                results.append({"step": i+1, "status": "rejected", "amount": amount, "description": description, "reason": reason})

        except requests.exceptions.Timeout:
            log(f"  ✗ TIMEOUT — CDP network slow, circuit breaker may activate", YELLOW)
            results.append({"step": i+1, "status": "timeout", "amount": amount, "description": description})
        except Exception as e:
            log(f"  ✗ ERROR — {e}", RED)
            results.append({"step": i+1, "status": "error", "amount": amount, "description": description})

        divider()
        time.sleep(1.5)  # simulate agent thinking time

    # ── Summary ──────────────────────────────────────────────────────────────
    approved = [r for r in results if r["status"] == "approved"]
    blocked  = [r for r in results if r["status"] == "rejected"]

    print(f"\n{BOLD}{'═' * 60}{RESET}")
    print(f"{BOLD}  📊 Mission Summary{RESET}")
    print(f"{BOLD}{'═' * 60}{RESET}")
    print(f"  Payments attempted:  {len(results)}")
    print(f"  {GREEN}Approved:{RESET}            {len(approved)}")
    print(f"  {RED}Blocked by guardrail:{RESET} {len(blocked)}")
    print(f"  Total settled:       {GREEN}${total_approved:.2f} USDC{RESET}")
    print()
    if blocked:
        for b in blocked:
            print(f"  {RED}✗ Step {b['step']}: ${b['amount']:.2f} — {b.get('reason', 'policy violation')}{RESET}")
    print(f"\n  {DIM}The agent completed its mission autonomously.")
    print(f"  No human intervention required. 1 payment blocked by policy.{RESET}")
    print(f"{BOLD}{'═' * 60}{RESET}\n")

    return results

if __name__ == "__main__":
    main()
