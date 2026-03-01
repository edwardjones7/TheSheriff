import { NextRequest, NextResponse } from "next/server";
import { isValidSolanaAddress, shortenAddress } from "@/lib/utils";
import { TokenScanResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com";
const DEXSCREENER_URL = "https://api.dexscreener.com/latest/dex/tokens";

function getHeliusApiKey(): string {
  const key = process.env.HELIUS_API_KEY?.trim();
  if (!key) throw new Error("HELIUS_API_KEY not configured");
  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function heliusRpc(
  method: string,
  params: unknown,
  apiKey: string
): Promise<unknown> {
  const res = await fetch(`${HELIUS_RPC_URL}/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Helius RPC error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "RPC error");
  return data.result;
}

async function getDexScreenerLiquidity(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${DEXSCREENER_URL}/${mint}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.pairs) || data.pairs.length === 0) return null;

    const solPairs = data.pairs.filter(
      (p: Record<string, unknown>) => p.chainId === "solana"
    );
    if (solPairs.length === 0) return null;

    const maxLiq = Math.max(
      ...solPairs.map(
        (p: Record<string, unknown>) =>
          (isRecord(p.liquidity) && typeof p.liquidity.usd === "number"
            ? p.liquidity.usd
            : 0) as number
      )
    );
    return maxLiq > 0 ? maxLiq : null;
  } catch {
    return null;
  }
}

function buildResult(
  tokenName: string,
  tokenSymbol: string,
  totalSupply: string,
  mintAuthority: string | null,
  top1Percent: number | null,
  top10Percent: number | null,
  liquidity: number | null,
  demoPrefix?: string
): TokenScanResult {
  const riskFactors: string[] = [];
  if (demoPrefix) riskFactors.push(demoPrefix);

  let score = 5;

  const mintAuthorityActive = mintAuthority !== null;
  if (mintAuthorityActive) {
    riskFactors.push(
      `Mint authority is active (${shortenAddress(mintAuthority!)}) — creator can mint unlimited new tokens`
    );
    score += 20;
  }

  const liquidityRisk = liquidity === null || liquidity < 10_000;
  if (liquidity === null) {
    riskFactors.push(
      "No liquidity detected — token is not listed on any DEX or has been removed"
    );
    score += 40;
  } else if (liquidity < 1_000) {
    riskFactors.push(
      `Extremely low liquidity ($${liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}) — exit is nearly impossible`
    );
    score += 35;
  } else if (liquidity < 10_000) {
    riskFactors.push(
      `Low liquidity ($${liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}) — high slippage and elevated rug risk`
    );
    score += 25;
  }

  const holderRisk = top1Percent !== null && top1Percent > 20;
  if (top1Percent !== null && top1Percent > 50) {
    riskFactors.push(
      `Single wallet controls ${top1Percent.toFixed(1)}% of supply — extreme concentration, dump risk is severe`
    );
    score += 35;
  } else if (top1Percent !== null && top1Percent > 20) {
    riskFactors.push(
      `Single wallet holds ${top1Percent.toFixed(1)}% of supply — creator or insider whale can dump at any time`
    );
    score += 20;
  }

  if (top10Percent !== null && top10Percent > 80) {
    riskFactors.push(
      `Top 10 wallets collectively hold ${top10Percent.toFixed(1)}% of supply — distribution is highly centralised`
    );
    score += 15;
  }

  const clamped = Math.min(Math.max(score, 5), 95);
  const riskLevel: "low" | "medium" | "high" =
    clamped >= 60 ? "high" : clamped >= 30 ? "medium" : "low";

  if (riskFactors.length === 0 || (demoPrefix && riskFactors.length === 1)) {
    riskFactors.push("No major risk signals detected");
  }

  return {
    riskLevel,
    rugpullProbability: clamped,
    tokenName,
    tokenSymbol,
    totalSupply,
    liquidity: {
      usd: liquidity,
      isRisk: liquidityRisk,
      dexScreenerFound: liquidity !== null,
    },
    holderDistribution: {
      top1Percent: top1Percent !== null ? parseFloat(top1Percent.toFixed(2)) : null,
      top10Percent: top10Percent !== null ? parseFloat(top10Percent.toFixed(2)) : null,
      isRisk: holderRisk,
    },
    creatorRisk: {
      mintAuthorityActive,
      mintAuthority,
      isRisk: mintAuthorityActive,
    },
    riskFactors,
  };
}

function getMockTokenScan(address: string): TokenScanResult {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  const top1 = 5 + (seed % 50);
  const liquidity = (seed % 100) * 500;
  const mintActive = seed % 3 !== 0;

  return buildResult(
    "Demo Token",
    "DEMO",
    "1,000,000,000",
    mintActive ? address.slice(0, 44) : null,
    top1,
    Math.min(top1 * 2.5, 99),
    liquidity,
    "Demo mode — connect a Helius API key for real on-chain data"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address } = body as { address: string };

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Token mint address is required" },
      { status: 400 }
    );
  }

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address" },
      { status: 400 }
    );
  }

  if (!process.env.HELIUS_API_KEY) {
    return NextResponse.json(getMockTokenScan(address));
  }

  try {
    const apiKey = getHeliusApiKey();

    const [mintInfoRaw, largestAccountsRaw, liquidity] = await Promise.all([
      heliusRpc("getAccountInfo", [address, { encoding: "jsonParsed" }], apiKey),
      heliusRpc("getTokenLargestAccounts", [address], apiKey),
      getDexScreenerLiquidity(address),
    ]);

    // Validate mint account
    const mintValue = isRecord(mintInfoRaw) ? mintInfoRaw.value : null;
    const mintData = isRecord(mintValue) ? mintValue.data : null;
    const parsed = isRecord(mintData) ? mintData.parsed : null;
    const parsedInfo = isRecord(parsed) ? parsed : null;

    if (!parsedInfo || parsedInfo.type !== "mint") {
      return NextResponse.json(
        { error: "Address is not a token mint account" },
        { status: 400 }
      );
    }

    const info = isRecord(parsedInfo.info) ? parsedInfo.info : {};
    const mintAuthority =
      typeof info.mintAuthority === "string" ? info.mintAuthority : null;
    const supply = typeof info.supply === "string" ? info.supply : "0";
    const decimals = typeof info.decimals === "number" ? info.decimals : 0;

    const supplyNum = parseInt(supply, 10);
    const humanSupply = supplyNum / Math.pow(10, decimals);
    const totalSupplyStr = humanSupply.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

    // Largest accounts
    const accounts: Array<{ address: string; amount: string }> = Array.isArray(
      isRecord(largestAccountsRaw) ? largestAccountsRaw.value : null
    )
      ? (largestAccountsRaw as { value: Array<{ address: string; amount: string }> }).value
      : [];

    const top1Raw = accounts[0] ? parseInt(accounts[0].amount, 10) : 0;
    const top1Percent = supplyNum > 0 ? (top1Raw / supplyNum) * 100 : null;

    const top10Sum = accounts
      .slice(0, 10)
      .reduce((s, a) => s + parseInt(a.amount, 10), 0);
    const top10Percent = supplyNum > 0 ? (top10Sum / supplyNum) * 100 : null;

    // Token metadata (name/symbol)
    let tokenName = "Unknown Token";
    let tokenSymbol = address.slice(0, 4).toUpperCase();
    try {
      const asset = await heliusRpc("getAsset", { id: address }, apiKey);
      const meta =
        isRecord(asset) &&
        isRecord((asset as Record<string, unknown>).content) &&
        isRecord(
          (
            (asset as Record<string, unknown>).content as Record<
              string,
              unknown
            >
          ).metadata
        )
          ? (
              (
                (asset as Record<string, unknown>).content as Record<
                  string,
                  unknown
                >
              ).metadata as Record<string, unknown>
            )
          : null;
      if (meta && typeof meta.name === "string" && meta.name) tokenName = meta.name;
      if (meta && typeof meta.symbol === "string" && meta.symbol)
        tokenSymbol = meta.symbol;
    } catch {
      // metadata unavailable — use defaults
    }

    return NextResponse.json(
      buildResult(
        tokenName,
        tokenSymbol,
        totalSupplyStr,
        mintAuthority,
        top1Percent,
        top10Percent,
        liquidity
      )
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scan token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
