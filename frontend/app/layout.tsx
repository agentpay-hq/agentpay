import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentPay — The Payment Layer for Autonomous AI Agents",
    template: "%s | AgentPay",
  },
  description:
    "AI-native payment infrastructure on Base. Autonomous stablecoin payments with programmable guardrails, full audit trails, and enterprise-grade security.",
  openGraph: {
    title: "AgentPay — Autonomous AI Payment Infrastructure",
    description:
      "Let AI agents send, receive, and manage stablecoin payments autonomously on Base. Programmable guardrails, full audit trails, enterprise-grade security.",
    type: "website",
    siteName: "AgentPay",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentPay — The Payment Layer for Autonomous AI Agents",
    description:
      "AI-native payment infrastructure on Base. Autonomous stablecoin payments with programmable guardrails.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgentPay",
  applicationCategory: "FinanceApplication",
  description:
    "AI-native payment infrastructure for autonomous agents on Base blockchain. Programmable guardrails, audit trails, and enterprise-grade security.",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "100 transactions/month, 1 agent wallet",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "99",
      priceCurrency: "USD",
      description: "10,000 transactions/month, 10 agent wallets",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col page-transition">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
