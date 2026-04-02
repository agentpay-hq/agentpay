# AgentPay x LangChain

Give your LangChain agent a stablecoin wallet with guardrails.

## Install

```bash
pip install langchain langchain-openai httpx
```

## Quick Start

```python
from agentpay_tool import AgentPayTool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent

payment_tool = AgentPayTool(
    api_key="ap_your_key_here",
    agent_id="my-agent-001"
)

# Drop into any LangChain agent
agent_executor = AgentExecutor(agent=agent, tools=[payment_tool])

# Agent autonomously decides when and what to pay
result = agent_executor.invoke({
    "input": "Pay agent-002 1 USDC for completing the data task."
})
```

## What it does

- **Isolated wallet** — every agent gets its own wallet on Base
- **Guardrails enforced** — max per tx, daily limits, token allowlists, recipient allowlists
- **Agent-to-agent** — pay other agents by ID, no address needed
- **Full audit trail** — every payment decision logged with reason
- **Webhooks** — get notified on every payment.approved event

## Set guardrails

```bash
curl -X POST https://agentpay-api-production.up.railway.app/agents/my-agent-001/guardrails   -H "X-API-Key: ap_your_key"   -d '{"max_per_tx": 10, "daily_limit": 100, "allowed_tokens": ["USDC"]}'
```

## Run the demo

```bash
export OPENAI_API_KEY=sk-...
export AGENTPAY_API_KEY=ap_...
python demo.py
```

## API reference

See [AgentPay docs](https://agentpay-api-production.up.railway.app/docs)
