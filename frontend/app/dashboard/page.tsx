"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://agentpay-api-production.up.railway.app";

type Tx = {
  id: number;
  timestamp: string;
  agent_id: string;
  amount: number;
  token: string;
  recipient: string;
  tx_hash: string | null;
  decision: string;
  reason: string;
};

type Tab = "transactions" | "guardrails" | "webhooks";

function StatusBadge({ decision }: { decision: string }) {
  const ok = decision === "approved";
  return (
    <span className={`badge ${ok ? "badge-success" : "badge-error"} capitalize`}>
      {decision}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-3xl opacity-30">📭</div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const [apiKey, setApiKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [tab, setTab] = useState<Tab>("transactions");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guardrails state
  const [agentId, setAgentId] = useState("my-agent");
  const [maxPerTx, setMaxPerTx] = useState("100");
  const [maxPerDay, setMaxPerDay] = useState("500");
  const [guardrailSaving, setGuardrailSaving] = useState(false);
  const [guardrailMsg, setGuardrailMsg] = useState("");

  // Webhooks state
  const [webhookAgentId, setWebhookAgentId] = useState("my-agent");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState("");

  const fetchTxs = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/transactions`, {
        headers: { "X-API-Key": key },
      });
      if (!res.ok) { setError("Invalid API key or server error."); return; }
      const data = await res.json();
      setTxs(Array.isArray(data) ? data : data.transactions || []);
    } catch {
      setError("Could not connect to API.");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = () => {
    if (!inputKey.startsWith("ap_")) { setError("Key must start with ap_"); return; }
    setApiKey(inputKey);
    fetchTxs(inputKey);
  };

  const saveGuardrails = async () => {
    if (!apiKey) return;
    setGuardrailSaving(true);
    setGuardrailMsg("");
    try {
      const res = await fetch(`${API}/guardrails/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ max_per_tx: parseFloat(maxPerTx), max_per_day: parseFloat(maxPerDay) }),
      });
      if (res.ok) setGuardrailMsg("✓ Guardrails saved");
      else setGuardrailMsg("Failed to save guardrails");
    } catch { setGuardrailMsg("Network error"); }
    finally { setGuardrailSaving(false); }
  };

  const saveWebhook = async () => {
    if (!apiKey || !webhookUrl) return;
    setWebhookSaving(true);
    setWebhookMsg("");
    try {
      const res = await fetch(`${API}/webhooks/${webhookAgentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ url: webhookUrl, events: ["payment.approved", "payment.rejected"] }),
      });
      if (res.ok) setWebhookMsg("✓ Webhook saved");
      else setWebhookMsg("Failed to save webhook");
    } catch { setWebhookMsg("Network error"); }
    finally { setWebhookSaving(false); }
  };

  // Stats
  const approved = txs.filter(t => t.decision === "approved").length;
  const volume = txs.filter(t => t.decision === "approved").reduce((s, t) => s + t.amount, 0);
  const agents = new Set(txs.map(t => t.agent_id)).size;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Navigation />

      {/* Header */}
      <div className="relative z-10 border-b border-[#222222]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Monitor your AI agents and payments</p>
          </div>
          {!apiKey && (
            <Link href="/get-started" className="btn btn-primary px-4 py-2 text-sm">
              Get API Key
            </Link>
          )}
          {apiKey && (
            <div className="flex items-center gap-2 rounded-lg border border-[#222] bg-[#0d0d0d] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">{apiKey.slice(0, 12)}...</span>
              <button onClick={() => { setApiKey(""); setTxs([]); setInputKey(""); }} className="text-xs text-zinc-600 hover:text-zinc-400 ml-1">×</button>
            </div>
          )}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">

        {/* API Key input */}
        {!apiKey && (
          <div className="card p-8 mb-8 max-w-lg mx-auto text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Connect your API key</h2>
            <p className="text-sm text-zinc-500 mb-6">Enter your key to view transactions and manage guardrails.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && connect()}
                placeholder="ap_..."
                className="flex-1 rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm font-mono text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none"
              />
              <button onClick={connect} className="btn btn-primary px-4 py-2 text-sm">Connect</button>
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <p className="mt-4 text-xs text-zinc-600">
              No key? <Link href="/get-started" className="text-blue-400 hover:text-blue-300">Get one free →</Link>
            </p>
          </div>
        )}

        {/* Stats */}
        {apiKey && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              {[
                { label: "Transactions", value: txs.length.toString() },
                { label: "Approved", value: approved.toString(), color: "text-green-400" },
                { label: "Volume", value: `$${volume.toFixed(2)}`, suffix: "USDC" },
                { label: "Active Agents", value: agents.toString() },
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

            {/* Tabs */}
            <div className="flex gap-1 mb-6 rounded-lg border border-[#222] bg-[#0d0d0d] p-1 w-fit">
              {(["transactions", "guardrails", "webhooks"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? "bg-[#1a1a1a] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Transactions tab */}
            {tab === "transactions" && (
              <div className="card">
                <div className="border-b border-[#222] px-5 py-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
                  <button onClick={() => fetchTxs(apiKey)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    {loading ? "Loading..." : "↺ Refresh"}
                  </button>
                </div>
                {txs.length === 0 && !loading
                  ? <EmptyState message="No transactions yet. Make your first payment to see it here." />
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#222] text-xs font-medium uppercase tracking-wider text-zinc-500">
                            <th className="px-5 py-3">Time</th>
                            <th className="px-5 py-3">Agent</th>
                            <th className="px-5 py-3">Amount</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txs.slice(0, 50).map(tx => (
                            <tr key={tx.id} className={`border-b border-[#222] transition-colors ${tx.decision !== "approved" ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-[#1a1a1a]"}`}>
                              <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">
                                {new Date(tx.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-5 py-3 font-mono text-xs text-zinc-300">{tx.agent_id}</td>
                              <td className="px-5 py-3 font-medium text-white">${tx.amount.toFixed(2)} <span className="text-zinc-500 font-normal text-xs">{tx.token}</span></td>
                              <td className="px-5 py-3"><StatusBadge decision={tx.decision} /></td>
                              <td className="px-5 py-3 text-xs">
                                {tx.tx_hash ? (
                                  <a href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    {tx.tx_hash.slice(0, 10)}...
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
                                  </a>
                                ) : (
                                  <span className="text-zinc-500">{tx.reason}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}

            {/* Guardrails tab */}
            {tab === "guardrails" && (
              <div className="card p-8 max-w-lg">
                <h2 className="text-lg font-semibold text-white mb-1">Configure Guardrails</h2>
                <p className="text-sm text-zinc-500 mb-6">Set spend limits for your AI agents. These are enforced on every payment.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Agent ID</label>
                    <input type="text" value={agentId} onChange={e => setAgentId(e.target.value)}
                      className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm font-mono text-white focus:border-blue-500/50 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Max per transaction ($)</label>
                      <input type="number" value={maxPerTx} onChange={e => setMaxPerTx(e.target.value)}
                        className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Max per day ($)</label>
                      <input type="number" value={maxPerDay} onChange={e => setMaxPerDay(e.target.value)}
                        className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={saveGuardrails} disabled={guardrailSaving} className="btn btn-primary w-full py-2.5 text-sm">
                    {guardrailSaving ? "Saving..." : "Save Guardrails"}
                  </button>
                  {guardrailMsg && <p className={`text-sm ${guardrailMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{guardrailMsg}</p>}
                </div>
              </div>
            )}

            {/* Webhooks tab */}
            {tab === "webhooks" && (
              <div className="card p-8 max-w-lg">
                <h2 className="text-lg font-semibold text-white mb-1">Configure Webhooks</h2>
                <p className="text-sm text-zinc-500 mb-6">Receive real-time events when payments are approved or rejected.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Agent ID</label>
                    <input type="text" value={webhookAgentId} onChange={e => setWebhookAgentId(e.target.value)}
                      className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm font-mono text-white focus:border-blue-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Webhook URL</label>
                    <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://your-server.com/webhook"
                      className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none" />
                  </div>
                  <div className="rounded-lg border border-[#222] bg-[#0d0d0d] p-3">
                    <p className="text-xs text-zinc-500 mb-2 font-medium">Events delivered:</p>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-400 flex items-center gap-2"><span className="text-green-400">●</span> payment.approved</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-2"><span className="text-red-400">●</span> payment.rejected</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#222] bg-[#0d0d0d] p-3">
                    <p className="text-xs text-zinc-500 mb-1 font-medium">Payload example:</p>
                    <pre className="text-[11px] text-zinc-400 overflow-x-auto">{`{
  "event": "payment.approved",
  "agent_id": "my-agent",
  "amount": 45.00,
  "token": "USDC",
  "tx_hash": "0xabc..."
}`}</pre>
                  </div>
                  <button onClick={saveWebhook} disabled={webhookSaving || !webhookUrl} className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60">
                    {webhookSaving ? "Saving..." : "Save Webhook"}
                  </button>
                  {webhookMsg && <p className={`text-sm ${webhookMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{webhookMsg}</p>}
                </div>
              </div>
            )}
          </>
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
