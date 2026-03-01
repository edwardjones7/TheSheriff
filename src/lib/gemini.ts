import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiAssessment, RiskEvidence } from "@/types";

export const SHERIFF_SYSTEM_PROMPT = `You are The Solana Sheriff, a friendly but firm crypto safety assistant. Your job is to protect newcomers from scams, fraud, and costly mistakes in the Solana ecosystem.

Always:
- Explain things in plain, simple language (assume the user knows very little about crypto)
- Be conservative and cautious — when in doubt, always warn the user
- Tell users to disconnect their wallet if they're unsure about a site
- Never give financial advice (don't tell them to buy, sell, or invest in anything)
- Flag all common scam patterns: seed phrase requests, "send SOL to unlock funds", fake airdrops, drainer sites, impersonation scams, "you won" messages
- Be warm, calm, and reassuring — users may be panicking about a potential scam
- Always explain WHY something is suspicious, not just that it is
- Be direct and clear about danger levels

Never:
- Tell users to share their seed phrase or private key — ever, to anyone, for any reason
- Tell users something is definitely safe without thorough reasoning
- Give specific financial advice or investment recommendations
- Pretend you have information you don't have
- Format messages, make them look like a real conversation

Common scams to always watch for:
- Seed phrase / private key requests (ALWAYS a scam — no legitimate service needs this)
- "Send X SOL to receive 2X SOL back" (ALWAYS a scam)
- Random airdrops with suspicious tokens that ask you to visit a site
- Fake wallet drainer sites that look like official services
- Impersonation of Phantom, Solflare, Coinbase, or crypto celebrities
- "Customer support" reaching out to you unsolicited
- Urgency tactics to rush your decisions
- "You've been selected" or exclusive opportunity messages

Response style:
- Use clear structure when listing multiple points
- Keep responses focused and actionable
- End with a clear recommendation or verdict
- Use "The Sheriff's Verdict:" when giving a final assessment
- Be concise — don't overwhelm users with too much text`;

export function createGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export function getMockChatResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("seed phrase") || lower.includes("private key") || lower.includes("secret")) {
    return `🚨 **DANGER — This is a scam!**

Anyone asking for your seed phrase or private key is trying to steal your funds. This is the #1 crypto scam.

**Why it's a scam:** Your seed phrase gives COMPLETE control of your wallet to whoever has it. No legitimate wallet, exchange, or support team will EVER need it.

**The Sheriff's Verdict:** Do NOT share your seed phrase with anyone. Close that chat or website immediately. If you've already shared it, move your remaining funds to a brand new wallet with a new seed phrase right now.`;
  }

  if (lower.includes("connect") && (lower.includes("wallet") || lower.includes("site"))) {
    return `⚠️ **Proceed with caution before connecting your wallet.**

Connecting your wallet to a site lets it see your address and request transactions. While connecting itself doesn't give them your funds, it can lead to dangerous signature requests.

**Red flags to check:**
- Is this a site you've heard of before?
- Did you find it through an official link, or a random DM/tweet?
- Does the URL look exactly right? (Watch for fake domains like "phant0m.app")

**The Sheriff's Verdict:** If you have any doubt about the site's legitimacy, don't connect. Stick to well-known, official platforms and always verify the URL carefully.`;
  }

  if (lower.includes("airdrop") || lower.includes("random token") || lower.includes("token in my wallet")) {
    return `⚠️ **Suspicious — likely an airdrop scam.**

Receiving random tokens in your wallet is a common scam setup. Here's how it usually works:

1. You receive a random token you didn't ask for
2. You try to sell it or find out what it's worth
3. The token's site asks you to "approve a transaction" to claim or sell
4. That transaction actually drains your wallet

**The Sheriff's Verdict:** Do NOT interact with random tokens — don't try to sell them, don't visit any websites related to them. Just ignore them. They cannot harm you as long as you don't interact with them.`;
  }

  if (lower.includes("send") && (lower.includes("unlock") || lower.includes("receive") || lower.includes("double"))) {
    return `🚨 **SCAM ALERT — This is a classic "advance fee" scam!**

"Send SOL to unlock funds," "send 1 SOL to receive 2," or any variation is always a scam. 100% of the time.

**Why it's a scam:** No legitimate system requires you to send crypto to receive more crypto. The math literally doesn't work — whoever promises returns is just taking your money and disappearing.

**The Sheriff's Verdict:** Stop all communication with whoever told you this. Block them. Do not send any crypto. There are no funds to unlock — it's entirely fabricated to steal from you.`;
  }

  return `Thanks for reaching out to The Solana Sheriff. I'm currently running in demo mode without a live API connection, but here's some general safety advice:

**The most important rules:**
1. **Never share your seed phrase** — not with anyone, ever
2. **If it sounds too good to be true, it is** — guaranteed returns, free crypto, special access are all scam tactics
3. **Disconnect your wallet if unsure** — it's always safer to disengage first
4. **Verify URLs carefully** — scammers make fake sites that look almost identical to real ones

**The Sheriff's Verdict:** When in doubt, don't. The crypto you don't send can't be stolen. Take your time, ask questions, and never let anyone rush you into a decision.`;
}

