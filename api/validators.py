"""Request validation for AgentPay API."""

import re

ALLOWED_TOKENS = {"USDC"}
MAX_AMOUNT = 100.0
MAX_AGENT_ID_LENGTH = 64
AGENT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")
ETH_ADDRESS_PATTERN = re.compile(r"^0x[0-9a-fA-F]{40}$")


class ValidationError(Exception):
    """Raised when request validation fails."""

    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)


def validate_eth_address(address: str) -> str:
    """Validate an Ethereum address (0x + 40 hex characters)."""
    if not address:
        raise ValidationError("recipient", "Recipient address is required")
    if not ETH_ADDRESS_PATTERN.match(address):
        raise ValidationError(
            "recipient",
            "Invalid Ethereum address. Must be 0x followed by 40 hex characters",
        )
    return address


def validate_amount(amount: float) -> float:
    """Validate payment amount."""
    if amount <= 0:
        raise ValidationError("amount", "Amount must be greater than 0")
    if amount > MAX_AMOUNT:
        raise ValidationError(
            "amount",
            f"Amount {amount} exceeds maximum of {MAX_AMOUNT} USDC per transaction",
        )
    return amount


def validate_token(token: str) -> str:
    """Validate token type."""
    token_upper = token.upper()
    if token_upper not in ALLOWED_TOKENS:
        raise ValidationError(
            "token",
            f"Token '{token}' is not supported. Allowed tokens: {', '.join(sorted(ALLOWED_TOKENS))}",
        )
    return token_upper


def validate_agent_id(agent_id: str) -> str:
    """Validate agent identifier."""
    if not agent_id:
        raise ValidationError("agent_id", "Agent ID is required")
    if len(agent_id) > MAX_AGENT_ID_LENGTH:
        raise ValidationError(
            "agent_id",
            f"Agent ID must be at most {MAX_AGENT_ID_LENGTH} characters",
        )
    if not AGENT_ID_PATTERN.match(agent_id):
        raise ValidationError(
            "agent_id",
            "Agent ID must contain only alphanumeric characters, hyphens, and underscores",
        )
    return agent_id


def validate_payment_request(
    agent_id: str, amount: float, token: str, recipient: str
) -> dict:
    """Validate all fields of a payment request. Returns validated values."""
    return {
        "agent_id": validate_agent_id(agent_id),
        "amount": validate_amount(amount),
        "token": validate_token(token),
        "recipient": validate_eth_address(recipient),
    }
