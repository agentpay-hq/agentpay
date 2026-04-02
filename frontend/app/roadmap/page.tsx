import Link from "next/link";
import Navigation from "../components/Navigation";

export const metadata = {
  title: "Mainnet Roadmap — AgentPay",
  description: "AgentPay's path from Base Sepolia testnet to mainnet production. What's live, what's blocking mainnet, and our target timeline.",
};

const PHASES = [
  {
    phase: "Phase 1",
    label: "Testnet Live",
    status: "complete",
    date: "Q1 2026",
    items: [
      "Per-agent isolated wallets on Base Sepolia",
      "USDC payments via Coinbase CDP",
      "Configurable spend guardrails (max_per_tx, daily_limit, allowlists)",
      "Agent-to-agent payment routing (resolve agent ID → wallet address)",
      "Webhooks with 3-attempt retry on payment.approved",
      "Full audit log with reason tracking",
      "Self-serve onboarding and dashboard",
      "LangChain integration (AgentPayTool)",
      "Idempotency keys, Sentry monitoring, daily DB backups",
    ],
  },
  {
    phase: "Phase 2",
    label: "Pre-Mainnet",
    status: "active",
    date: "Q2 2026",
    items: [
      "Smart contract audit — SpendPolicy.sol, VelocityGuard.sol (~$50K gate)",
      "Delaware C-Corp formation via Stripe Atlas",
      "Auth system: Clerk + Privy + custom API keys",
      "OpenZeppelin Defender integration for on-chain policy monitoring",
      "Multi-token support (USDT, DAI)",
      "Rate limiting and abuse prevention hardening",
      "Penetration testing",
    ],
  },
  {
    phase: "Phase 3",
    label: "Mainnet Launch",
    status: "upcoming",
    date: "Q3 2026",
    items: [
      "Base mainnet deployment with audited contracts",
      "Transaction fee model: 0.05–0.15% per payment",
      "Enterprise policy seats for AI companies",
      "Multi-chain expansion (Ethereum L1, Arbitrum)",
      "SOC 2 Type I compliance",
      "Partner integrations: LangChain, AutoGPT, CrewAI",
    ],
  },
];

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-green-500/10 text-green-400 border border-green-500/20",
  active: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  upcoming: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

const STATUS_LABELS: Record<string, string> = {
  complete: "✓ Complete",
  active: "In Progress",
  upcoming: "Upcoming",
};

const DOT_STYLES: Record<string, string> = {
  complete: "bg-green-500",
  active: "bg-blue-500 ring-4 ring-blue-500/20",
  upcoming: "bg-zinc-600",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6">
            Testnet Live · Mainnet Target: Q3 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Path to Mainnet
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            AgentPay is live on Base Sepolia. This page explains what&apos;s
            working today, what&apos;s blocking production deployment, and our
            timeline to mainnet.
          </p>
        </div>
      </section>

      {/* Why testnet-only right now */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-4">Why testnet-only right now?</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            The core infrastructure — wallets, payments, guardrails, webhooks,
            agent-to-agent routing — is fully functional on Base Sepolia. The
            single gate to mainnet is a{" "}
            <strong className="text-white">smart contract security audit</strong>.
          </p>
          <p className="text-zinc-400 leading-relaxed mb-4">
            AgentPay&apos;s on-chain policy engine (SpendPolicy.sol,
            VelocityGuard.sol) enforces per-agent spend limits directly on-chain.
            Deploying unaudited contracts to mainnet with real USDC would be
            irresponsible. We won&apos;t do it.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Audit cost: approximately{" "}
            <strong className="text-white">$50K</strong>. This is the primary
            use of pre-seed capital.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center">Roadmap</h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

            <div className="space-y-12">
              {PHASES.map((phase) => (
                <div key={phase.phase} className="relative pl-16">
                  {/* Dot */}
                  <div
                    className={`absolute left-4 top-1 w-4 h-4 rounded-full -translate-x-1/2 ${DOT_STYLES[phase.status]}`}
                  />

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-zinc-500">
                      {phase.phase}
                    </span>
                    <h3 className="text-xl font-semibold">{phase.label}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[phase.status]}`}
                    >
                      {STATUS_LABELS[phase.status]}
                    </span>
                    <span className="text-xs text-zinc-500 ml-auto">
                      {phase.date}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            phase.status === "complete"
                              ? "bg-green-500"
                              : phase.status === "active"
                              ? "bg-blue-500"
                              : "bg-zinc-600"
                          }`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Base */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Base?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Coinbase L2",
                desc: "Native USDC, institutional backing, and alignment with Coinbase Ventures as a target investor.",
              },
              {
                title: "~$0.001 per tx",
                desc: "Transaction fees low enough that our 0.05–0.15% fee model is economically viable at any scale.",
              },
              {
                title: "~2s block time",
                desc: "Fast enough for real-time agent decisions. No 30-second waits between an agent's action and confirmation.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            Building agents that need to move money?
          </h2>
          <p className="text-zinc-400 mb-8">
            Get testnet access today. Production contracts ship after the audit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/get-started"
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-100 transition-colors"
            >
              Get API Access
            </Link>
            <a
              href="https://agentpay-api-production.up.railway.app/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              View API Docs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