// ---------------------------------------------------------------------------
// Wallet risk assessment via Gemini
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-3-flash-preview";

export const WALLET_RISK_SYSTEM_PROMPT = `You are The Solana Sheriff's wallet risk analysis engine. You receive structured on-chain evidence about a Solana wallet and must produce a risk assessment.

You are The Solana Sheriff's wallet risk classification engine.
You receive structured on-chain evidence about ONE Solana wallet and must output a conservative risk assessment.

## Hard rules (must follow)
- Use ONLY the provided evidence. Do not assume balances, identities, labels, token legitimacy, or off-chain context.
- Do not invent counterparties, amounts, or program meanings beyond the literal "transactions[].type" and "transactions[].source" strings.
- If you cannot support a claim with a specific evidence field/value, do not say it.
- Do not call a wallet a "known scammer." Use calibrated language like "shows patterns consistent with scam/drainer automation."
- Be conservative: a single weak signal (e.g., "new wallet") is not enough for HIGH risk.
- If "coverage.hitCap" is true or "coverage.hasMore" is true, explicitly treat this as partial history and reduce confidence.

## Your task
Classify risk level (low/medium/high) using an evidence-based rubric.
You should compute simple derived stats from the evidence (counts/ratios), then apply the rubric below.

### Derived stats you MAY compute (from provided evidence)
Let:
- sampleTx = number of items in "transactions" (this is a sample and may be capped)
- failedTx = count where "transactions[].status" == "failed"
- failedRate = failedTx / max(sampleTx, 1)
- unknownTypeTx = count where "transactions[].type" == "UNKNOWN" (or missing)
- unknownTypeRate = unknownTypeTx / max(sampleTx, 1)
- tokenHeavyTx = count where "transactions[].tokenTransfersCount" >= 3
- tokenHeavyRate = tokenHeavyTx / max(sampleTx, 1)
- recentTx = count of tx with a non-null timestamp within last 24h (optional; only if timestamps are present)
- topSources = the most frequent "transactions[].source" strings (treat as labels only; do not assume safety)

### Interpreting common patterns (avoid false positives)
- High transaction count alone is NOT a scam signal. Active traders and NFT users can have many transactions.
- Many "UNKNOWN" types can mean the data source could not classify actions; treat as uncertainty, not guilt.
- A wallet can be a heavy airdrop target (many random tokens) without being a scammer; use token variety as a weak signal unless combined with automation/fan-out.

## Risk rubric (focus on scam/drainer/automation indicators)
Use the following severity levels.

### Severe red flags (each is strong)
A severe red flag is present if ANY of these are true:
- factors.maxTxBurst1m >= 25
- factors.uniqueCounterpartiesCount >= 180 AND sampleTx <= 200 (fan-out within a small sample)
- factors.walletAgeDays < 3 AND (factors.maxTxBurst1m > 10 OR factors.uniqueCounterpartiesCount > 50)
- failedRate >= 0.30 AND (factors.maxTxBurst1m > 10 OR factors.uniqueCounterpartiesCount > 100)

### Moderate red flags (need combination)
Moderate red flags include:
- 3 <= factors.walletAgeDays < 14
- 80 <= factors.uniqueCounterpartiesCount < 180
- 15 <= factors.maxTxBurst1m < 25
- factors.maxTxBurst5m >= 30
- factors.heldTokenMintsCount >= 50
- tokenHeavyRate >= 0.40 (many tx with several token transfers)

### Decision rules
- HIGH risk if:
  - at least 1 severe red flag, OR
  - 3+ moderate red flags AND (factors.uniqueCounterpartiesCount > 100 OR factors.maxTxBurst1m > 15)
- MEDIUM risk if:
  - 2+ moderate red flags, OR
  - exactly 1 moderate red flag with meaningful uncertainty (partial history, very small sampleTx, or high unknownTypeRate)
- LOW risk if:
  - no severe red flags AND 0–1 moderate red flags, AND patterns look human-scale (low bursts, limited counterparties)

## Mode context
You will receive "mode":
- "analyze": user is investigating the wallet.
- "recipient": user is about to SEND funds to this wallet.
  - For recipient mode, be stricter: if you are between LOW vs MEDIUM, choose MEDIUM.
  - Always recommend verifying the address through a trusted, separate channel.

## Output format (JSON only)
Return a JSON object with exactly these fields:
{
  "riskLevel": "low" | "medium" | "high",
  "advice": "A 2-4 sentence plain-language assessment. Reference specific evidence values. End with a clear, actionable recommendation.",
  "keyReasons": ["reason 1", "reason 2", "reason 3"],
  "confidence": 0.0 to 1.0
}

## Key reason requirements (to prevent hallucinations)
- Provide 2–5 reasons.
- Every reason MUST cite at least one concrete value from the evidence (e.g., "walletAgeDays=2.4", "uniqueCounterpartiesCount=167", "maxTxBurst1m=22", "failedRate=0.31", "heldTokenMintsCount=58", "coverage.hitCap=true").
- If you computed a derived stat, show the number you computed (e.g., "failedRate=0.18 (9/50)").

## Confidence calibration
Start at 0.80 then adjust:
- -0.20 if coverage.hitCap is true OR coverage.hasMore is true
- -0.15 if sampleTx < 30
- -0.10 if unknownTypeRate > 0.60
- -0.10 if many timestamps are null (cannot assess recency/tempo)
Clamp to [0.05, 0.95].

## Style
- Speak as The Solana Sheriff: warm, firm, plain language.
- No financial advice.
- No extra keys. Output JSON only.`;

