"use client";

import { useState, useCallback, useEffect } from "react";
import Navigation from "../components/Navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "quickstart" | "auth" | "api" | "guardrails" | "errors";

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: "quickstart", label: "Quick Start" },
  { key: "auth", label: "Authentication" },
  { key: "api", label: "API Reference" },
  { key: "guardrails", label: "Guardrails" },
  { key: "errors", label: "Error Codes" },
];

// ---------------------------------------------------------------------------
// Copy button for code blocks
// ---------------------------------------------------------------------------

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute right-2 top-2 rounded-md bg-[#1a1a1a] px-2 py-1 text-[10px] font-medium text-zinc-500 opacity-0 transition-all hover:text-white group-hover:opacity-100"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Code block with copy and language tabs
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#222222]">
      <div className="flex items-center border-b border-[#222222] bg-[#111111] px-4 py-2">
        <span className="text-xs font-medium text-zinc-500">{language}</span>
      </div>
      <div className="relative">
        <CopyCodeButton code={code} />
        <pre className="overflow-x-auto bg-[#0a0a0a] p-4 text-[13px] leading-6">
          <code className="text-zinc-300">{code}</code>
        </pre>
      </div>
    </div>
  );
}

function MultiCodeBlock({
  examples,
}: {
  examples: { lang: string; label: string; code: string }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#222222]">
      <div className="flex items-center gap-0 border-b border-[#222222] bg-[#111111]">
        {examples.map((ex, i) => (
          <button
            key={ex.lang}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              i === active
                ? "border-b-2 border-blue-500 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <CopyCodeButton code={examples[active].code} />
        <pre className="overflow-x-auto bg-[#0a0a0a] p-4 text-[13px] leading-6">
          <code className="text-zinc-300">{examples[active].code}</code>
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content
// ---------------------------------------------------------------------------

function QuickStartTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Quick Start</h2>
        <p className="mt-2 text-zinc-400">
          Get from zero to your first autonomous payment in under 5 minutes.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">1. Get an API Key</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Create an API key from the Dashboard or via the API:
          </p>
          <div className="mt-3">
            <CodeBlock
              language="bash"
              code={`curl -X POST https://agentpay-api-production.up.railway.app/keys \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-first-key"}'

# Response:
# {
#   "key": "ap_a1b2c3d4...",
#   "id": 1,
#   "name": "my-first-key",
#   "message": "Store this key securely — it will not be shown again"
# }`}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">2. Send Your First Payment</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Make a POST request to the /pay endpoint:
          </p>
          <div className="mt-3">
            <MultiCodeBlock
              examples={[
                {
                  lang: "curl",
                  label: "curl",
                  code: `curl -X POST https://agentpay-api-production.up.railway.app/pay \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ap_YOUR_KEY_HERE" \\
  -d '{
    "agent_id": "trading-bot-001",
    "amount": 5.00,
    "token": "USDC",
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C",
    "reason": "API access fee"
  }'`,
                },
                {
                  lang: "python",
                  label: "Python",
                  code: `import requests

response = requests.post(
    "https://agentpay-api-production.up.railway.app/pay",
    headers={"X-API-Key": "ap_YOUR_KEY_HERE"},
    json={
        "agent_id": "trading-bot-001",
        "amount": 5.00,
        "token": "USDC",
        "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C",
        "reason": "API access fee"
    }
)
print(response.json())`,
                },
                {
                  lang: "javascript",
                  label: "JavaScript",
                  code: `const response = await fetch("https://agentpay-api-production.up.railway.app/pay", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "ap_YOUR_KEY_HERE",
  },
  body: JSON.stringify({
    agent_id: "trading-bot-001",
    amount: 5.0,
    token: "USDC",
    recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD2C",
    reason: "API access fee",
  }),
});
const data = await response.json();
console.log(data);`,
                },
              ]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">3. Check the Dashboard</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Open the{" "}
            <a href="/dashboard" className="text-blue-400 hover:text-blue-300">
              Dashboard
            </a>{" "}
            to see your transaction in real-time. Every payment is logged with a full
            audit trail and on-chain confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Authentication</h2>
        <p className="mt-2 text-zinc-400">
          AgentPay uses API keys for authentication. Keys are hashed with SHA-256 and never stored in plain text.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Using Your API Key</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Include your API key in the <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-blue-400">X-API-Key</code> header:
          </p>
          <div className="mt-3">
            <CodeBlock
              language="http"
              code={`POST /pay HTTP/1.1
Host: agentpay-api-production.up.railway.app
Content-Type: application/json
X-API-Key: ap_a1b2c3d4e5f6...

{
  "agent_id": "my-agent",
  "amount": 10.00,
  "token": "USDC",
  "recipient": "0x...",
  "reason": "Payment description"
}`}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Key Management</h3>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
              <p className="text-sm font-medium text-white">Create a key</p>
              <p className="mt-1 text-xs text-zinc-500">POST /keys — returns the raw key once</p>
            </div>
            <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
              <p className="text-sm font-medium text-white">List keys</p>
              <p className="mt-1 text-xs text-zinc-500">GET /keys — returns key metadata (never the raw key)</p>
            </div>
            <div className="rounded-lg border border-[#222222] bg-[#111111] p-4">
              <p className="text-sm font-medium text-white">Revoke a key</p>
              <p className="mt-1 text-xs text-zinc-500">DELETE /keys/:id — immediately disables the key</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Rate Limiting</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Each API key is limited to <strong className="text-white">100 requests per minute</strong>. If you exceed the limit, you&apos;ll receive a <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-amber-400">429 Too Many Requests</code> response.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Public Endpoints</h3>
          <p className="mt-1 text-sm text-zinc-400">
            These endpoints do not require authentication:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li><code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-zinc-300">GET /health</code> — Health check</li>
            <li><code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-zinc-300">GET /docs</code> — OpenAPI documentation</li>
            <li><code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-zinc-300">GET /transactions</code> — Transaction list</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ApiReferenceTab() {
  const endpoints = [
    {
      method: "POST",
      path: "/pay",
      desc: "Send a payment",
      auth: true,
      request: `{
  "agent_id": "string",       // required, alphanumeric, max 64 chars
  "amount": 0.00,             // required, positive, max 100 USDC
  "token": "USDC",            // optional, defaults to "USDC"
  "recipient": "0x...",       // required, valid Ethereum address
  "reason": "string"          // required, payment description
}`,
      response: `{
  "status": "approved",       // "approved", "rejected", or "error"
  "tx_hash": "0xabc...",      // on-chain transaction hash (if approved)
  "agent_id": "string",
  "amount": 0.00,
  "token": "USDC",
  "recipient": "0x...",
  "timestamp": "2024-01-01T00:00:00Z",
  "reason": "string"
}`,
    },
    {
      method: "GET",
      path: "/transactions",
      desc: "List recent transactions",
      auth: false,
      request: "No request body",
      response: `[
  {
    "id": 1,
    "timestamp": "2024-01-01T00:00:00Z",
    "agent_id": "trading-bot-001",
    "amount": 5.00,
    "token": "USDC",
    "recipient": "0x742d...4e2C",
    "tx_hash": "0xabc...",
    "decision": "approved",
    "reason": "API access fee"
  }
]`,
    },
    {
      method: "POST",
      path: "/keys",
      desc: "Create an API key",
      auth: false,
      request: `{
  "name": "string",           // required, key name
  "owner": "string"           // optional, key owner
}`,
      response: `{
  "key": "ap_a1b2c3...",      // raw key — shown once only
  "id": 1,
  "name": "my-key",
  "owner": "",
  "created_at": "2024-01-01T00:00:00Z",
  "message": "Store this key securely"
}`,
    },
    {
      method: "GET",
      path: "/keys",
      desc: "List all API keys",
      auth: false,
      request: "No request body",
      response: `[
  {
    "id": 1,
    "name": "production-key",
    "owner": "",
    "created_at": "2024-01-01T00:00:00Z",
    "last_used": "2024-01-02T12:00:00Z",
    "is_active": true
  }
]`,
    },
    {
      method: "DELETE",
      path: "/keys/:id",
      desc: "Revoke an API key",
      auth: false,
      request: "No request body",
      response: `{
  "status": "revoked",
  "id": 1
}`,
    },
    {
      method: "GET",
      path: "/health",
      desc: "Health check",
      auth: false,
      request: "No request body",
      response: `{
  "status": "ok",
  "network": "base-sepolia",
  "wallet_address": "0x...",
  "version": "0.2.0"
}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">API Reference</h2>
        <p className="mt-2 text-zinc-400">
          Complete reference for all AgentPay API endpoints.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Base URL: <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-blue-400">https://agentpay-api-production.up.railway.app</code>
        </p>
      </div>

      <div className="space-y-8">
        {endpoints.map((ep) => (
          <div key={`${ep.method}-${ep.path}`} className="rounded-xl border border-[#222222] bg-[#111111]">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#222222] px-5 py-4">
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  ep.method === "POST"
                    ? "bg-green-500/10 text-green-400"
                    : ep.method === "DELETE"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {ep.method}
              </span>
              <code className="font-mono text-sm text-white">{ep.path}</code>
              <span className="text-sm text-zinc-500">{ep.desc}</span>
              {ep.auth && <span className="badge badge-warning ml-auto">Auth Required</span>}
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="group relative">
                <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Request</p>
                <div className="relative">
                  <CopyCodeButton code={ep.request} />
                  <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] p-3 text-xs leading-5 text-zinc-300">
                    {ep.request}
                  </pre>
                </div>
              </div>
              <div className="group relative">
                <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Response</p>
                <div className="relative">
                  <CopyCodeButton code={ep.response} />
                  <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] p-3 text-xs leading-5 text-zinc-300">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuardrailsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Guardrails</h2>
        <p className="mt-2 text-zinc-400">
          Every payment is checked against spending policies before execution. Guardrails cannot be bypassed — they run server-side before any on-chain transaction.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-[#222222] bg-[#111111] p-5">
          <h3 className="text-lg font-semibold text-white">Per-Transaction Cap</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Maximum of <strong className="text-white">$100 USDC</strong> per single transaction. Any payment exceeding this amount is automatically rejected.
          </p>
          <div className="mt-3">
            <CodeBlock
              language="json"
              code={`// Rejected response
{
  "status": "rejected",
  "reason": "Amount 150 exceeds per-transaction cap of 100.0 USDC"
}`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#222222] bg-[#111111] p-5">
          <h3 className="text-lg font-semibold text-white">Daily Spending Limit</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Maximum of <strong className="text-white">$500 USDC</strong> per agent per rolling 24-hour window. The system tracks cumulative approved spend and blocks new payments that would exceed the limit.
          </p>
          <div className="mt-3">
            <CodeBlock
              language="json"
              code={`// Rejected response
{
  "status": "rejected",
  "reason": "Daily limit exceeded: spent 480 + requested 50 > 500 USDC (remaining: 20)"
}`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#222222] bg-[#111111] p-5">
          <h3 className="text-lg font-semibold text-white">Input Validation</h3>
          <p className="mt-2 text-sm text-zinc-400">All payment requests are validated before processing:</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span><strong className="text-zinc-200">Ethereum Address</strong> — must be 0x + 40 hex characters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span><strong className="text-zinc-200">Amount</strong> — must be positive, max 100 USDC</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span><strong className="text-zinc-200">Token</strong> — only USDC supported currently</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span><strong className="text-zinc-200">Agent ID</strong> — alphanumeric with hyphens/underscores, max 64 characters</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ErrorCodesTab() {
  const errors = [
    { code: "401", title: "Unauthorized", desc: "Invalid or revoked API key. Check your X-API-Key header.", color: "text-red-400" },
    { code: "422", title: "Validation Error", desc: "Request body failed validation. Check amount, recipient address, agent_id, and token fields.", color: "text-amber-400" },
    { code: "429", title: "Rate Limited", desc: "Exceeded 100 requests per minute for this API key. Wait and retry.", color: "text-amber-400" },
    { code: "502", title: "Transfer Failed", desc: "On-chain transaction failed. This could be due to insufficient funds, network issues, or contract errors.", color: "text-red-400" },
  ];

  const statusCodes = [
    { status: "approved", desc: "Payment passed all guardrails and was successfully sent on-chain.", color: "badge-success" },
    { status: "rejected", desc: "Payment was blocked by a guardrail (transaction cap or daily limit).", color: "badge-error" },
    { status: "error", desc: "Payment passed guardrails but the on-chain transfer failed.", color: "badge-error" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Error Codes</h2>
        <p className="mt-2 text-zinc-400">
          Reference for HTTP error codes and payment status values.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">HTTP Errors</h3>
        <div className="space-y-3">
          {errors.map((err) => (
            <div key={err.code} className="flex items-start gap-4 rounded-lg border border-[#222222] bg-[#111111] p-4">
              <span className={`font-mono text-lg font-bold ${err.color}`}>{err.code}</span>
              <div>
                <p className="font-medium text-white">{err.title}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{err.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Payment Status Values</h3>
        <div className="space-y-3">
          {statusCodes.map((s) => (
            <div key={s.status} className="flex items-start gap-4 rounded-lg border border-[#222222] bg-[#111111] p-4">
              <span className={`badge ${s.color} capitalize`}>{s.status}</span>
              <p className="text-sm text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back to Top
// ---------------------------------------------------------------------------
function BackToTop() {
  const [visible, setVisible] = useState(false);
  const checkScroll = useCallback(() => { setVisible(window.scrollY > 600); }, []);
  useEffect(() => {
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#111111] text-zinc-400 shadow-lg transition-all hover:border-blue-500/30 hover:text-white"
      aria-label="Back to top"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Docs Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("quickstart");

  const tabContent: Record<TabKey, React.ReactNode> = {
    quickstart: <QuickStartTab />,
    auth: <AuthTab />,
    api: <ApiReferenceTab />,
    guardrails: <GuardrailsTab />,
    errors: <ErrorCodesTab />,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar — fixed while scrolling */}
          <aside className="lg:w-56 lg:shrink-0">
            <div className="sticky top-16 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Documentation
              </p>
              <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-[#1a1a1a] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Sidebar info */}
              <div className="mt-6 hidden rounded-lg border border-[#222222] bg-[#111111] p-4 lg:block">
                <p className="text-xs font-semibold text-zinc-400">Need help?</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Check the{" "}
                  <a href="/dashboard" className="text-blue-400 hover:text-blue-300">Dashboard</a>{" "}
                  for live testing.
                </p>
              </div>
            </div>
          </aside>

          {/* Content — fades in on tab change */}
          <main className="min-w-0 flex-1">
            <div className="animate-fade-in" key={activeTab}>
              {tabContent[activeTab]}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#222222]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">
            Powered by Base · Secured by Coinbase CDP · Built for AI Agents
          </p>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
