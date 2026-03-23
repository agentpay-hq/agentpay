import Link from "next/link";
import Navigation from "../components/Navigation";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">1. Acceptance</h2>
            <p>By accessing or using the AgentPay API and platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. AgentPay is currently in private beta — access is granted at our discretion.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">2. Nature of Service</h2>
            <p>AgentPay is a payment infrastructure API that facilitates stablecoin transactions on Base (an Ethereum Layer 2 network). <strong className="text-white">AgentPay does not hold, custody, or control customer funds.</strong> All wallet operations are executed through Coinbase Developer Platform. You are solely responsible for your agents&apos; payment activities and compliance with applicable laws.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">3. Permitted Use</h2>
            <p>You may use AgentPay to build autonomous payment workflows for legitimate business purposes. You may not use AgentPay for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Money laundering, fraud, or any illegal activity</li>
              <li>Circumventing sanctions or export controls</li>
              <li>Unauthorized access to third-party systems</li>
              <li>Any activity that violates applicable law in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">4. API Keys and Security</h2>
            <p>You are responsible for safeguarding your API keys. Do not share keys publicly or commit them to version control. Notify us immediately at <a href="mailto:security@agentpay.xyz" className="text-blue-400 hover:text-blue-300">security@agentpay.xyz</a> if you believe a key has been compromised. We reserve the right to revoke keys that show signs of abuse.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">5. Beta Service Disclaimer</h2>
            <p>The Service is provided &quot;as is&quot; during the beta period. We make no warranties of availability, accuracy, or fitness for a particular purpose. We are not liable for any losses arising from the use of the Service, including losses resulting from smart contract exploits, blockchain failures, or API downtime. Testnet use only is recommended until mainnet launch.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, AgentPay&apos;s total liability to you for any claims arising from these terms or the Service shall not exceed the amount you paid us in the three months preceding the claim. We are not liable for indirect, consequential, or punitive damages.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">7. Changes</h2>
            <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance. We will notify registered users of material changes by email.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">8. Contact</h2>
            <p>Questions about these terms: <a href="mailto:legal@agentpay.xyz" className="text-blue-400 hover:text-blue-300">legal@agentpay.xyz</a></p>
          </section>
        </div>

        <div className="mt-12 border-t border-[#222222] pt-8">
          <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
