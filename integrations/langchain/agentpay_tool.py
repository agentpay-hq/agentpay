"""
AgentPay LangChain Tool
Plug-in tool for LangChain agents to make autonomous stablecoin payments
with policy guardrails on Base.

pip install langchain httpx
"""

from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type
import httpx


class AgentPayInput(BaseModel):
    recipient: str = Field(
        description="Recipient wallet address (0x...) or agent ID (e.g. agent-002)"
    )
    amount: float = Field(
        description="Amount in USDC to send. Must be a positive number."
    )
    reason: str = Field(
        description="Human-readable reason for this payment. Used for audit trail."
    )
    token: str = Field(
        default="USDC",
        description="Token to send. Currently supports USDC."
    )


class AgentPayTool(BaseTool):
    """
    LangChain tool that gives an AI agent the ability to make
    autonomous stablecoin payments via AgentPay.

    Each agent gets:
    - An isolated wallet on Base
    - Configurable spend guardrails (max per tx, daily limits, allowlists)
    - Full audit trail of every payment decision
    - Webhook notifications on payment.approved events

    Example:
        tool = AgentPayTool(
            api_key="ap_your_key_here",
            agent_id="my-agent-001"
        )
    """

    name: str = "agentpay"
    description: str = (
        "Make a stablecoin payment on behalf of this AI agent. "
        "Use this when you need to pay for services, transfer funds to another agent, "
        "or execute a financial transaction. "
        "Input: recipient (address or agent ID), amount (USDC), reason (why you are paying). "
        "Returns: transaction hash and approval status. "
        "Payments are subject to guardrail policies set by the agent operator."
    )
    args_schema: Type[BaseModel] = AgentPayInput

    api_key: str
    agent_id: str
    base_url: str = "https://agentpay-api-production.up.railway.app"

    class Config:
        arbitrary_types_allowed = True

    def _run(self, recipient: str, amount: float, reason: str, token: str = "USDC") -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/pay",
                headers={"X-API-Key": self.api_key, "Content-Type": "application/json"},
                json={"agent_id": self.agent_id, "amount": amount, "token": token,
                      "recipient": recipient, "reason": reason},
                timeout=30.0
            )
            data = response.json()
            if response.status_code == 200 and data.get("status") == "approved":
                return (f"Payment approved. Sent {amount} {token} to {recipient}. "
                        f"Transaction: {data.get('tx_hash')}. Reason logged: {reason}")
            elif response.status_code == 403:
                return f"Payment blocked by guardrail policy: {data.get('detail')}"
            elif response.status_code == 404:
                return f"Recipient not found: {data.get('detail')}"
            else:
                return f"Payment failed: {data.get('detail', 'Unknown error')} (status {response.status_code})"
        except httpx.TimeoutException:
            return "Payment timed out. Transaction may still be processing on-chain."
        except Exception as e:
            return f"Payment error: {str(e)}"

    async def _arun(self, recipient: str, amount: float, reason: str, token: str = "USDC") -> str:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/pay",
                    headers={"X-API-Key": self.api_key, "Content-Type": "application/json"},
                    json={"agent_id": self.agent_id, "amount": amount, "token": token,
                          "recipient": recipient, "reason": reason},
                    timeout=30.0
                )
                data = response.json()
                if response.status_code == 200 and data.get("status") == "approved":
                    return (f"Payment approved. Sent {amount} {token} to {recipient}. "
                            f"Transaction: {data.get('tx_hash')}. Reason logged: {reason}")
                elif response.status_code == 403:
                    return f"Payment blocked by guardrail policy: {data.get('detail')}"
                elif response.status_code == 404:
                    return f"Recipient not found: {data.get('detail')}"
                else:
                    return f"Payment failed: {data.get('detail', 'Unknown error')} (status {response.status_code})"
        except httpx.TimeoutException:
            return "Payment timed out. Transaction may still be processing on-chain."
        except Exception as e:
            return f"Payment error: {str(e)}"
