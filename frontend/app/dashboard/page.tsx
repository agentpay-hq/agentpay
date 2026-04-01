"use client";
import { useState } from "react";

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

export default function Dashboard() {
  const [apiKey, setApiKey] = useState("");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [account, setAccount] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, txRes] = await Promise.all([
        fetch(`${API}/me`, { headers: { "X-API-Key": apiKey } }),
        fetch(`${API}/transactions`, { headers: { "X-API-Key": apiKey } }),
      ]);
      if (!meRes.ok) throw new Error("Invalid API key");
      const me = await meRes.json();
      const txData = await txRes.json();
      setAccount(me);
      setTxs(Array.isArray(txData) ? txData : []);
      setLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
    setLoading(false);
  };

  const approved = txs.filter(t => t.decision === "approved").length;
  const total = txs.reduce((s, t) => t.decision === "approved" ? s + t.amount : s, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-zinc-400 mb-8">Monitor your autonomous payment activity</p>

        {!loaded ? (
          <div className="max-w-lg">
            <div className="rounded-xl border border-zinc-800 bg-[#111] p-8">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Enter your API key</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && load()}
                placeholder="ap_..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none mb-3"
              />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button
                onClick={load}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading..." : "View Dashboard →"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Logged in as</p>
                <p className="font-semibold">{account?.name} <span className="text-zinc-400 font-normal">({account?.email})</span></p>
              </div>
              <button onClick={() => { setLoaded(false); setApiKey(""); setTxs([]); setAccount(null); }} className="text-sm text-zinc-500 hover:text-zinc-300">Sign out</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-zinc-800 bg-[#111] p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Transactions</p>
                <p className="text-3xl font-bold">{txs.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#111] p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Approved</p>
                <p className="text-3xl font-bold text-emerald-400">{approved}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#111] p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Volume (USDC)</p>
                <p className="text-3xl font-bold">${total.toFixed(2)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#111] overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="font-semibold">Transaction History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left">Time</th>
                      <th className="px-6 py-3 text-left">Agent</th>
                      <th className="px-6 py-3 text-left">Amount</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map(tx => (
                      <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-300">{tx.agent_id}</td>
                        <td className="px-6 py-4 font-semibold">${tx.amount} {tx.token}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tx.decision === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                            {tx.decision}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {tx.tx_hash ? (
                            <a href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              {tx.tx_hash.slice(0, 10)}...
                            </a>
                          ) : <span className="text-zinc-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
