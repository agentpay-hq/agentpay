# AgentPay SDK

The payment layer for autonomous AI agents. Send stablecoin payments from AI agents with programmable guardrails on Base.

## Installation

```bash
npm install agentpay
```

## Quick Start

```typescript
import AgentPay from 'agentpay';

const ap = new AgentPay({ apiKey: 'ap_your_key_here' });

// Send a payment
const result = await ap.pay({
  agentId: 'trading-bot-001',
  amount: 5.00,
  token: 'USDC',
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C',
  reason: 'API access fee',
});

console.log(result.status);  // "approved"
console.log(result.tx_hash); // "0x..."
```

## API

### `new AgentPay(config)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your API key (starts with `ap_`) |
| `baseUrl` | `string` | No | API base URL (default: `http://localhost:8000`) |

### `ap.pay(params)`

Send a payment from an agent wallet.

```typescript
const result = await ap.pay({
  agentId: 'bot-001',
  amount: 10,
  token: 'USDC',
  recipient: '0x...',
  reason: 'Payment description',
});
```

### `ap.getTransactions(limit?)`

Fetch recent transactions.

```typescript
const txns = await ap.getTransactions(25);
```

### `ap.health()`

Check API health status.

```typescript
const status = await ap.health();
console.log(status.network); // "base-sepolia"
```

### `ap.createKey(name)`

Create a new API key.

```typescript
const key = await ap.createKey('my-bot-key');
console.log(key.key); // "ap_..." — store securely
```

## Error Handling

```typescript
import AgentPay, { AgentPayError } from 'agentpay';

try {
  await ap.pay({ ... });
} catch (err) {
  if (err instanceof AgentPayError) {
    console.error(err.message);    // "Amount exceeds per-transaction cap"
    console.error(err.statusCode); // 422
  }
}
```

## Guardrails

All payments are checked against spending policies:
- **Per-transaction cap**: Max $100 USDC
- **Daily limit**: Max $500 USDC per agent per 24h

## License

MIT
