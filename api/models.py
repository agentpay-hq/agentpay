from datetime import datetime

from pydantic import BaseModel, Field


class PaymentRequest(BaseModel):
    agent_id: str
    amount: float = Field(gt=0)
    token: str = "USDC"
    recipient: str
    reason: str


class PaymentResponse(BaseModel):
    tx_hash: str | None = None
    status: str
    agent_id: str
    amount: float
    token: str
    recipient: str
    timestamp: datetime
    reason: str | None = None
