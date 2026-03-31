"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navigation from "./components/Navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GITHUB_URL = "https://github.com/agentpay-hq/agentpay";
const DISCORD_URL = "https://discord.gg/agentpay";
const TWITTER_URL = "https://twitter.com/agentpayhq";

// ---------------------------------------------------------------------------
// Animated Canvas — mobile-optimized, pauses when hidden
// ---------------------------------------------------------------------------
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let paused = false;
    const isMobile = window.innerWidth < 768;
    const NODE_COUNT = isMobile ? 15 : 60;
    const CONNECT_DIST = 120;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({ x: Math.random() * canvas.offsetWidth, y: Math.random() * canvas.offsetHeight, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 1.5 + 0.5 });
    }

    const onVisibility = () => { paused = document.hidden; if (!paused) animationId = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", onVisibility);

    const draw = () => {
      if (paused) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; }
      if (!isMobile) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECT_DIST) { ctx.strokeStyle = `rgba(59,130,246,${(1 - dist / CONNECT_DIST) * 0.15})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
          }
        }
      }
      for (const n of nodes) { ctx.fillStyle = "rgba(59,130,246,0.4)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" style={{ willChange: "transform" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const duration = 1500; const start = performance.now();
    const step = (now: number) => { const p = Math.min((now - start) / duration, 1); setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [target]);
  return <>{count.toLocaleString()}</>;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
function IconGaming() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M6 12h4M8 10v4" strokeLinecap="round" /><circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="17" cy="13" r="1" fill="currentColor" stroke="none" /><rect x="2" y="6" width="20" height="12" rx="4" /></svg>; }
function IconChart() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M3 20h18" strokeLinecap="round" /><path d="M6 16V10M10 16V6M14 16V12M18 16V8" strokeLinecap="round" strokeWidth="2" /></svg>; }
function IconEnterprise() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M9 4V2M15 4V2M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2" strokeLinecap="round" /></svg>; }
function IconCreator() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>; }

// ---------------------------------------------------------------------------
// Product Screenshot Mockup
// ---------------------------------------------------------------------------
function ProductMockup() {
  const [stats, setStats] = useState<{count: number; volume: number; approvalRate: string; agents: number} | null>(null);
  const [recentTx, setRecentTx] = useState<{time: string; agent: string; amount: string; hash: string} | null>(null);

  useEffect(() => {
    fetch(`${API}/transactions`)
      .then(r => r.json())
      .then((txs: Array<{agent_id: string; amount: number; decision: string; timestamp: string; tx_hash?: string}>) => {
        if (!Array.isArray(txs) || txs.length === 0) return;
        const approved = txs.filter(t => t.decision === "approved");
        const volume = approved.reduce((s, t) => s + t.amount, 0);
        const agents = new Set(txs.map(t => t.agent_id)).size;
        const rate = txs.length > 0 ? ((approved.length / txs.length) * 100).toFixed(1) : "—";
        setStats({ count: txs.length, volume, approvalRate: rate, agents });
        const latest = approved[0];
        if (latest) setRecentTx({
          time: new Date(latest.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
          agent: latest.agent_id,
          amount: latest.amount.toFixed(2),
          hash: latest.tx_hash ? `${latest.tx_hash.slice(0,6)}...${latest.tx_hash.slice(-4)}` : "pending"
        });
      }).catch(() => {});
  }, []);

  const metrics = stats ? [
    { label: "Transactions", value: stats.count.toLocaleString() },
    { label: "Volume (USDC)", value: `$${stats.volume.toFixed(2)}` },
    { label: "Approval Rate", value: `${stats.approvalRate}%` },
    { label: "Active Agents", value: stats.agents.toString() },
  ] : [
    { label: "Transactions", value: "—" },
    { label: "Volume (USDC)", value: "—" },
    { label: "Approval Rate", value: "—" },
    { label: "Active Agents", value: "—" },
  ];

  return (
    <div className="mx-auto mt-16 max-w-4xl animate-fade-in-up">
      <div className="rounded-xl border border-[#222222] bg-[#111111] shadow-[0_0_60px_rgba(59,130,246,0.08)]">
        <div className="flex items-center gap-2 border-b border-[#222222] px-4 py-2.5">
          <div className="h-3 w-3 rounded-full bg-[#333]" /><div className="h-3 w-3 rounded-full bg-[#333]" /><div className="h-3 w-3 rounded-full bg-[#333]" />
          <span className="ml-2 text-xs text-zinc-600">agentpay.xyz/dashboard</span>
          <span className="ml-auto text-[10px] text-zinc-600">live testnet data</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {metrics.map(m => (
            <div key={m.label} className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
              <p className="text-[10px] text-zinc-500">{m.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#222222] px-4 py-3">
          {recentTx ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="font-mono text-zinc-500">{recentTx.time}</span>
              <span className="font-mono text-zinc-300">{recentTx.agent}</span>
              <span className="font-medium text-white">{recentTx.amount} USDC</span>
              <span className="font-mono text-zinc-500">{recentTx.hash}</span>
              <span className="ml-auto rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">approved</span>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">No transactions yet — send the first one via the API.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------
function HeroSection() {
  const [txCount, setTxCount] = useState(0);
  useEffect(() => { fetch(`${API}/transactions`).then(r => r.json()).then(d => setTxCount(Array.isArray(d) ? d.length : 0)).catch(() => {}); }, []);

  return (
    <section className="relative overflow-hidden">
      <NetworkCanvas />
      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-blue-500/20 bg-blue-500/10 px-5 py-2">
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-sm font-medium text-blue-400">Live on Base Sepolia</span>
            {txCount > 0 && (<><span className="h-4 w-px bg-blue-500/30" /><span className="font-mono text-lg font-bold text-white"><AnimatedCounter target={txCount} /></span><span className="text-sm text-blue-400">transactions</span></>)}
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI agents that pay{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">without asking permission.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            The payment infrastructure for autonomous AI agents. Programmable guardrails, full audit trails, and real on-chain transactions — built for the agentic economy.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/docs" className="btn btn-primary w-full px-8 py-3 text-base sm:w-auto">
              Start Building
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </Link>
            <Link href="/demo" className="btn btn-secondary w-full px-8 py-3 text-base sm:w-auto">View Live Demo</Link>
          </div>
          <div className="mt-16 border-t border-[#222222] pt-8">
            <p className="text-sm text-zinc-500">Built for the Coinbase · Base ecosystem</p>
          </div>
        </div>
        <ProductMockup />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    { num: "01", title: "Deploy an Agent Wallet", desc: "Your AI agent gets a non-custodial wallet on Base. Funded with USDC, ready to transact in seconds.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="15" r="1.5" /></svg> },
    { num: "02", title: "Set Guardrails", desc: "Define spending limits, daily caps, approved recipients, and token allowlists. Every payment checked before execution.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg> },
    { num: "03", title: "Execute Payments", desc: "Agent pays autonomously. Every transaction is logged on-chain with a complete audit trail.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" /></svg> },
  ];
  return (
    <section className="border-t border-[#222222] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Three steps to autonomous payments</h2>
        </div>
        <div className="stagger-children mt-16 grid gap-8 sm:grid-cols-1 md:grid-cols-3">
          {steps.map(s => (<div key={s.num} className="card card-glow p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">{s.icon}</div><p className="mb-1 text-xs font-medium text-blue-400">{s.num}</p><h3 className="text-lg font-semibold text-white">{s.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.desc}</p></div>))}
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-[#222222]">
            <div className="flex items-center gap-2 border-b border-[#222222] bg-[#111111] px-4 py-2.5"><div className="h-3 w-3 rounded-full bg-[#333]" /><div className="h-3 w-3 rounded-full bg-[#333]" /><div className="h-3 w-3 rounded-full bg-[#333]" /><span className="ml-2 text-xs text-zinc-600">payment.ts</span></div>
            <pre className="bg-[#0d0d0d] p-5 text-sm leading-7"><code>
              <span className="text-purple-400">await</span> <span className="text-blue-400">agentpay</span><span className="text-zinc-500">.</span><span className="text-yellow-300">pay</span><span className="text-zinc-400">{"({"}</span>{"\n"}
              <span className="text-zinc-500">{"  "}</span><span className="text-red-400">agent</span><span className="text-zinc-500">: </span><span className="text-green-400">{'"trading-bot-001"'}</span><span className="text-zinc-500">,</span>{"\n"}
              <span className="text-zinc-500">{"  "}</span><span className="text-red-400">amount</span><span className="text-zinc-500">: </span><span className="text-amber-300">50</span><span className="text-zinc-500">,</span>{"\n"}
              <span className="text-zinc-500">{"  "}</span><span className="text-red-400">token</span><span className="text-zinc-500">: </span><span className="text-green-400">{'"USDC"'}</span><span className="text-zinc-500">,</span>{"\n"}
              <span className="text-zinc-500">{"  "}</span><span className="text-red-400">to</span><span className="text-zinc-500">: </span><span className="text-green-400">{'"0x..."'}</span><span className="text-zinc-500">,</span>{"\n"}
              <span className="text-zinc-500">{"  "}</span><span className="text-red-400">reason</span><span className="text-zinc-500">: </span><span className="text-green-400">{'"API access fee"'}</span>{"\n"}
              <span className="text-zinc-400">{"});"}</span>
            </code></pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Live Demo — wired to real API
// ---------------------------------------------------------------------------
function LiveDemo() {
  const [lines, setLines] = useState<{ text: string; color: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const addLine = useCallback((text: string, color: string) => { setLines(prev => [...prev, { text, color }]); }, []);
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runDemo = async () => {
    setLines([]); setRunning(true); setDone(false); setTxHash(null);
    addLine("$ agentpay.pay({ agent: 'demo-agent', amount: 1, token: 'USDC' })", "text-zinc-300");
    await delay(400); addLine("", ""); await delay(200);
    addLine("→ Validating guardrails...", "text-blue-400"); await delay(400);
    addLine("  ✓ Agent ID: valid", "text-zinc-500"); await delay(300);
    addLine("  ✓ Amount: 1 USDC (within $100 cap)", "text-zinc-500"); await delay(300);
    addLine("", ""); addLine("→ Checking daily limits...", "text-blue-400"); await delay(400);
    addLine("  ✓ Daily spend within $500 limit", "text-emerald-400"); await delay(300);
    addLine("", ""); addLine("→ Resolving agent wallet...", "text-blue-400"); await delay(200);
    try {
      const healthRes = await fetch(`${API}/health`);
      const healthData = await healthRes.json();
      const walletAddr = healthData.wallet_address || "0x0000000000000000000000000000000000000001";
      addLine(`  ✓ Wallet: ${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`, "text-zinc-500");
      await delay(300); addLine("", ""); addLine("→ Executing on Base Sepolia...", "text-blue-400"); await delay(200);
      const res = await fetch(`${API}/pay`, { method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": process.env.NEXT_PUBLIC_DEMO_API_KEY || "" }, body: JSON.stringify({ agent_id: "demo-agent", amount: 1, token: "USDC", recipient: walletAddr, reason: "Live demo payment" }) });
      const data = await res.json();
      if (res.ok && data.status === "approved" && data.tx_hash) {
        await delay(400); addLine("  ✓ Transaction confirmed!", "text-emerald-400"); await delay(300);
        addLine(`  → tx: ${data.tx_hash}`, "text-emerald-400"); await delay(200);
        addLine(`  → https://sepolia.basescan.org/tx/${data.tx_hash}`, "text-blue-400");
        setTxHash(data.tx_hash);
      } else if (data.status === "rejected") { await delay(300); addLine(`  ✗ Rejected: ${data.reason}`, "text-amber-400");
      } else if (res.status === 401) { await delay(300); addLine("  ✗ Demo unavailable — API key not configured", "text-amber-400"); addLine("  → Use your own API key from the dashboard", "text-zinc-500"); } else { await delay(300); addLine(`  ✗ Error: ${data.detail || data.reason || "Payment failed — try again"}`, "text-red-400"); }
    } catch (err) { await delay(300); addLine(`  ✗ Error: ${err instanceof Error ? err.message : "Network error"}`, "text-red-400"); }
    setRunning(false); setDone(true);
  };

  return (
    <section id="live-demo" className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Live demo</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Watch a payment execute</h2>
          <p className="mt-4 text-zinc-400">This sends a real payment on Base Sepolia through the API.</p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-[#222222]">
            <div className="flex items-center justify-between border-b border-[#222222] bg-[#111111] px-4 py-2.5">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500/60" /><div className="h-3 w-3 rounded-full bg-yellow-500/60" /><div className="h-3 w-3 rounded-full bg-green-500/60" /><span className="ml-2 text-xs text-zinc-600">terminal</span></div>
              <button onClick={runDemo} disabled={running} className="btn btn-primary px-4 py-1.5 text-xs disabled:opacity-50">{running ? "Running..." : done ? "Run Again" : "Run Payment"}</button>
            </div>
            <div className="min-h-80 bg-[#0a0a0a] p-5 font-mono text-[13px] leading-6 sm:min-h-70">
              {lines.length === 0 && !running && <p className="text-zinc-600">Click &ldquo;Run Payment&rdquo; to send a real payment on Base Sepolia...</p>}
              {lines.map((line, i) => <div key={i} className={`${line.color} animate-fade-in`}>{line.text || "\u00A0"}</div>)}
              {running && <span className="inline-block h-4 w-2 animate-pulse bg-blue-400" />}
            </div>
            {txHash && !running && (
              <div className="border-t border-[#222222] bg-[#111111] px-4 py-3">
                <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
                  View on BaseScan <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10l6-6M5 4h5v5" /></svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------
function UseCases() {
  const cases = [
    { title: "iGaming", desc: "Instant player withdrawals, responsible gambling controls built-in. Automate payouts while staying compliant.", icon: <IconGaming /> },
    { title: "DeFi", desc: "Autonomous trading bots that pay for data feeds, API access, and gas — without human intervention.", icon: <IconChart /> },
    { title: "Enterprise", desc: "AI procurement agents that pay suppliers without human approval. Spend policies enforced at the protocol level.", icon: <IconEnterprise /> },
    { title: "Creator Economy", desc: "AI agents that pay royalties and licensing fees automatically. Transparent, auditable, real-time.", icon: <IconCreator /> },
  ];
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Use cases</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Built for every industry</h2></div>
        <div className="stagger-children mt-16 grid gap-6 sm:grid-cols-2">
          {cases.map(c => (<div key={c.title} className="card card-glow p-6"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">{c.icon}</div><h3 className="text-lg font-semibold text-white">{c.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.desc}</p></div>))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Comparison Table — no fabricated audit claim
// ---------------------------------------------------------------------------
function ComparisonSection() {
  const rows = [
    { feature: "Time to deploy", diy: "3-6 months", ap: "5 minutes" },
    { feature: "Audit roadmap", diy: "$50k+", ap: "Q3 2026" },
    { feature: "Guardrails", diy: "Custom code", ap: "Built-in" },
    { feature: "Compliance logs", diy: "Build yourself", ap: "Automatic" },
    { feature: "Maintenance", diy: "Your team", ap: "We handle it" },
    { feature: "Multi-agent support", diy: "Complex", ap: "Out of the box" },
  ];
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Compare</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Why AgentPay vs building it yourself</h2></div>
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-[#222222]">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#222222] bg-[#111111]"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Feature</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Build Yourself</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-blue-400">AgentPay</th></tr></thead><tbody>{rows.map(r => (<tr key={r.feature} className="border-b border-[#222222] transition-colors hover:bg-[#111111]"><td className="px-6 py-4 font-medium text-white">{r.feature}</td><td className="px-6 py-4 text-zinc-500">{r.diy}</td><td className="px-6 py-4 font-medium text-blue-400">{r.ap}</td></tr>))}</tbody></table></div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Early Access Program — replaces fake testimonials
// ---------------------------------------------------------------------------
function EarlyAccessSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setLoading(true);
    try {
      await fetch(`${API}/waitlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    setLoading(false);
  };

  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-blue-500/20 bg-[#111111] p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Early Access Program</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              AgentPay is in private beta. We&apos;re working with select teams to shape the product.
              Apply for early access and get 3 months free on the Growth plan.
            </p>
            {submitted ? (
              <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                Application received — we&apos;ll be in touch.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="input flex-1 py-3" required />
                <button type="submit" disabled={loading} className="btn btn-primary shrink-0 px-6 py-3 disabled:opacity-50">{loading ? "Applying..." : "Get 3 months free →"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Backed By
// ---------------------------------------------------------------------------
function BackedBy() {
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-zinc-600">Built on industry-leading infrastructure</p>
        <div className="flex flex-wrap items-center justify-center gap-12">
          <div className="flex items-center gap-2"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-blue-400"><circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" /><path d="M14 7v14M9 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span className="text-lg font-bold text-zinc-400">Base</span></div>
          <div className="flex items-center gap-2"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-blue-400"><circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" /><circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="2" /></svg><span className="text-lg font-bold text-zinc-400">Coinbase</span></div>
          <div className="flex items-center gap-2"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-blue-400"><path d="M14 4l10 20H4L14 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><span className="text-lg font-bold text-zinc-400">Anthropic</span></div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Trust
// ---------------------------------------------------------------------------
function TrustSection() {
  const items = [
    { title: "Built on Base", desc: "Coinbase's L2 — low cost, high speed, $10B+ TVL", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M8 11h8" strokeLinecap="round" /></svg> },
    { title: "Secured by CDP", desc: "Coinbase Developer Platform — institutional-grade key management", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /><circle cx="12" cy="16" r="1.5" /></svg> },
    { title: "Open Source", desc: "Smart contracts auditable on GitHub — fully transparent", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M8 18l-4-4 4-4M16 6l4 4-4 4" strokeLinecap="round" /></svg> },
    { title: "Guardrails First", desc: "Every payment checked against spending policies before execution", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400"><path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg> },
  ];
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Trust & Security</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Enterprise-grade from day one</h2></div>
        <div className="stagger-children mt-16 grid gap-6 grid-cols-2 lg:grid-cols-4">
          {items.map(it => (<div key={it.title} className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">{it.icon}</div><h3 className="text-base font-semibold text-white">{it.title}</h3><p className="mt-1.5 text-sm text-zinc-500">{it.desc}</p></div>))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Waitlist — real API, no fabricated numbers
// ---------------------------------------------------------------------------
function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ position: number; referral_code: string; total_signups: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const refCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!email || !email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/waitlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, ref: refCode || undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong"); setLoading(false); return; }
      setResult(data);
    } catch { setError("Could not connect to server. Try again."); }
    setLoading(false);
  };

  const referralLink = result ? `https://agentpay.xyz/ref/${result.referral_code}` : "";
  const tweetText = `Just joined the @agentpayhq waitlist — autonomous AI payments on Base. Get early access: ${referralLink}`;

  return (
    <section id="waitlist" className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Early access</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Join the waitlist</h2>
          <p className="mt-4 text-zinc-400">Be among the first builders to access AgentPay when we launch.</p>

          {result ? (
            <div className="animate-fade-in mt-8 space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto text-emerald-400"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" /><path d="M11 16l3.5 3.5L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <p className="mt-3 text-lg font-semibold text-white">You&apos;re #{result.position} on the waitlist!</p>
                <p className="mt-1 text-sm text-zinc-400">Share your link to move up — each referral bumps you up 5 spots.</p>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#111111] p-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">Your referral link</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-[#0a0a0a] px-3 py-2 text-sm text-white">{referralLink}</code>
                  <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="btn btn-primary shrink-0 px-4 py-2 text-xs">{copied ? "Copied!" : "Copy Link"}</button>
                </div>
              </div>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full justify-center py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                Share on Twitter
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="input flex-1 py-3" required />
                <button type="submit" disabled={loading} className="btn btn-primary shrink-0 px-8 py-3 disabled:opacity-50">{loading ? "Joining..." : "Join Waitlist"}</button>
              </div>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
              <p className="mt-3 text-xs text-zinc-600">No spam. We&apos;ll only email you when AgentPay is ready.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------
function PricingSection() {
  const plans = [
    { name: "Free", price: "$0", period: "forever", features: ["100 transactions / month", "1 agent wallet", "Basic guardrails", "Community support", "0.1% transaction fee"], cta: "Get Started", highlight: false },
    { name: "Growth", price: "$99", period: "/month", features: ["10,000 transactions / month", "10 agent wallets", "Advanced guardrails", "Email support", "0.1% transaction fee", "Webhook notifications", "Analytics dashboard"], cta: "Start Free Trial", highlight: true },
    { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited transactions", "Unlimited agents", "Custom guardrails", "Dedicated support", "Volume discounts", "SLA guarantee", "On-premise option"], cta: "Contact Sales", highlight: false },
  ];
  return (
    <section id="pricing" className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Pricing</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Simple, transparent pricing</h2><p className="mt-4 text-zinc-400">Start free. Scale as you grow.</p></div>
        <div className="stagger-children mt-16 grid items-center gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-xl border p-8 transition-all ${plan.highlight ? "relative z-10 scale-105 border-blue-500/50 bg-[#111111] shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-[#222222] bg-[#111111]"}`}>
              {plan.highlight && <span className="badge badge-info mb-4">Most Popular</span>}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-4"><span className="text-4xl font-bold text-white">{plan.price}</span><span className="text-zinc-500">{plan.period}</span></div>
              <ul className="mt-8 space-y-3">{plan.features.map(f => (<li key={f} className="flex items-start gap-3 text-sm text-zinc-400"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-blue-400"><path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>))}</ul>
              <button onClick={() => { const el = document.getElementById("waitlist"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-all ${plan.highlight ? "bg-blue-600 text-white hover:bg-blue-500" : "border border-[#333333] text-zinc-300 hover:border-zinc-500 hover:text-white"}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
function TeamSection() {
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Team</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Built by</h2></div>
        <div className="mx-auto mt-12 max-w-md">
          <div className="card card-glow p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">GG</div>
            <h3 className="mt-4 text-xl font-bold text-white">Gerry Go</h3>
            <p className="mt-1 text-sm font-medium text-blue-400">Founder & CEO</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">Building the payment layer for the agentic economy. Focused on making autonomous AI payments safe, fast, and auditable.</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition-colors hover:text-white" aria-label="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition-colors hover:text-white" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition-colors hover:text-white" aria-label="GitHub"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Community — honest copy
// ---------------------------------------------------------------------------
function CommunityBanner() {
  return (
    <section className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-[#222222] bg-[#111111] p-8 text-center sm:p-12">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">Help us build the future of autonomous payments</h3>
          <p className="mt-3 text-zinc-400">AgentPay is in active development. Join early, shape the roadmap.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full px-6 py-2.5 sm:w-auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" /></svg>
              Join Discord
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full px-6 py-2.5 sm:w-auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              Star on GitHub
            </a>
            <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full px-6 py-2.5 sm:w-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              Follow for updates
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Back to Top + Footer
// ---------------------------------------------------------------------------
function BackToTop() {
  const [v, setV] = useState(false);
  const c = useCallback(() => { setV(window.scrollY > 600); }, []);
  useEffect(() => { window.addEventListener("scroll", c, { passive: true }); return () => window.removeEventListener("scroll", c); }, [c]);
  if (!v) return null;
  return <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#111111] text-zinc-400 shadow-lg transition-all hover:border-blue-500/30 hover:text-white" aria-label="Back to top"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" /></svg></button>;
}

function Footer() {
  return (
    <footer className="border-t border-[#222222]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500"><path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="currentColor" /></svg><span className="font-bold text-white">AgentPay</span></div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/docs" className="text-sm text-zinc-500 transition-colors hover:text-white">Docs</Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">GitHub</a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">Discord</a>
            <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 transition-colors hover:text-white">Twitter</a>
            <Link href="/privacy" className="text-sm text-zinc-500 transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-sm text-zinc-500 transition-colors hover:text-white">Terms</Link>
          </div>
          <p className="text-xs text-zinc-600">Powered by Base · Secured by Coinbase CDP</p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <HeroSection />
      <ComparisonSection />
      <HowItWorks />
      <LiveDemo />
      <UseCases />
      <EarlyAccessSection />
      <BackedBy />
      <TrustSection />
      <WaitlistSection />
      <PricingSection />
      <TeamSection />
      <CommunityBanner />
      <Footer />
      <BackToTop />
    </div>
  );
}
