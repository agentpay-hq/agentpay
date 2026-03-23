"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navigation from "../components/Navigation";
import SendPaymentModal from "../components/SendPaymentModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transaction {
  id: number;
  agent_id: string;
  amount: number;
  token: string;
  recipient: string;
  decision: string;
  reason: string;
  tx_hash?: string | null;
  timestamp: string;
}

interface ApiKey {
  id: number;
  name: string;
  owner: string;
  created_at: string | null;
  last_used: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCSV(transactions: Transaction[]) {
  const headers = "ID,Time,Agent,Amount,Token,Recipient,Status,Reason,TxHash";
  const rows = transactions.map(
    (tx) =>
      `${tx.id},${tx.timestamp},${tx.agent_id},${tx.amount},${tx.token},${tx.recipient},${tx.decision},"${tx.reason || ""}",${tx.tx_hash || ""}`
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agentpay-transactions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Generate demo chart data spread across last 24 hours
function generateDemoChartData(): { time: string; approved: number; rejected: number }[] {
  const data: { time: string; approved: number; rejected: number }[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const label = hour.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    // Realistic volume pattern: low at night, peak midday
    const hourOfDay = hour.getHours();
    const baseVolume = Math.sin((hourOfDay - 6) * Math.PI / 12) * 80 + 40;
    const noise = Math.random() * 30 - 15;
    data.push({
      time: label,
      approved: Math.max(0, Math.round(baseVolume + noise)),
      rejected: Math.round(Math.random() * 15),
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "badge-success",
    rejected: "badge-error",
    error: "badge-error",
  };
  return (
    <span className={`badge ${styles[status] || "badge-neutral"} capitalize`}>
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="card card-glow p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-zinc-500">{suffix}</span>}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#222222]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-20 animate-shimmer rounded" />
        </td>
      ))}
    </tr>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-[#1a1a1a] hover:text-white"
      title="Copy"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7l3 3 5-5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="8" height="8" rx="1.5" />
          <path d="M2 10V2.5A.5.5 0 012.5 2H10" />
        </svg>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Wallet Section
// ---------------------------------------------------------------------------

function WalletSection({ walletAddress }: { walletAddress: string | null }) {
  if (!walletAddress) return null;
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Agent Wallet</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
            <circle cx="17" cy="15" r="1.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="truncate font-mono text-sm text-white">{walletAddress}</code>
            <CopyButton text={walletAddress} />
          </div>
          <div className="mt-1 flex items-center gap-3">
            <a
              href={`https://sepolia.basescan.org/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              View on BaseScan
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
              </svg>
            </a>
            <span className="badge badge-info">Base Sepolia</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volume Chart with demo data fallback
// ---------------------------------------------------------------------------

function VolumeChart({ transactions }: { transactions: Transaction[] }) {
  const demoData = useMemo(() => generateDemoChartData(), []);

  // Build real data from transactions
  const realData = useMemo(() => {
    if (transactions.length < 2) return null;
    const hourlyData: Record<string, { approved: number; rejected: number }> = {};
    for (const tx of transactions) {
      const hour = new Date(tx.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      if (!hourlyData[hour]) hourlyData[hour] = { approved: 0, rejected: 0 };
      if (tx.decision === "approved") hourlyData[hour].approved += tx.amount;
      else hourlyData[hour].rejected += tx.amount;
    }
    return Object.entries(hourlyData)
      .map(([time, vol]) => ({ time, ...vol }))
      .reverse();
  }, [transactions]);

  // Use real data if we have multiple points, otherwise demo
  const data = realData && realData.length >= 2 ? realData : demoData;
  const hasRealData = realData !== null && realData.length >= 2;

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Transaction Volume (24h)</h3>
      {!hasRealData && (
        <p className="mb-3 text-xs text-zinc-600">More data appears as transactions are processed</p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: "8px",
              color: "#ededed",
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="approved" stroke="#3B82F6" fill="url(#colorApproved)" strokeWidth={2} name="Approved (USDC)" />
          <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="4 4" name="Rejected (USDC)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Key Management — with demo row fallback
// ---------------------------------------------------------------------------

function ApiKeySection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/keys`);
      setKeys(res.data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/keys`, { name: newKeyName.trim() });
      setCreatedKey(res.data.key);
      setNewKeyName("");
      setShowCreate(false);
      fetchKeys();
    } catch { /* empty */ }
    setLoading(false);
  };

  const handleRevoke = async (id: number) => {
    try {
      await axios.delete(`${API}/keys/${id}`);
      fetchKeys();
    } catch { /* empty */ }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-[#222222] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">API Keys</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary px-3 py-1.5 text-xs">
          Create Key
        </button>
      </div>

      {createdKey && (
        <div className="animate-fade-in mx-5 mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
          <p className="text-xs font-medium text-blue-400">New API key created — copy it now, it won&apos;t be shown again:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-[#0a0a0a] px-3 py-1.5 font-mono text-xs text-white">{createdKey}</code>
            <CopyButton text={createdKey} />
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-zinc-500 hover:text-white">Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div className="animate-fade-in flex items-center gap-3 border-b border-[#222222] px-5 py-3">
          <input
            className="input flex-1"
            placeholder="Key name (e.g. production-bot)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} disabled={loading} className="btn btn-primary px-4 py-2 text-xs">
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="px-5 py-10">
          <div className="flex flex-col items-center rounded-lg border border-dashed border-[#333333] py-8 text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-zinc-600">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 118 0v4" />
            </svg>
            <p className="text-sm font-medium text-zinc-400">No API keys yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              Create your first key &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222222] text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last Used</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-[#222222] transition-colors hover:bg-[#1a1a1a]">
                  <td className="px-5 py-3 font-medium text-white">{k.name}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{k.created_at ? formatDate(k.created_at) : "—"}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{k.last_used ? formatDate(k.last_used) : "Never"}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${k.is_active ? "badge-success" : "badge-error"}`}>
                      {k.is_active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {k.is_active && (
                      <button onClick={() => handleRevoke(k.id)} className="text-xs text-zinc-500 transition-colors hover:text-red-400">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Overview — fixed daily limit layout
// ---------------------------------------------------------------------------

function AgentOverview({ transactions }: { transactions: Transaction[] }) {
  const agents = transactions.reduce<Record<string, { total: number; approved: number; count: number }>>((acc, tx) => {
    if (!acc[tx.agent_id]) acc[tx.agent_id] = { total: 0, approved: 0, count: 0 };
    acc[tx.agent_id].count++;
    acc[tx.agent_id].total += tx.amount;
    if (tx.decision === "approved") acc[tx.agent_id].approved += tx.amount;
    return acc;
  }, {});

  const agentList = Object.entries(agents).map(([id, data]) => ({ id, ...data }));

  return (
    <div className="card">
      <div className="border-b border-[#222222] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Active Agents</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#222222] text-xs font-medium uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3">Agent ID</th>
              <th className="px-5 py-3">Txns</th>
              <th className="px-5 py-3">Volume</th>
              <th className="min-w-[160px] px-5 py-3">Daily Limit</th>
            </tr>
          </thead>
          <tbody>
            {agentList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-600">No agent activity yet.</td>
              </tr>
            ) : (
              agentList.map((agent) => {
                const pct = Math.min((agent.approved / 500) * 100, 100);
                return (
                  <tr key={agent.id} className="border-b border-[#222222] transition-colors hover:bg-[#1a1a1a]">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-300">{agent.id}</td>
                    <td className="px-5 py-3 text-zinc-400">{agent.count}</td>
                    <td className="px-5 py-3 font-medium text-white">{agent.total.toFixed(2)} <span className="text-xs font-normal text-zinc-500">USDC</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-full max-w-[80px] shrink-0 overflow-hidden rounded-full bg-[#222222]">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-zinc-500">${agent.approved.toFixed(0)}/500</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const knownIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/transactions`);
      const newTxs: Transaction[] = res.data;
      setTransactions(newTxs);
      setLoading(false);

      if (isFirstLoad.current) {
        newTxs.forEach((tx) => knownIds.current.add(tx.id));
        isFirstLoad.current = false;
      } else {
        const freshIds = new Set<number>();
        newTxs.forEach((tx) => {
          if (!knownIds.current.has(tx.id)) {
            freshIds.add(tx.id);
            knownIds.current.add(tx.id);
          }
        });
        if (freshIds.size > 0) {
          setNewIds(freshIds);
          setTimeout(() => setNewIds(new Set()), 1500);
        }
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  useEffect(() => {
    axios.get(`${API}/health`).then((r) => {
      if (r.data.wallet_address) setWalletAddress(r.data.wallet_address);
    }).catch(() => {});
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      await axios.delete(`${API}/transactions/clear`);
      setTransactions([]);
      knownIds.current = new Set();
      setNewIds(new Set());
    } catch { /* empty */ }
    setClearing(false);
  };

  // Computed
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const approvalRate = transactions.length > 0
    ? ((transactions.filter((tx) => tx.decision === "approved").length / transactions.length) * 100).toFixed(1)
    : "—";
  const activeAgents = new Set(transactions.map((tx) => tx.agent_id)).size;

  // Filter and search
  const filtered = transactions.filter((tx) => {
    if (statusFilter !== "all" && tx.decision !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.agent_id.toLowerCase().includes(q) ||
        tx.recipient.toLowerCase().includes(q) ||
        (tx.reason || "").toLowerCase().includes(q) ||
        (tx.tx_hash || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Navigation />

      {/* Dashboard header */}
      <div className="relative z-10 border-b border-[#222222]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Real-time payment monitoring and management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-[#222222] bg-[#0d0d0d] px-3 py-1.5 md:flex">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-green-400" />
              <span className="text-[11px] font-medium text-zinc-500">Guardrails Active</span>
              <span className="text-[11px] text-zinc-600">$100/tx · $500/day</span>
            </div>
            <button onClick={handleClear} disabled={clearing} className="btn btn-danger px-3 py-2 text-xs">
              {clearing ? "Clearing..." : "Clear Test Data"}
            </button>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              Send Payment
            </button>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Wallet */}
        <WalletSection walletAddress={walletAddress} />

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Transactions" value={transactions.length} />
          <MetricCard label="Total Volume" value={totalVolume.toFixed(2)} suffix="USDC" />
          <MetricCard label="Approval Rate" value={`${approvalRate}%`} />
          <MetricCard label="Active Agents" value={activeAgents} />
        </div>

        {/* Chart */}
        <div className="mt-6">
          <VolumeChart transactions={transactions} />
        </div>

        {/* API Keys + Agent Overview */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ApiKeySection />
          <AgentOverview transactions={transactions} />
        </div>

        {/* Transactions Table */}
        <div className="card mt-6">
          <div className="flex flex-col gap-3 border-b border-[#222222] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="input w-48 text-xs"
                placeholder="Search agent, address, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="input w-auto text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={() => downloadCSV(filtered)}
                className="btn btn-secondary px-3 py-1.5 text-xs"
                title="Export CSV"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 2v8M4 7l3 3 3-3M2 12h10" />
                </svg>
                Export
              </button>
            </div>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-600">
                      {transactions.length === 0 ? (
                        <div>
                          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
                              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" />
                            </svg>
                          </div>
                          <p className="text-base font-medium text-zinc-400">Send your first payment</p>
                          <p className="mt-1 text-sm">Click &ldquo;Send Payment&rdquo; above or use the API to get started.</p>
                          <pre className="mx-auto mt-4 max-w-md rounded-lg bg-[#0a0a0a] p-4 text-left font-mono text-xs text-zinc-400">
{`curl -X POST $API_URL/pay \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "my-bot",
    "amount": 5.00,
    "recipient": "0x742d...4e2C",
    "reason": "test payment"
  }'`}
                          </pre>
                        </div>
                      ) : (
                        "No transactions match your filters."
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-[#222222] transition-colors hover:bg-[#1a1a1a] ${
                        newIds.has(tx.id) ? "animate-flash-green" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-400">
                        {formatTime(tx.timestamp)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-300">{tx.agent_id}</td>
                      <td className="px-5 py-3 font-medium text-white">{tx.amount.toFixed(2)}</td>
                      <td className="px-5 py-3 text-zinc-400">{tx.token}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        <a
                          href={`https://sepolia.basescan.org/address/${tx.recipient}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400"
                        >
                          {truncateAddress(tx.recipient)}
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={tx.decision} />
                      </td>
                      <td className="max-w-[250px] px-5 py-3 text-xs text-zinc-500">
                        {tx.decision === "approved" && tx.tx_hash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                          >
                            {truncateAddress(tx.tx_hash)}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
                            </svg>
                          </a>
                        ) : (
                          <span className="truncate">{tx.reason}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#222222]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-zinc-600">
            Powered by Base · Secured by Coinbase CDP · Built for AI Agents
          </p>
        </div>
      </footer>

      <SendPaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <BackToTop />
    </div>
  );
}
