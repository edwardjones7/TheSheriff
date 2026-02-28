"use client";

import { useState } from "react";
import { Users, ChevronRight, ArrowRight } from "lucide-react";
import WalletInput from "@/components/WalletInput";
import RiskBadge from "@/components/RiskBadge";
import { AnalysisResult } from "@/types";
import { shortenAddress } from "@/lib/utils";

export default function CheckPage() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checkedAddress, setCheckedAddress] = useState("");
  const [error, setError] = useState("");

  const check = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed, mode: "recipient" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Check failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setCheckedAddress(trimmed);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check wallet. Please verify the address and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const riskColors = {
    low: "border-green-500/20 bg-green-500/5",
    medium: "border-yellow-500/20 bg-yellow-500/5",
    high: "border-red-500/20 bg-red-500/5",
  };

  const riskSummary = {
    low: "This wallet appears safe to send to",
    medium: "Proceed with caution before sending",
    high: "Do NOT send funds to this wallet",
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-stone-100">
              Recipient Safety Check
            </h1>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Before you send SOL or tokens to someone, paste their wallet address
            below. We&apos;ll check for red flags so you can send with
            confidence — or know when to stop.
          </p>
        </div>

        {/* Visual flow */}
        <div
          className="flex items-center justify-center gap-3 mb-8 text-sm animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 transition-colors duration-200 hover:border-stone-600">
            Your wallet
          </div>
          <ArrowRight className="h-4 w-4 text-stone-600" />
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-400 font-medium">
            Sheriff checks
          </div>
          <ArrowRight className="h-4 w-4 text-stone-600" />
          <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 transition-colors duration-200 hover:border-stone-600">
            Recipient wallet
          </div>
        </div>

        {/* Input */}
        <div
          className="bg-stone-800/60 border border-stone-700 rounded-2xl p-6 mb-6 animate-fade-in-up"
          style={{ animationDelay: "140ms" }}
        >
          <label className="block text-sm font-medium text-stone-300 mb-3">
            Recipient&apos;s Wallet Address
          </label>
          <WalletInput
            value={address}
            onChange={setAddress}
            onSubmit={check}
            isLoading={isLoading}
            buttonText="Check Recipient"
            placeholder="Paste the recipient's Solana wallet address..."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in-up">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div
            className={`border rounded-2xl overflow-hidden animate-fade-in-up ${riskColors[result.riskLevel]}`}
          >
            {/* Result header */}
            <div className="px-6 py-5 border-b border-stone-700/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-stone-400 text-sm mb-1">
                    Recipient wallet
                  </p>
                  <p className="text-stone-200 font-mono text-xs">
                    {shortenAddress(checkedAddress)}
                  </p>
                </div>
                <RiskBadge level={result.riskLevel} size="lg" />
              </div>

              {/* Summary verdict */}
              <div
                className={`mt-4 text-base font-semibold ${
                  result.riskLevel === "low"
                    ? "text-green-400"
                    : result.riskLevel === "medium"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {riskSummary[result.riskLevel]}
              </div>
            </div>

            {/* Findings */}
            <div className="px-6 py-5 border-b border-stone-700/50">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                What we found
              </h3>
              <ul className="space-y-2.5">
                {result.findings.map((finding, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-stone-300 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            {/* Advice */}
            <div className="px-6 py-5">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Before you send
              </h3>
              <p className="text-stone-200 text-sm leading-relaxed">
                {result.advice}
              </p>
            </div>
          </div>
        )}

        {/* Info note */}
        <p className="text-stone-600 text-xs text-center mt-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          This check uses on-chain data to flag risk signals. It does not
          guarantee safety — always verify the recipient through a trusted
          channel.
        </p>
      </div>
    </div>
  );
}
