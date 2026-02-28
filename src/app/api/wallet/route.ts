import { NextRequest, NextResponse } from "next/server";
import { getSolBalance } from "@/lib/helius";
import { isValidSolanaAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

interface WalletRequestBody {
  address: string;
}

function getDeterministicDemoBalance(address: string): number {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  return Number(((seed % 300) / 10).toFixed(4));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as WalletRequestBody;
  const address = body.address?.trim();

  if (!address) {
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

  if (!process.env.HELIUS_API_KEY) {
    return NextResponse.json({
      address,
      solBalance: getDeterministicDemoBalance(address),
      note: "Demo mode — connect a Helius API key for real on-chain data",
    });
  }

  try {
    const solBalance = await getSolBalance(address);
    return NextResponse.json({ address, solBalance });
  } catch (error) {
    console.error("Helius wallet API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
