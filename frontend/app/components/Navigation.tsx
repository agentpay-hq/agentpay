"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function LightningBolt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-500">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#pricing", label: "Pricing" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#222222] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <LightningBolt />
          <span className="text-lg font-bold tracking-tight text-white">AgentPay</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === link.href ? "text-white bg-[#1a1a1a]" : "text-zinc-400 hover:text-white hover:bg-[#111111]"}`}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/get-started" className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98] sm:block">
            Get API Key
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#111111] hover:text-white md:hidden" aria-label="Toggle menu">
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h14M3 10h14M3 14h14" /></svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-[#222222] bg-[#0a0a0a] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname === link.href ? "text-white bg-[#1a1a1a]" : "text-zinc-400 hover:text-white"}`}>
                {link.label}
              </Link>
            ))}
            <Link href="/get-started" onClick={() => setMobileOpen(false)} className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white">
              Get API Key
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
