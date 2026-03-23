"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute right-2 top-2 rounded-md bg-[#1a1a1a] px-2 py-1 text-[10px] font-medium text-zinc-500 opacity-0 transition-all hover:text-white group-hover:opacity-100"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeStep({ step, title, description, code }: { step: number; title: string; description: string; code: string }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">{step}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="mb-3 text-sm text-zinc-400">{description}</p>
      <div className="group relative overflow-hidden rounded-lg border border-[#222222]">
        <CopyButton text={code} />
        <pre className="overflow-x-auto bg-[#0a0a0a] p-4 text-[13px] leading-6">
          <code className="text-zinc-300">{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.agentpay.xyz";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Get your API key in 60 seconds</h1>
          <p className="mt-3 text-zinc-400">Follow these steps to start making autonomous payments.</p>
        </div>

        <div className="mt-12 space-y-10">
          <CodeStep
            step={1}
            title="Start the API server"
            description="Clone the repo and start the FastAPI backend locally."
            code={`git clone https://github.com/agentpay-hq/agentpay.git
cd agentpay/api
pip install -r requirements.txt
uvicorn main:app --reload`}
          />

          <CodeStep
            step={2}
            title="Create your first API key"
            description="Generate an API key to authenticate your requests."
            code={`curl -X POST ${apiUrl}/keys \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-first-key"}'

# Save the returned key — it won't be shown again
# { "key": "ap_a1b2c3...", "name": "my-first-key" }`}
          />

          <CodeStep
            step={3}
            title="Make your first payment"
            description="Send a payment through the API with guardrails enforced automatically."
            code={`curl -X POST ${apiUrl}/pay \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ap_YOUR_KEY_HERE" \\
  -d '{
    "agent_id": "my-first-agent",
    "amount": 1.00,
    "token": "USDC",
    "recipient": "0x0000000000000000000000000000000000000001",
    "reason": "Test payment"
  }'`}
          />
        </div>

        <div className="mt-12 rounded-xl border border-[#222222] bg-[#111111] p-6 text-center">
          <p className="text-sm font-medium text-zinc-400">
            Cloud-hosted API coming soon — <Link href="/#waitlist" className="text-blue-400 hover:text-blue-300">join the waitlist</Link> for early access.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/docs" className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
            Read the full documentation &rarr;
          </Link>
        </div>
      </div>

      <footer className="border-t border-[#222222]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">Powered by Base · Secured by Coinbase CDP</p>
        </div>
      </footer>
    </div>
  );
}
