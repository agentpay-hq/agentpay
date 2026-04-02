"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://agentpay-api-production.up.railway.app";

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

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#222222]">
      <CopyButton text={code} />
      <pre className="overflow-x-auto bg-[#0a0a0a] p-4 text-[13px] leading-6">
        <code className="text-zinc-300">{code}</code>
      </pre>
    </div>
  );
}

type Step = "form" | "key" | "test";

export default function GetStartedPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keyCopied, setKeyCopied] = useState(false);

  const handleSignup = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Valid email is required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Signup failed. Try a different email.");
        return;
      }
      setApiKey(data.api_key || data.key || "");
      setStep("key");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const testPayload = `curl -X POST ${API}/pay \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || "ap_YOUR_KEY_HERE"}" \\
  -d '{
    "agent_id": "my-first-agent",
    "amount": 1.00,
    "token": "USDC",
    "recipient": "0x0000000000000000000000000000000000000001",
    "reason": "Test payment"
  }'`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Navigation />

      <div className="relative z-10 mx-auto max-w-lg px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Get your API key</h1>
          <p className="mt-2 text-zinc-400">Instant access. No credit card required.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {(["form", "key", "test"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s ? "bg-blue-500 text-white" :
                (step === "key" && s === "form") || (step === "test" && s !== "test")
                  ? "bg-green-500/20 text-green-400" : "bg-[#222] text-zinc-500"
              }`}>
                {(step === "key" && s === "form") || (step === "test" && s !== "test") ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`h-px w-8 ${step !== "form" && i === 0 ? "bg-green-500/40" : step === "test" && i === 1 ? "bg-green-500/40" : "bg-[#333]"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Signup form */}
        {step === "form" && (
          <div className="card p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Create your account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignup()}
                  placeholder="Gerry Go"
                  className="w-full rounded-lg border border-[#333] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignup()}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-[#333] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                onClick={handleSignup}
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm font-semibold mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </span>
                ) : "Get API Key →"}
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-zinc-600">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">Privacy Policy</Link>.
            </p>
          </div>
        )}

        {/* Step 2: Show API key */}
        {step === "key" && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Your API key is ready</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Copy it now — we won't show it again.</p>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono text-blue-300 break-all">{apiKey}</code>
                <button
                  onClick={copyKey}
                  className="shrink-0 rounded-md bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  {keyCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 mb-6">
              <p className="text-xs text-yellow-400">⚠ Store this key securely. It grants access to make payments on your behalf.</p>
            </div>

            <div className="space-y-2 text-sm text-zinc-400 mb-6">
              <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Testnet access (Base Sepolia)</p>
              <p className="flex items-center gap-2"><span className="text-green-400">✓</span> $100/tx guardrail (configurable)</p>
              <p className="flex items-center gap-2"><span className="text-green-400">✓</span> Webhook support</p>
            </div>

            <button onClick={() => setStep("test")} className="btn btn-primary w-full py-3 text-sm font-semibold">
              Test your key →
            </button>
          </div>
        )}

        {/* Step 3: Test */}
        {step === "test" && (
          <div className="space-y-6">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <h2 className="text-lg font-semibold text-white">Make your first payment</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Run this in your terminal to fire a test payment:</p>
              <CodeBlock code={testPayload} />
            </div>

            <div className="card p-8">
              <h3 className="text-sm font-semibold text-white mb-4">Install the SDK</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Node.js / TypeScript</p>
                  <CodeBlock code="npm install @imgerrygo/agentpay-sdk" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Python / LangChain</p>
                  <CodeBlock code="pip install agentpay-langchain" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/docs" className="btn btn-secondary flex-1 py-2.5 text-sm text-center">
                Read the Docs
              </Link>
              <Link href="/demo" className="btn btn-primary flex-1 py-2.5 text-sm text-center">
                Watch the Demo
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 border-t border-[#222222] mt-8">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">Powered by Base · Secured by Coinbase CDP · Built for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
