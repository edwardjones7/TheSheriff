"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import WalletInput from "@/components/WalletInput";
import { WalletBalanceResponse } from "@/types";
import { shortenAddress } from "@/lib/utils";

function formatSol(balance: number): string {
  return `${balance.toFixed(4)} SOL`;
}

export default function WalletPage() {
  const [address, setAddress] = useState("");
  const [searchedAddress, setSearchedAddress] = useState("");
  const [result, setResult] = useState<WalletBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const fetchWallet = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setNote("");
    setResult(null);

    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to fetch wallet info");
      }

      const payload = (await response.json()) as WalletBalanceResponse;
      setNote(payload.note ?? "");
      setSearchedAddress(trimmed);
      setResult(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch wallet balance"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              <Wallet className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-stone-100">Wallet Info</h1>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Enter a public Solana wallet to view its native SOL balance.
          </p>
        </div>

        <div className="bg-stone-800/60 border border-stone-700 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-stone-300 mb-3">
            Solana Wallet Address
          </label>
          <WalletInput
            value={address}
            onChange={setAddress}
            onSubmit={fetchWallet}
            isLoading={isLoading}
            buttonText="Fetch Wallet Balance"
            placeholder="Paste a public Solana wallet address..."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            Warning: {error}
          </div>
        )}

        {note && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
            {note}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">
                  Wallet
                </p>
                <p className="text-stone-200 text-sm font-mono">
                  {shortenAddress(searchedAddress)}
                </p>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">
                  SOL Balance
                </p>
                <p className="text-stone-200 text-sm">
                  {formatSol(result.solBalance)}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-stone-600 text-xs text-center mt-6">
          Wallet balance is sourced from Helius on-chain APIs and returned as
          read-only data.
        </p>
      </div>
    </div>
  );
}