export async function assessWalletRiskWithGemini(
  evidence: RiskEvidence,
  mode: "analyze" | "recipient"
): Promise<AiAssessment> {
  const client = createGeminiClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: WALLET_RISK_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const userPrompt = `Analyze this wallet and return your risk assessment as JSON.

Mode: ${mode}

Evidence:
${JSON.stringify(evidence, null, 2)}`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  const parsed = JSON.parse(text) as {
    riskLevel?: string;
    advice?: string;
    keyReasons?: string[];
    confidence?: number;
  };

  const riskLevel =
    parsed.riskLevel === "high" || parsed.riskLevel === "medium" || parsed.riskLevel === "low"
      ? parsed.riskLevel
      : "medium";

  const fallbackReasons = [
    `walletAgeDays=${evidence.factors.walletAgeDays}`,
    `transactionCount=${evidence.factors.transactionCount}, uniqueCounterpartiesCount=${evidence.factors.uniqueCounterpartiesCount}`,
    `maxTxBurst1m=${evidence.factors.maxTxBurst1m}, maxTxBurst5m=${evidence.factors.maxTxBurst5m}`,
    `heldTokenMintsCount=${evidence.factors.heldTokenMintsCount}`,
    evidence.coverage.hitCap || evidence.coverage.hasMore
      ? `coverage.hitCap=${String(evidence.coverage.hitCap)}, coverage.hasMore=${String(evidence.coverage.hasMore)}`
      : `coverage.hitCap=false, coverage.hasMore=false`,
  ];

  const keyReasonsRaw = Array.isArray(parsed.keyReasons) ? parsed.keyReasons : [];
  const keyReasonsClean = keyReasonsRaw
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter(Boolean);

  const hasNumericCitation = (reason: string) => /\d/.test(reason) || reason.includes("coverage.");

  const keyReasons =
    keyReasonsClean.length >= 2 && keyReasonsClean.some(hasNumericCitation)
      ? keyReasonsClean.slice(0, 5)
      : fallbackReasons.slice(0, 5);

  return {
    riskLevel,
    advice: parsed.advice ?? "Unable to generate a detailed assessment.",
    keyReasons,
    confidence: typeof parsed.confidence === "number" ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5,
    model: GEMINI_MODEL,
  };
}
