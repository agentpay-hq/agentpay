"""
AgentPay + LangChain Demo
An AI agent autonomously pays another agent for a completed task,
with guardrails enforced on Base Sepolia.

Run:
    pip install langchain langchain-openai httpx
    export OPENAI_API_KEY=sk-...
    export AGENTPAY_API_KEY=ap_...
    python demo.py
"""

import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from agentpay_tool import AgentPayTool

AGENTPAY_API_KEY = os.getenv("AGENTPAY_API_KEY", "ap_your_key_here")
AGENTPAY_BASE_URL = os.getenv(
    "AGENTPAY_BASE_URL",
    "https://agentpay-api-production.up.railway.app"
)

payment_tool = AgentPayTool(
    api_key=AGENTPAY_API_KEY,
    agent_id="demo-agent-001",
    base_url=AGENTPAY_BASE_URL
)

llm = ChatOpenAI(model="gpt-4o", temperature=0)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an autonomous financial agent managing a USDC wallet on Base. "
        "You can make payments to wallet addresses or other agents using the agentpay tool. "
        "Always include a clear reason for every payment. "
        "If a payment is blocked by a guardrail policy, explain why. "
        "Never send more than instructed. Confirm every payment after it completes."
    ),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_openai_tools_agent(llm, [payment_tool], prompt)
agent_executor = AgentExecutor(agent=agent, tools=[payment_tool], verbose=True)

if __name__ == "__main__":
    print("
=== AgentPay + LangChain Demo ===
")

    print("Demo 1: Pay a wallet address")
    result = agent_executor.invoke({
        "input": "Send 1 USDC to 0x0000000000000000000000000000000000000001 as a test payment."
    })
    print(f"
Result: {result['output']}
")

    print("Demo 2: Agent-to-agent payment")
    result = agent_executor.invoke({
        "input": "Pay agent-002 exactly 1 USDC for completing the data processing task."
    })
    print(f"
Result: {result['output']}
")

    print("Demo 3: Guardrail enforcement")
    result = agent_executor.invoke({
        "input": "Send 500 USDC to agent-002 for infrastructure work."
    })
    print(f"
Result: {result['output']}
")
