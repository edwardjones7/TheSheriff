import Link from "next/link";
import {
  ShieldCheck,
  MessageCircle,
  Search,
  BookOpen,
  AlertTriangle,
  Star,
  ArrowRight,
  Cpu,
  Lock,
  UserX,
} from "lucide-react";

const tools = [
  {
    number: "01",
    href: "/chat",
    icon: MessageCircle,
    title: "AI Safety Assistant",
    description:
      "Ask the Sheriff anything about a suspicious message, site, or offer. Get plain-language advice instantly — no crypto jargon.",
    cta: "Ask the Sheriff",
  },
  {
    number: "02",
    href: "/analyze",
    icon: Search,
    title: "Wallet Analyzer",
    description:
      "Paste any Solana wallet address and get an instant risk assessment — whether you're checking a wallet you interacted with or a recipient before you send funds.",
    cta: "Analyze a Wallet",
  },
  {
    number: "03",
    href: "/resources",
    icon: BookOpen,
    title: "Safety Resource Hub",
    description:
      "Learn about the most common crypto scams, red flags to watch for, and best practices to keep your wallet secure.",
    cta: "Browse Resources",
  },
];


const trustSignals = [
  { icon: Cpu, text: "AI-Powered Analysis" },
  { icon: ShieldCheck, text: "Solana Native" },
  { icon: Lock, text: "No Wallet Connection" },
  { icon: UserX, text: "No Sign-up Needed" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-stone-950 border-b border-stone-700/50">
        {/* Top-edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
        {/* Dot grid */}
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        {/* Central amber radial glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,rgba(245,158,11,0.11),transparent_70%)]" />
        {/* Ambient corner blobs */}
        <div className="absolute -top-32 -right-16 w-[480px] h-[480px] bg-amber-500/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] bg-amber-600/5 rounded-full blur-[90px] pointer-events-none" />
        {/* Edge vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(12,10,9,0.65)_100%)]" />

        <div className="container mx-auto px-4 pt-14 pb-24 text-center relative">

          {/* Pill badge */}
          <div
            className="flex justify-center mb-6 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-medium px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              AI-Powered Crypto Safety for Solana
            </span>
          </div>

          {/* Badge icon */}
          <div
            className="flex justify-center mb-8 animate-fade-in-up"
            style={{ animationDelay: "60ms" }}
          >
            <div className="relative animate-pulse-glow rounded-full">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
              <div className="relative bg-stone-900 border border-amber-500/30 rounded-full p-6 transition-transform duration-300 hover:scale-105">
                <ShieldCheck className="h-16 w-16 text-amber-400" strokeWidth={1.5} />
              </div>
              <Star className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 fill-amber-400" strokeWidth={1} />
              <Star className="absolute -bottom-1 -left-3 h-4 w-4 text-amber-500 fill-amber-500" strokeWidth={1} />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-7xl font-bold text-stone-100 mb-4 tracking-tight animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            The <span className="text-amber-400">Solana Sheriff</span>
          </h1>
          <p
            className="text-xl text-stone-300 mb-2 max-w-xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Protecting crypto newcomers from scams, fraud, and costly mistakes.
          </p>
          <p
            className="text-stone-500 mb-10 text-base animate-fade-in-up"
            style={{ animationDelay: "250ms" }}
          >
            Your AI-powered deputy in the Wild West of Crypto.
          </p>

          {/* CTAs */}
          <div
            className="flex gap-4 justify-center flex-wrap animate-fade-in-up"
            style={{ animationDelay: "320ms" }}
          >
            <Link
              href="/analyze"
              className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              Analyze a Wallet
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/chat"
              className="border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Ask the Sheriff
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Trust signals strip ── */}
      <div className="border-b border-stone-800 bg-stone-950 py-4 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustSignals.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-stone-400 text-sm">
                <Icon className="h-4 w-4 text-amber-500/70 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Tools section ── */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* Section header */}
          <div
            className="text-center mb-14 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">
              The Toolkit
            </p>
            <h2 className="text-4xl font-bold text-stone-100 mb-4">
              Three tools. Zero jargon.
            </h2>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">
              Everything a crypto newcomer needs to stay safe — built for real people, not developers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-7 transition-all duration-300 hover:bg-stone-800/60 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {/* Top-edge accent */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-amber-500/0 group-hover:bg-amber-500/50 transition-all duration-300" />

                  {/* Icon */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 inline-flex mb-5 group-hover:bg-amber-500/20 transition-colors duration-200">
                    <Icon className="h-6 w-6 text-amber-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-stone-100 mb-2 group-hover:text-amber-400 transition-colors duration-200">
                    {tool.title}
                  </h3>
                  <p className="text-stone-400 text-sm leading-relaxed mb-5">
                    {tool.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-1.5 text-amber-500 text-sm font-semibold group-hover:text-amber-400 transition-colors duration-200">
                    {tool.cta}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom CTA ── */}
      <section className="relative overflow-hidden border-t border-stone-700/50 bg-stone-950 py-28 px-4">
        {/* Dot grid */}
        <div className="hero-grid absolute inset-0 pointer-events-none opacity-60" />
        {/* Central glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(245,158,11,0.09),transparent_70%)]" />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(12,10,9,0.7)_100%)]" />

        <div className="container mx-auto max-w-2xl text-center relative">
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
            <div className="relative bg-stone-900 border border-amber-500/30 rounded-full p-4">
              <ShieldCheck className="h-8 w-8 text-amber-400" strokeWidth={1.5} />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-stone-100 mb-4 tracking-tight">
            Something feel off?
            <br />
            <span className="text-amber-400">Ask the Sheriff.</span>
          </h2>
          <p className="text-stone-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            If a DM, a website, or a request makes you hesitate — trust that instinct and get a second opinion before you do anything.
          </p>
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-10 py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Start a conversation
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </section>

      {/* ── Golden Rule banner ── */}
      <div className="bg-red-950/40 border-t border-red-500/20 py-3 px-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-center gap-2.5 text-center">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            <strong>Golden Rule:</strong> Never share your seed phrase with anyone — not support, not friends, not this site. Ever.
          </p>
        </div>
      </div>

    </div>
  );
}
