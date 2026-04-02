"""AgentPay LangChain Tool — lets LangChain agents make USDC payments with guardrails."""
from __future__ import annotations
import os
import uuid
from typing import Optional, Type
import requests
from pydantic import BaseModel, Field

try:
    from langchain_core.tools import BaseTool
except ImportError:
    from langchain.tools import BaseTool


class AgentPayInput(BaseModel):
    agent_id: str = Field(description="Unique identifier for this agent instance")
    amount: float = Field(description="Amount in USDC to send (e.g. 10.50)")
    recipient: str = Field(description="Recipient wallet address (0x...)")
    reason: str = Field(description="Human-readable reason for this payment (for audit trail)")
    token: str = Field(default="USDC", description="Token to send (default: USDC)")


class AgentPayTool(BaseTool):
    """LangChain tool that enables autonomous USDC payments via AgentPay.

    The tool enforces configurable guardrails (spend limits, velocity caps)
    on every payment — operators stay in control even when agents act autonomously.

    Example:
        from agentpay_langchain import AgentPayTool
        from langchain_openai import ChatOpenAI
        from langchain.agents import create_tool_calling_agent, AgentExecutor

        tools = [AgentPayTool(api_key="ap_...", agent_id="my-bot")]
        llm = ChatOpenAI(model="gpt-4o")
        agent = create_tool_calling_agent(llm, tools, prompt)
        executor = AgentExecutor(agent=agent, tools=tools)
    """

    name: str = "agentpay_send_payment"
    description: str = (
        "Send a USDC payment to a wallet address. "
        "Use this when you need to pay for a service, subscription, API access, or transfer value. "
        "Payments are subject to operator-configured guardrails (spend limits). "
        "Always provide a clear reason for audit purposes."
    )
    args_schema: Type[BaseModel] = AgentPayInput
    return_direct: bool = False

    api_key: str = Field(default="", description="AgentPay API key (ap_...)")
    api_url: str = Field(
        default="https://agentpay-api-production.up.railway.app",
        description="AgentPay API base URL"
    )
    agent_id: str = Field(default="langchain-agent", description="Default agent ID")

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, api_key: Optional[str] = None, agent_id: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.api_key = api_key or os.getenv("AGENTPAY_API_KEY", "")
        if agent_id:
            self.agent_id = agent_id
        if not self.api_key:
            raise ValueError(
                "AgentPay API key required. Pass api_key= or set AGENTPAY_API_KEY env var. "
                "Get a free key at https://frontend-gilt-xi-owvghr36pe.vercel.app/get-started"
            )

    def _run(
        self,
        agent_id: str,
        amount: float,
        recipient: str,
        reason: str,
        token: str = "USDC",
    ) -> str:
        """Execute a payment synchronously."""
        idempotency_key = f"lc-{agent_id}-{uuid.uuid4().hex[:12]}"
        try:
            resp = requests.post(
                f"{self.api_url}/pay",
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": self.api_key,
                    "Idempotency-Key": idempotency_key,
                },
                json={
                    "agent_id": agent_id or self.agent_id,
                    "amount": amount,
                    "token": token,
                    "recipient": recipient,
                    "reason": reason,
                },
                timeout=15,
            )
            data = resp.json()
            status = data.get("status", "unknown")
            if status in ("approved", "completed"):
                tx_hash = data.get("tx_hash", "")
                result = f"Payment approved: {amount} {token} sent to {recipient}."
                if tx_hash:
                    result += f" TX: https://sepolia.basescan.org/tx/{tx_hash}"
                return result
            else:
                reason_msg = data.get("reason", data.get("detail", "guardrail rejected"))
                return f"Payment blocked by guardrail: {reason_msg}. Amount: {amount} {token}."
        except requests.exceptions.Timeout:
            return "Payment timed out — CDP network slow. Please retry."
        except Exception as e:
            return f"Payment failed: {str(e)}"

    async def _arun(
        self,
        agent_id: str,
        amount: float,
        recipient: str,
        reason: str,
        token: str = "USDC",
    ) -> str:
        """Execute a payment asynchronously."""
        import asyncio
        import aiohttp
        idempotency_key = f"lc-{agent_id}-{uuid.uuid4().hex[:12]}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/pay",
                    headers={
                        "Content-Type": "application/json",
                        "X-API-Key": self.api_key,
                        "Idempotency-Key": idempotency_key,
                    },
                    json={
                        "agent_id": agent_id or self.agent_id,
                        "amount": amount,
                        "token": token,
                        "recipient": recipient,
                        "reason": reason,
                    },
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    status = data.get("status", "unknown")
                    if status in ("approved", "completed"):
                        tx_hash = data.get("tx_hash", "")
                        result = f"Payment approved: {amount} {token} sent to {recipient}."
                        if tx_hash:
                            result += f" TX: https://sepolia.basescan.org/tx/{tx_hash}"
                        return result
                    else:
                        reason_msg = data.get("reason", data.get("detail", "guardrail rejected"))
                        return f"Payment blocked by guardrail: {reason_msg}. Amount: {amount} {token}."
        except asyncio.TimeoutError:
            return "Payment timed out — CDP network slow. Please retry."
        except Exception as e:
            return f"Payment failed: {str(e)}"
