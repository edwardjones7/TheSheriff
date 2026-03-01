"use client";

import { useState } from "react";
import { Flame, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import WalletInput from "@/components/WalletInput";
import RiskBadge from "@/components/RiskBadge";
import { TokenScanResult } from "@/types";
import { shortenAddress } from "@/lib/utils";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface MetricRowProps {
  label: string;
  value: string;
  subvalue?: string;
  isRisk: boolean;
}

function MetricRow({ label, value, subvalue, isRisk }: MetricRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-stone-700/40 last:border-0">
      <span className="text-stone-400 text-sm">{label}</span>
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          {isRisk ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
          )}
          <span
            className={`text-sm font-medium ${
              isRisk ? "text-red-300" : "text-green-300"
            }`}
          >
            {value}
          </span>
        </div>
        {subvalue && (
          <p className="text-stone-500 text-xs mt-0.5">{subvalue}</p>
        )}
      </div>
    </div>
  );
}

const riskColors = {
  low: "border-green-500/20 bg-green-500/5",
  medium: "border-yellow-500/20 bg-yellow-500/5",
  high: "border-red-500/20 bg-red-500/5",
};

const probabilityBarColor = (p: number) => {
  if (p >= 60) return "bg-red-500";
  if (p >= 30) return "bg-yellow-500";
  return "bg-green-500";
};

export default function TokenPage() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TokenScanResult | null>(null);
  const [scannedAddress, setScannedAddress] = useState("");
  const [error, setError] = useState("");

  const scan = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan failed");
      }

      const data: TokenScanResult = await response.json();
      setResult(data);
      setScannedAddress(trimmed);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to scan token. Please check the address and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div
          className="mb-10 animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              <Flame className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-stone-100">
              Scam Token Detector
            </h1>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Paste any Solana token mint address to check for rug pull signals —
            liquidity depth, holder concentration, creator wallet control, and
            overall scam probability.
          </p>
        </div>

        {/* Input */}
        <div
          className="bg-stone-800/60 border border-stone-700 rounded-2xl p-6 mb-6 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <label className="block text-sm font-medium text-stone-300 mb-3">
            Token Mint Address
          </label>
          <WalletInput
            value={address}
            onChange={setAddress}
            onSubmit={scan}
            isLoading={isLoading}
            buttonText="Scan Token"
            placeholder="e.g. So11111111111111111111111111111111111111112"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in-up">
            &#9888; {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div
            className={`border rounded-2xl overflow-hidden animate-fade-in-up ${riskColors[result.riskLevel]}`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-700/50 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-100 mb-0.5">
                  Token Risk Assessment
                </h2>
                <p className="text-stone-300 text-sm font-semibold">
                  {result.tokenName}{" "}
                  <span className="text-stone-500 font-normal">
                    ({result.tokenSymbol})
                  </span>
                </p>
                <p className="text-stone-500 text-xs font-mono mt-1">
                  {shortenAddress(scannedAddress)}
                </p>
              </div>
              <RiskBadge level={result.riskLevel} size="lg" />
            </div>

            {/* Rugpull probability bar */}
            <div className="px-6 py-4 border-b border-stone-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Rugpull Probability
                </span>
                <span
                  className={`text-sm font-bold ${
                    result.rugpullProbability >= 60
                      ? "text-red-400"
                      : result.rugpullProbability >= 30
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {result.rugpullProbability}%
                </span>
              </div>
              <div className="h-2.5 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${probabilityBarColor(
                    result.rugpullProbability
                  )}`}
                  style={{ width: `${result.rugpullProbability}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="px-6 py-5 border-b border-stone-700/50">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Metrics
              </h3>
              <div className="divide-y divide-stone-700/40">
                <MetricRow
                  label="Liquidity"
                  value={
                    result.liquidity.usd !== null
                      ? formatUsd(result.liquidity.usd)
                      : "Not found"
                  }
                  subvalue={
                    result.liquidity.usd !== null
                      ? result.liquidity.usd < 10_000
                        ? "Below $10K threshold"
                        : "Above $10K threshold"
                      : "Not listed on any DEX"
                  }
                  isRisk={result.liquidity.isRisk}
                />
                <MetricRow
                  label="Top holder"
                  value={
                    result.holderDistribution.top1Percent !== null
                      ? `${result.holderDistribution.top1Percent.toFixed(1)}% of supply`
                      : "Unknown"
                  }
                  subvalue={
                    result.holderDistribution.top10Percent !== null
                      ? `Top 10 hold ${result.holderDistribution.top10Percent.toFixed(1)}%`
                      : undefined
                  }
                  isRisk={result.holderDistribution.isRisk}
                />
                <MetricRow
                  label="Mint authority"
                  value={
                    result.creatorRisk.mintAuthorityActive
                      ? "Active"
                      : "Revoked"
                  }
                  subvalue={
                    result.creatorRisk.mintAuthorityActive &&
                    result.creatorRisk.mintAuthority
                      ? shortenAddress(result.creatorRisk.mintAuthority)
                      : result.creatorRisk.mintAuthorityActive
                      ? undefined
                      : "Safe — creator cannot mint new tokens"
                  }
                  isRisk={result.creatorRisk.isRisk}
                />
                <MetricRow
                  label="Total supply"
                  value={result.totalSupply}
                  isRisk={false}
                />
              </div>
            </div>

            {/* Risk factors */}
            <div className="px-6 py-5">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Risk Factors
              </h3>
              <ul className="space-y-2.5">
                {result.riskFactors.map((factor, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-stone-300 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p
          className="text-stone-600 text-xs text-center mt-6 animate-fade-in"
          style={{ animationDelay: "160ms" }}
        >
          Data sourced from Helius on-chain data and DexScreener. Risk scores
          are heuristic-based — always conduct your own research.
        </p>
      </div>
    </div>
  );
}
