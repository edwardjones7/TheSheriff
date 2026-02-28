"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/chat", label: "Ask Sheriff" },
  { href: "/analyze", label: "Analyze Wallet" },
  { href: "/resources", label: "Resources" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-700/50 bg-stone-900/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-amber-400 text-lg hover:text-amber-300 transition-colors duration-200 group"
          >
            <ShieldCheck
              className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12"
              strokeWidth={2}
            />
            <span className="hidden sm:block">The Solana Sheriff</span>
            <span className="sm:hidden">Sheriff</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    active
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-amber-400 rounded-full animate-fade-in" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
