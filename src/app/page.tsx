import Link from "next/link";
import {
  ShieldCheck,
  MessageCircle,
  Search,
  Users,
  BookOpen,
  AlertTriangle,
  Star,
} from "lucide-react";

const features = [
  {
    href: "/chat",
    icon: MessageCircle,
    title: "AI Safety Assistant",
    description:
      "Ask the Sheriff anything about a suspicious message, site, or offer. Get plain-language advice instantly — no crypto jargon.",
    cta: "Ask the Sheriff →",
  },
  {
    href: "/analyze",
    icon: Search,
    title: "Wallet Risk Analyzer",
    description:
      "Paste any Solana wallet address and we'll analyze its transaction history for scammer patterns, drainer behavior, and risk signals.",
    cta: "Analyze a Wallet →",
  },
  {
    href: "/check",
    icon: Users,
    title: "Recipient Safety Check",
    description:
      "Before you send SOL or tokens to someone, check whether their wallet looks safe. Avoid accidentally sending funds to scammers.",
    cta: "Check a Recipient →",
  },
  {
    href: "/resources",
    icon: BookOpen,
    title: "Safety Resource Hub",
    description:
      "Learn about the most common crypto scams, red flags to watch for, and best practices to keep your wallet secure.",
    cta: "Browse Resources →",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-800 to-stone-900 border-b border-stone-700/50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 text-center relative">
          {/* Badge icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
              <div className="relative bg-stone-800 border border-amber-500/30 rounded-full p-6">
                <ShieldCheck
                  className="h-16 w-16 text-amber-400"
                  strokeWidth={1.5}
                />
              </div>
              {/* Star decorations */}
              <Star
                className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 fill-amber-400"
                strokeWidth={1}
              />
              <Star
                className="absolute -bottom-1 -left-3 h-4 w-4 text-amber-500 fill-amber-500"
                strokeWidth={1}
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-100 mb-4 tracking-tight">
            The{" "}
            <span className="text-amber-400">Solana Sheriff</span>
          </h1>
          <p className="text-xl text-stone-300 mb-3 max-w-2xl mx-auto leading-relaxed">
            Protecting crypto newcomers from scams, fraud, and costly mistakes.
          </p>
          <p className="text-stone-500 mb-10 text-lg">
            Your trusted AI-powered deputy in the Wild West of Crypto.
          </p>

          {/* CTAs */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/check"
              className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-8 py-3.5 rounded-xl transition-colors text-lg shadow-lg shadow-amber-500/20"
            >
              Check a Wallet
            </Link>
            <Link
              href="/chat"
              className="border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 font-bold px-8 py-3.5 rounded-xl transition-colors text-lg"
            >
              Ask the Sheriff
            </Link>
          </div>
        </div>
      </section>

      {/* Warning banner */}
      <div className="bg-red-950/40 border-b border-red-500/20 py-3 px-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-center gap-2.5 text-center">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            <strong>Golden Rule:</strong> Never share your seed phrase with
            anyone — not support, not friends, not this site. Ever.
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-stone-100 mb-3">
              How the Sheriff protects you
            </h2>
            <p className="text-stone-400 text-lg">
              Four tools designed for crypto newcomers — no technical knowledge
              required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group bg-stone-800/60 border border-stone-700 hover:border-amber-500/40 rounded-2xl p-6 transition-all duration-200 hover:bg-stone-800 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                      <Icon className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-100 mb-2 group-hover:text-amber-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-stone-400 text-sm leading-relaxed mb-3">
                        {feature.description}
                      </p>
                      <span className="text-amber-500 text-sm font-medium group-hover:text-amber-400">
                        {feature.cta}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 border-t border-stone-700/50 bg-stone-800/30">
        <div className="container mx-auto max-w-2xl text-center">
          <ShieldCheck className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-100 mb-3">
            Unsure about something? Ask the Sheriff.
          </h2>
          <p className="text-stone-400 mb-6">
            If something feels off — a DM, a website, a request — trust your
            gut and get a second opinion before doing anything.
          </p>
          <Link
            href="/chat"
            className="inline-flex bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Start a conversation
          </Link>
        </div>
      </section>
    </div>
  );
}
