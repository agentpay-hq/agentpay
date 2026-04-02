"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agentpay-api-production.up.railway.app";
const DEMO_KEY = "ap_907442ab0bff3d79c30cdef85bf733a112ec16b547886456";

// ── Demo scenario: AI travel agent with $200/tx guardrail ──
const SCENARIO = [
  { agent_id: "travel-agent-001", amount: 120.00, token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Hotel booking — Marriott Manila" },
  { agent_id: "travel-agent-001", amount: 15.50,  token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Grab taxi to NAIA" },
  { agent_id: "travel-agent-001", amount: 89.00,  token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Airport lounge access" },
  { agent_id: "travel-agent-001", amount: 340.00, token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Business class upgrade — BLOCKED by guardrail" },
  { agent_id: "travel-agent-001", amount: 45.00,  token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Travel insurance" },
  { agent_id: "travel-agent-001", amount: 22.00,  token: "USDC", recipient: "0x724481D8Fd17fCF2436078B98D84EdD69c053DDc", note: "Airport transfer tip" },
];

type TxResult = {
  id: string;
  time: string;
  agent: string;
  amount: number;
  token: string;
  note: string;
  status: "approved" | "rejected" | "pending";
  reason?: string;
  tx_hash?: string;
};

type RunState = "idle" | "running" | "done";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "badge badge-success",
    rejected: "badge badge-error",
    pending: "badge badge-warning animate-pulse",
  };
  return <span className={styles[status] ?? "badge badge-neutral"}>{status}</span>;
}

function AgentLog({ txs }: { txs: TxResult[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [txs.length]);

  if (txs.length === 0) return null;
  return (
    <div className="mt-6 rounded-xl border border-[#222222] bg-[#0d0d0d] p-4 font-mono text-xs">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Agent Log</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {txs.map((tx) => (
          <div key={tx.id} className={`flex items-start gap-2 ${tx.status === "pending" ? "opacity-60" : ""}`}>
            <span className="text-zinc-600 shrink-0">{tx.time}</span>
            <span className={tx.status === "approved" ? "text-green-400" : tx.status === "rejected" ? "text-red-400" : "text-yellow-400"}>
              {tx.status === "approved" ? "✓" : tx.status === "rejected" ? "✗" : "⟳"}
            </span>
            <span className="text-zinc-300">{tx.note}</span>
            <span className="ml-auto shrink-0 text-zinc-500">${tx.amount.toFixed(2)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [txs, setTxs] = useState<TxResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const runDemo = useCallback(async () => {
    setRunState("running");
    setTxs([]);
    setCurrentStep(0);
    setApiError(null);

    for (let i = 0; i < SCENARIO.length; i++) {
      const step = SCENARIO[i];
      const now = new Date();
      const time = now.toTimeString().slice(0, 8);
      const pendingTx: TxResult = {
        id: `tx-${Date.now()}-${i}`,
        time,
        agent: step.agent_id,
        amount: step.amount,
        token: step.token,
        note: step.note,
        status: "pending",
      };
      setTxs(prev => [...prev, pendingTx]);
      setCurrentStep(i + 1);

      // Small delay so the pending state is visible
      await new Promise(r => setTimeout(r, 600));

      try {
        const res = await fetch(`${API_URL}/pay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": DEMO_KEY,
            "Idempotency-Key": `demo-${Date.now()}-${i}`,
          },
          body: JSON.stringify({
            agent_id: step.agent_id,
            amount: step.amount,
            token: step.token,
            recipient: step.recipient,
          }),
        });

        const data = await res.json();
        const finalStatus: "approved" | "rejected" =
          data.status === "approved" || data.status === "completed" ? "approved" : "rejected";

        setTxs(prev => prev.map(tx =>
          tx.id === pendingTx.id
            ? { ...tx, status: finalStatus, reason: data.reason, tx_hash: data.tx_hash }
            : tx
        ));
      } catch (err) {
        setTxs(prev => prev.map(tx =>
          tx.id === pendingTx.id
            ? { ...tx, status: "rejected", reason: "Network error" }
            : tx
        ));
        setApiError("Could not reach API — showing simulated results.");
        // Simulate: step 4 (index 3) is blocked, rest approved
        setTxs(prev => prev.map((tx, idx) =>
          idx < txs.length
            ? { ...tx, status: idx === 3 ? "rejected" : "approved", reason: idx === 3 ? "Exceeds max_per_tx guardrail" : undefined }
            : tx
        ));
      }

      // Stagger payments like a real agent would
      await new Promise(r => setTimeout(r, 1200));
    }

    setRunState("done");
  }, []);

  // Derived stats
  const approved = txs.filter(t => t.status === "approved").length;
  const rejected = txs.filter(t => t.status === "rejected").length;
  const totalVolume = txs.filter(t => t.status === "approved").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Navigation />

      {/* Banner */}
      <div className="relative z-10 border-b border-blue-500/20 bg-blue-500/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <p className="text-sm text-blue-400">
            Live demo — real API calls on Base Sepolia testnet.{" "}
            <Link href="/docs" className="font-medium underline decoration-blue-400/30 hover:decoration-blue-400">
              Read the docs
            </Link>
          </p>
          <Link href="/get-started" className="btn btn-primary px-4 py-1.5 text-xs">Get API Key</Link>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[#222222]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Agent Demo</h1>
            <p className="mt-0.5 text-sm text-zinc-500">AI travel agent autonomously spending USDC with guardrails</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-[#222222] bg-[#0d0d0d] px-3 py-1.5 md:flex">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-medium text-zinc-500">Guardrail</span>
              <span className="text-[11px] text-zinc-600">$200/tx max</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">

        {/* Scenario explanation */}
        <div className="mb-8 rounded-xl border border-[#222222] bg-[#0d0d0d] p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-2">Scenario</p>
              <h2 className="text-lg font-semibold text-white mb-2">
                AI Travel Agent — Manila Trip
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                An autonomous AI agent books a business trip to Manila. It has a <span className="text-white font-medium">$200/tx guardrail</span> set by its operator.
                Watch it autonomously approve hotel, taxi, and lounge bookings — then get <span className="text-red-400 font-medium">blocked</span> when it tries to upgrade to business class ($340).
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="rounded-md border border-[#333] px-2 py-1">Agent ID: travel-agent-001</span>
                <span className="rounded-md border border-[#333] px-2 py-1">Network: Base Sepolia</span>
                <span className="rounded-md border border-[#333] px-2 py-1">Token: USDC</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={runDemo}
                disabled={runState === "running"}
                className={`btn btn-primary w-48 py-3 text-sm font-semibold transition-all ${
                  runState === "running" ? "opacity-60 cursor-not-allowed" : "hover:scale-105"
                }`}
              >
                {runState === "idle" && "▶ Run Demo Agent"}
                {runState === "running" && (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Step {currentStep}/{SCENARIO.length}
                  </span>
                )}
                {runState === "done" && "↺ Run Again"}
              </button>
              {runState !== "idle" && (
                <p className="text-xs text-zinc-600 text-center">
                  Making real API calls to<br />
                  <span className="text-zinc-500 font-mono text-[10px]">railway.app/pay</span>
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {runState === "running" && (
            <div className="mt-6">
              <div className="h-1 w-full rounded-full bg-[#222]">
                <div
                  className="h-1 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(currentStep / SCENARIO.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats — only show once demo starts */}
        {txs.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            {[
              { label: "Payments Fired", value: txs.length.toString() },
              { label: "Approved", value: approved.toString(), color: "text-green-400" },
              { label: "Blocked by Guardrail", value: rejected.toString(), color: "text-red-400" },
              { label: "Volume Settled", value: `$${totalVolume.toFixed(2)}`, suffix: "USDC" },
            ].map(m => (
              <div key={m.label} className="card p-5">
                <p className="text-sm font-medium text-zinc-500">{m.label}</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${m.color ?? "text-white"}`}>
                  {m.value}
                  {m.suffix && <span className="ml-1 text-sm font-normal text-zinc-500">{m.suffix}</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Transaction table */}
        {txs.length > 0 && (
          <div className="card">
            <div className="border-b border-[#222222] px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Transaction Feed</h2>
              {apiError && <p className="text-xs text-yellow-500">{apiError}</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#222222] text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Agent</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map(tx => (
                    <tr
                      key={tx.id}
                      className={`border-b border-[#222222] transition-colors ${
                        tx.status === "rejected" ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">{tx.time}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-300">{tx.agent}</td>
                      <td className="px-5 py-3 font-medium text-white">${tx.amount.toFixed(2)}</td>
                      <td className="px-5 py-3"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-3 text-xs text-zinc-500">
                        {tx.status === "rejected" ? (
                          <span className="text-red-400 font-medium">{tx.reason ?? tx.note}</span>
                        ) : tx.tx_hash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            {tx.tx_hash.slice(0, 10)}...
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
                            </svg>
                          </a>
                        ) : (
                          tx.note
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agent log */}
            <div className="px-5 pb-5">
              <AgentLog txs={txs} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {txs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl">🤖</div>
            <p className="text-zinc-400 font-medium">Agent is standing by</p>
            <p className="text-zinc-600 text-sm mt-1">Hit <span className="text-white">Run Demo Agent</span> to watch it work</p>
          </div>
        )}

        {/* Done state CTA */}
        {runState === "done" && (
          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
            <p className="text-white font-semibold mb-1">That&#39;s AgentPay in action.</p>
            <p className="text-zinc-400 text-sm mb-4">
              Real stablecoin payments. Real guardrails. Zero human intervention.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/docs" className="btn btn-primary px-5 py-2 text-sm">Read the Docs</Link>
              <Link href="/get-started" className="btn btn-secondary px-5 py-2 text-sm">Get API Key</Link>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 border-t border-[#222222] mt-8">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">Powered by Base · Secured by Coinbase CDP · Built for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
