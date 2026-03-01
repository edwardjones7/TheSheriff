import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TokenScanResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOKEN_VERDICT_PROMPT = `You are The Solana Sheriff — a straight-talking crypto safety expert who helps newcomers avoid scams. You have just received the results of a token risk scan. Your job is to give a plain-English verdict that a complete beginner can understand.

Rules:
- Write 3-5 natural flowing sentences. No bullet points, no headers, no markdown.
- Don't just repeat the numbers — explain what they mean practically for someone thinking about buying.
- Be direct about danger. If it looks like a rug, say so clearly.
- End with a single clear action: avoid, proceed with caution, or looks okay.
- Sound like a trusted friend who knows crypto, not a robot reading a report.`;

function buildPrompt(result: TokenScanResult): string {
  const liq =
    result.liquidity.usd !== null
      ? `$${result.liquidity.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : "none detected on any DEX";

  const mintStatus = result.creatorRisk.mintAuthorityActive
    ? "still active — the creator can print unlimited new tokens at any time"
    : "revoked — the creator can no longer mint new tokens";

  const top1 =
    result.holderDistribution.top1Percent !== null
      ? `${result.holderDistribution.top1Percent.toFixed(1)}%`
      : "unknown";

  const top10 =
    result.holderDistribution.top10Percent !== null
      ? `${result.holderDistribution.top10Percent.toFixed(1)}%`
      : "unknown";

  const factors = result.riskFactors
    .filter((f) => !f.includes("Demo mode"))
    .join("; ");

  return `TOKEN SCAN RESULTS:
Name: ${result.tokenName} (${result.tokenSymbol})
Overall risk level: ${result.riskLevel.toUpperCase()}
Rugpull probability score: ${result.rugpullProbability}%
Liquidity: ${liq}
Largest single holder: ${top1} of total supply
Top 10 holders combined: ${top10} of total supply
Mint authority: ${mintStatus}
Risk signals found: ${factors || "none"}

Give your Sheriff's Verdict on this token.`;
}

function getMockVerdict(result: TokenScanResult): string {
  const { riskLevel, tokenSymbol, rugpullProbability } = result;

  if (riskLevel === "high") {
    return `This ${tokenSymbol} token is raising serious red flags. With a ${rugpullProbability}% rugpull probability and the risk signals we found, this has the hallmarks of a token built to take your money and disappear. Low liquidity means you could find yourself stuck holding worthless tokens the moment insiders decide to sell, and an active mint authority means the creator can flood the supply at any time. My verdict: stay well away from this one — it's not worth the risk.`;
  }

  if (riskLevel === "medium") {
    return `${tokenSymbol} is showing some warning signs that are worth taking seriously before you put any money in. A ${rugpullProbability}% rugpull probability means this isn't the worst token we've seen, but there's enough risk here to warrant real caution. If you're still interested, only risk an amount you'd be comfortable losing entirely, watch the liquidity closely, and be ready to exit quickly. Do your own research before touching this.`;
  }

  return `${tokenSymbol} looks relatively clean based on the on-chain data we can see. The ${rugpullProbability}% rugpull probability is on the lower end, which is a decent sign, and there are no major red flags jumping out. That said, no scan catches everything — always do your own research, never invest more than you can afford to lose, and keep an eye on any sudden changes in liquidity or large wallet movements. Proceed with the usual caution you'd apply to any new token.`;
}

export async function POST(req: NextRequest) {
  const { result } = (await req.json()) as { result: TokenScanResult };

  if (!result) {
    return new Response(JSON.stringify({ error: "No scan result provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    const mock = getMockVerdict(result);
    return new Response(mock, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: TOKEN_VERDICT_PROMPT,
    });

    const streamResult = await model.generateContentStream(buildPrompt(result));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Gemini verdict error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate verdict";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
