"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";


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
          <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
            <g transform="translate(3,3)">
              <path d="M19 0 L35 6 L35 22 C35 32 27 38 19 40 C11 38 3 32 3 22 L3 6 Z" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round"/>
              <circle cx="19" cy="21" r="3.5" fill="#2563eb"/>
              <line x1="11" y1="13" x2="16" y2="18" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="27" y1="13" x2="22" y2="18" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="19" y1="24.5" x2="19" y2="30" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="11" cy="12" r="2" fill="#2563eb" opacity="0.5"/>
              <circle cx="27" cy="12" r="2" fill="#2563eb" opacity="0.5"/>
              <circle cx="19" cy="31" r="2" fill="#2563eb" opacity="0.5"/>
            </g>
            <text x="48" y="29" fontFamily="-apple-system,BlinkMacSystemFont,Inter,sans-serif" fontSize="22" fontWeight="500" fill="white" letterSpacing="-0.3">Agent<tspan fill="#2563eb" fontWeight="600">Pay</tspan></text>
          </svg>
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
