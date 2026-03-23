"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";

// ---------------------------------------------------------------------------
// Static demo data — no API calls, always works
// ---------------------------------------------------------------------------

const DEMO_TRANSACTIONS = [
  { id: 1, time: "14:32:01", agent: "trading-bot-001", amount: 50.00, token: "USDC", recipient: "0x8f3a...c7d2", status: "approved", reason: "API access fee", hash: "0xa1b2c3d4e5f6789012345678901234567890abcd" },
  { id: 2, time: "14:31:45", agent: "payment-agent-003", amount: 25.00, token: "USDC", recipient: "0x4e2c...9f1a", status: "approved", reason: "iGaming player payout", hash: "0xb2c3d4e5f67890123456789012345678901abcde" },
  { id: 3, time: "14:30:22", agent: "defi-yield-bot", amount: 100.00, token: "USDC", recipient: "0x7d8e...3b4c", status: "approved", reason: "DeFi yield distribution", hash: "0xc3d4e5f678901234567890123456789012abcdef" },
  { id: 4, time: "14:29:58", agent: "trading-bot-001", amount: 10.00, token: "USDC", recipient: "0x2f1a...6e8d", status: "approved", reason: "Data feed subscription", hash: "0xd4e5f6789012345678901234567890123abcdef0" },
  { id: 5, time: "14:28:33", agent: "procurement-ai", amount: 75.00, token: "USDC", recipient: "0x5c9b...1a3f", status: "approved", reason: "Supplier invoice payment", hash: "0xe5f67890123456789012345678901234abcdef01" },
  { id: 6, time: "14:27:11", agent: "royalty-agent-02", amount: 5.00, token: "USDC", recipient: "0x9d4e...7c2b", status: "approved", reason: "Creator royalty payout", hash: "0xf678901234567890123456789012345abcdef012" },
  { id: 7, time: "14:25:49", agent: "trading-bot-001", amount: 150.00, token: "USDC", recipient: "0x1a2b...8e4f", status: "rejected", reason: "Amount exceeds $100 per-tx cap" },
  { id: 8, time: "14:24:02", agent: "payment-agent-003", amount: 30.00, token: "USDC", recipient: "0x6f3d...2c1a", status: "approved", reason: "Affiliate commission", hash: "0x0789012345678901234567890123456abcdef0123" },
  { id: 9, time: "14:22:18", agent: "defi-yield-bot", amount: 45.00, token: "USDC", recipient: "0x3e7c...9d5b", status: "approved", reason: "Liquidity provider reward", hash: "0x189012345678901234567890123456abcdef01234" },
  { id: 10, time: "14:20:55", agent: "trading-bot-001", amount: 15.00, token: "USDC", recipient: "0x8a1f...4b6e", status: "approved", reason: "Gas fee reimbursement", hash: "0x289012345678901234567890123456abcdef012345" },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "approved" ? "badge-success" : "badge-error"} capitalize`}>
      {status}
    </span>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Navigation />

      {/* Demo banner */}
      <div className="relative z-10 border-b border-blue-500/20 bg-blue-500/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <p className="text-sm text-blue-400">
            This is a demo with sample data — <Link href="/get-started" className="font-medium underline decoration-blue-400/30 hover:decoration-blue-400">connect your API key</Link> to see real transactions.
          </p>
          <Link href="/get-started" className="btn btn-primary px-4 py-1.5 text-xs">Get API Key</Link>
        </div>
      </div>

      {/* Dashboard header */}
      <div className="relative z-10 border-b border-[#222222]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Sample data — for demonstration purposes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-[#222222] bg-[#0d0d0d] px-3 py-1.5 md:flex">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-green-400" />
              <span className="text-[11px] font-medium text-zinc-500">Guardrails Active</span>
              <span className="text-[11px] text-zinc-600">$100/tx · $500/day</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Transactions", value: "2,847" },
            { label: "Total Volume", value: "$142,350", suffix: "USDC" },
            { label: "Approval Rate", value: "99.8%" },
            { label: "Active Agents", value: "12" },
          ].map(m => (
            <div key={m.label} className="card card-glow p-5">
              <p className="text-sm font-medium text-zinc-500">{m.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {m.value}
                {m.suffix && <span className="ml-1 text-sm font-normal text-zinc-500">{m.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Transaction table */}
        <div className="card mt-8">
          <div className="border-b border-[#222222] px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#222222] text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Agent ID</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TRANSACTIONS.map(tx => (
                  <tr key={tx.id} className="border-b border-[#222222] transition-colors hover:bg-[#1a1a1a]">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">{tx.time}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-300">{tx.agent}</td>
                    <td className="px-5 py-3 font-medium text-white">{tx.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-zinc-400">{tx.token}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{tx.recipient}</td>
                    <td className="px-5 py-3"><StatusBadge status={tx.status} /></td>
                    <td className="max-w-[250px] px-5 py-3 text-xs text-zinc-500">
                      {tx.hash ? (
                        <a href={`https://sepolia.basescan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-4)}
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
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#222222]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">Powered by Base · Secured by Coinbase CDP · Built for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
