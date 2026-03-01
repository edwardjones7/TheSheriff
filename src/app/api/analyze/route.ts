import { NextRequest, NextResponse } from "next/server";
import {
  getWalletData,
  getMockWalletData,
  getSolBalance,
  buildRiskEvidence,
} from "@/lib/helius";
import { scoreRisk } from "@/lib/risk-scorer";
import { isValidSolanaAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

function getDeterministicDemoBalance(address: string): number {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  return Number(((seed % 300) / 10).toFixed(4));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, mode } = body as {
    address: string;
    mode: "analyze" | "recipient";
  };

  // Validate input
  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana wallet address" },
      { status: 400 }
    );
  }

  const resolvedMode = mode === "recipient" ? "recipient" : "analyze";

  if (!process.env.HELIUS_API_KEY) {
    const mockData = getMockWalletData(address);
    const result = scoreRisk(mockData, resolvedMode);
    const solBalance = getDeterministicDemoBalance(address);
    const riskEvidence = buildRiskEvidence(address, mockData);

    const demoFindings = [
      "⚠ Demo mode — connect a Helius API key for real on-chain data",
      ...result.findings,
    ];

    return NextResponse.json({
      ...result,
      solBalance,
      findings: demoFindings,
      riskEvidence,
    });
  }

  try {
    const [walletData, solBalance] = await Promise.all([
      getWalletData(address),
      getSolBalance(address),
    ]);
    const result = scoreRisk(walletData, resolvedMode);
    const riskEvidence = buildRiskEvidence(address, walletData);
    return NextResponse.json({ ...result, solBalance, riskEvidence });
  } catch (error) {
    console.error("Helius API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
