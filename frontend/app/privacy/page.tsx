import Link from "next/link";
import Navigation from "../components/Navigation";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">1. Overview</h2>
            <p>AgentPay (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a payment infrastructure platform for autonomous AI agents. This Privacy Policy explains how we collect, use, and protect information when you use our API and platform. AgentPay does not hold customer funds. All payment execution is performed through Coinbase Developer Platform (CDP) infrastructure.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">2. Information We Collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-white">Account information:</strong> Email address and organization name when you register.</li>
              <li><strong className="text-white">API usage data:</strong> Transaction logs, agent IDs, payment amounts, recipient addresses, and timestamps required for audit trails.</li>
              <li><strong className="text-white">Technical data:</strong> IP addresses, API request logs, and error reports used for security and reliability monitoring.</li>
              <li><strong className="text-white">Blockchain data:</strong> Transaction hashes and on-chain records that are inherently public on Base.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">3. How We Use Your Information</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Providing and operating the AgentPay platform</li>
              <li>Generating immutable audit trails for compliance purposes</li>
              <li>Detecting fraud and enforcing spending guardrails</li>
              <li>Communicating product updates and security notices</li>
              <li>Complying with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">4. Data Retention</h2>
            <p>Transaction logs are retained for a minimum of 7 years to comply with financial record-keeping requirements. API keys are stored as irreversible hashes — we cannot recover your raw key if lost. On-chain transaction data is permanent and public by nature of blockchain technology.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">5. Third-Party Services</h2>
            <p>AgentPay uses Coinbase Developer Platform for wallet infrastructure and key management. Payments are executed on Base (an Ethereum L2). By using AgentPay, you also agree to the applicable terms of these infrastructure providers. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">6. Security</h2>
            <p>API keys are stored as SHA-256 hashes. All API communication requires HTTPS. We implement rate limiting and anomaly detection on all payment endpoints. SOC 2 Type I assessment is in progress (target Q3 2026).</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">7. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@agentpay-hq.com" className="text-blue-400 hover:text-blue-300">privacy@agentpay-hq.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 border-t border-[#222222] pt-8">
          <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
