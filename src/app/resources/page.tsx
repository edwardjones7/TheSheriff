"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Eye,
  Shield,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  q: string;
  a: string;
}

interface Section {
  icon: React.ElementType;
  title: string;
  color: string;
  items: AccordionItem[];
}

const sections: Section[] = [
  {
    icon: AlertOctagon,
    title: "Common Scams on Solana",
    color: "text-red-400",
    items: [
      {
        q: "Seed Phrase Theft",
        a: 'The #1 crypto scam. Someone — fake support, a "friend", or a website — asks for your 12 or 24-word seed phrase. This is ALWAYS a scam. Your seed phrase gives full control of your wallet to whoever has it. Never type it anywhere except your actual wallet app when restoring a wallet you own.',
      },
      {
        q: '"Send SOL to Get More SOL Back"',
        a: 'You see a message, tweet, or video saying "Send 1 SOL and get 2 SOL back." This is always a scam. No one sends free money. Celebrities and influencers shown in these videos have been impersonated without consent. The funds will disappear instantly.',
      },
      {
        q: "Fake Airdrops",
        a: "Random tokens appear in your wallet. When you try to sell or find out their value, the site asks you to 'verify' or 'approve' something. That action drains your entire wallet. The tokens themselves are bait — do not interact with them.",
      },
      {
        q: "Wallet Drainer Sites",
        a: "Fake NFT mints, fake DeFi apps, or fake giveaway sites ask you to connect your wallet and 'approve a transaction.' The transaction secretly grants permission to drain all your assets. These sites often look pixel-perfect — identical to real projects.",
      },
      {
        q: "Impersonation Scams",
        a: "Fake customer support accounts on Discord, Twitter, and Telegram pretend to be from Phantom, Solflare, Coinbase, or popular projects. They reach out first (a red flag itself) and ask for your seed phrase to 'fix' a problem. Real support never contacts you first and never needs your seed phrase.",
      },
      {
        q: "Rug Pulls",
        a: "A project launches with hype and community buzz, collects investment from buyers, then the developers abandon it and take all the funds. Signs: anonymous teams, no audited code, artificial urgency to buy before a deadline, locked roadmap with impossible promises.",
      },
    ],
  },
  {
    icon: Eye,
    title: "Red Flags to Watch For",
    color: "text-yellow-400",
    items: [
      {
        q: "Urgency and Pressure",
        a: '"Act now or you\'ll lose your funds!" "This offer expires in 10 minutes!" Scammers use urgency to stop you from thinking clearly. Legitimate services never pressure you into instant decisions. When you feel rushed, slow down — that feeling is a warning sign.',
      },
      {
        q: "Unsolicited Contact",
        a: "Someone DMs you out of nowhere with an opportunity, a warning about your wallet, or an exclusive offer. Legitimate platforms do not cold-contact users. Any unsolicited crypto message is suspicious by default — especially if it involves your wallet.",
      },
      {
        q: "Too Good to Be True",
        a: 'Guaranteed 200% returns, risk-free investment, celebrity-backed coins, secret strategies. If it sounds too good to be true, it is. In crypto especially: there are no guarantees. Anyone promising them is lying.',
      },
      {
        q: '"Only You Got This Offer"',
        a: "Scammers make you feel special to bypass your natural skepticism. Phrases like 'you were selected,' 'exclusive whitelist,' or 'limited to early supporters' are designed to trigger FOMO. Real opportunities don't need to single you out.",
      },
      {
        q: "Unknown Transaction Requests",
        a: "A site asks you to sign a transaction you don't understand. Your wallet shows a complex approval — maybe for a large token amount or unfamiliar program. Always reject anything you don't fully understand. If you're unsure, copy the details and ask the Sheriff before signing.",
      },
      {
        q: "Requests to Move to a 'Safer' Wallet",
        a: "Someone tells you your current wallet is compromised or at risk, and you need to move your funds to a new wallet they provide or help you set up. This is a setup. They create the 'new' wallet and already have the seed phrase — the moment you transfer, they drain it.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Wallet Best Practices",
    color: "text-green-400",
    items: [
      {
        q: "Guard Your Seed Phrase Like Cash",
        a: "Write it on paper, store it somewhere physically safe (not a photo, not a cloud document, not a note app). Never type it online, in any app, or give it to anyone. Not Phantom support, not a friend helping you, not this website. Ever.",
      },
      {
        q: "Use a Hardware Wallet for Large Amounts",
        a: "A hardware wallet (Ledger, Trezor) stores your private key offline — completely isolated from the internet. Even if your computer is fully compromised by malware, your hardware wallet keeps your funds safe because the key never leaves the device.",
      },
      {
        q: "Disconnect Your Wallet After Use",
        a: "In Phantom: Settings → Connected Apps → Disconnect sites you don't use. In Solflare: similar process under Settings. Limiting your connected apps reduces your attack surface — a disconnected wallet can't be targeted by a compromised site.",
      },
      {
        q: "Verify URLs Carefully Before Connecting",
        a: "Scammers register domains like 'phant0m.app', 'sol-flare.io', or 'raydium-swap.com'. Always check the exact URL character by character. Bookmark the real sites you use regularly. If you followed a link from anywhere, double-check before connecting.",
      },
      {
        q: "Keep a Separate 'Hot Wallet' for Experiments",
        a: "Create a second wallet with a different seed phrase specifically for interacting with new NFT mints, DeFi protocols, or unknown projects. Fund it with only what you're willing to lose. Keep the majority of your assets in a separate 'cold' wallet you rarely connect anywhere.",
      },
    ],
  },
  {
    icon: GraduationCap,
    title: "Beginner Guides",
    color: "text-amber-400",
    items: [
      {
        q: "What is a crypto wallet?",
        a: "A crypto wallet doesn't actually store your tokens — they live on the blockchain. Your wallet stores a private key, which is a cryptographic proof that you own certain funds. Think of it like a password that controls an account. Losing access (or sharing it) means losing your funds permanently.",
      },
      {
        q: "What is a seed phrase?",
        a: "A seed phrase (12 or 24 words) is a human-readable version of your private key. It can regenerate your entire wallet on any device. Anyone who has it has full access to all your funds from anywhere in the world. Write it on paper, keep it physically secure, and never enter it digitally.",
      },
      {
        q: "What are gas fees / transaction fees?",
        a: "Every transaction on Solana costs a tiny fee (usually less than $0.01) paid in SOL to compensate network validators. This is completely normal. However, if a website asks you to pay a large 'activation fee,' 'gas deposit,' or 'unlock fee' — that is a scam. Real transactions never require pre-payment to a third party.",
      },
      {
        q: "What does 'connecting your wallet' actually mean?",
        a: "Connecting your wallet to a website lets it see your public address and request transaction approvals from you. It does NOT automatically give the site access to your funds. However, it can present you with transaction requests — which is where the risk lies. Always read what you're approving and reject anything unfamiliar.",
      },
      {
        q: "What should I do if I think I've been scammed?",
        a: "1. Immediately create a brand-new wallet with a new seed phrase. 2. Move any remaining funds to the new wallet. 3. Do not use the old wallet again — assume it's permanently compromised. 4. Report the scam on the relevant platform (Discord, Twitter) and to authorities if the amount is significant. Unfortunately, blockchain transactions are irreversible — funds sent to scammers cannot be recovered.",
      },
    ],
  },
];

function AccordionSection({ section, delay }: { section: Section; delay: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Icon = section.icon;

  return (
    <div
      className="bg-stone-800/60 border border-stone-700 rounded-2xl overflow-hidden animate-fade-in-up hover:border-stone-600 transition-colors duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-700/50">
        <div className="bg-stone-700/50 rounded-xl p-2.5">
          <Icon className={cn("h-5 w-5", section.color)} />
        </div>
        <h2 className="text-lg font-bold text-stone-100">{section.title}</h2>
      </div>

      {/* Items */}
      <div>
        {section.items.map((item, i) => (
          <div
            key={i}
            className="border-b border-stone-700/50 last:border-0"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-800/50 transition-colors duration-150"
            >
              <span className="text-stone-200 font-medium text-sm pr-4">
                {item.q}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-stone-400 flex-shrink-0 transition-transform duration-250",
                  openIndex === i && "rotate-180"
                )}
              />
            </button>

            {/* Animated accordion content */}
            <div className={cn("accordion-content", openIndex === i && "open")}>
              <div className="accordion-inner">
                <div className="px-6 pb-5 pt-1">
                  <p className="text-stone-400 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <h1 className="text-4xl font-bold text-stone-100 mb-3">
            Crypto Safety Resource Hub
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-xl mx-auto">
            Plain-language guides on staying safe in the Solana ecosystem.
            Written for newcomers — no technical knowledge required.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((section, i) => (
            <AccordionSection key={section.title} section={section} delay={80 + i * 70} />
          ))}
        </div>

        {/* Bottom note */}
        <div
          className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <p className="text-amber-300 text-sm mb-2 font-semibold">
            Still unsure about something?
          </p>
          <p className="text-stone-400 text-sm mb-4">
            The Sheriff is available 24/7 to give you personalized advice about
            any suspicious situation.
          </p>
          <a
            href="/chat"
            className="inline-flex bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-all duration-200 text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 active:translate-y-0"
          >
            Ask the Sheriff
          </a>
        </div>
      </div>
    </div>
  );
}
