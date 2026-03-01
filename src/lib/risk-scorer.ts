import { WalletData, AnalysisResult } from "@/types";

interface ScoringFinding {
  text: string;
  points: number;
}

export function scoreRisk(
  data: WalletData,
  mode: "analyze" | "recipient"
): AnalysisResult {
  let score = 0;
  const scoredFindings: ScoringFinding[] = [];

  // --- Factor 1: Wallet age ---
  if (data.age < 7) {
    score += 2;
    scoredFindings.push({
      text: `Very new wallet — created only ${Math.round(data.age)} day(s) ago`,
      points: 2,
    });
  } else if (data.age < 30) {
    score += 1;
    scoredFindings.push({
      text: `Relatively new wallet — ${Math.round(data.age)} days old`,
      points: 1,
    });
  } else {
    scoredFindings.push({
      text: `Established wallet — ${Math.round(data.age)} days old`,
      points: 0,
    });
  }

  // --- Factor 2: Transaction count (low = sus, 10-100 = normal, 1000+ = scam likely) ---
  if (data.transactionCount < 10) {
    score += 1;
    scoredFindings.push({
      text: `Very few transactions (${data.transactionCount}) — suspiciously low activity`,
      points: 1,
    });
  } else if (data.transactionCount <= 100) {
    scoredFindings.push({
      text: `Normal transaction volume (${data.transactionCount} transactions)`,
      points: 0,
    });
  } else if (data.transactionCount <= 1000) {
    scoredFindings.push({
      text: `Active wallet with ${data.transactionCount} transactions`,
      points: 0,
    });
  } else {
    score += 2;
    scoredFindings.push({
      text: `Extremely high transaction volume (${data.transactionCount}) — possible bot or scam activity`,
      points: 2,
    });
  }

  // --- Factor 3: Unique counterparties (both inbound + outbound) ---
  if (data.uniqueCounterparties > 200) {
    score += 3;
    scoredFindings.push({
      text: `Interacted with ${data.uniqueCounterparties} unique wallets — strong drainer/scammer pattern`,
      points: 3,
    });
  } else if (data.uniqueCounterparties > 100) {
    score += 2;
    scoredFindings.push({
      text: `Interacted with ${data.uniqueCounterparties} unique wallets — unusual breadth of activity`,
      points: 2,
    });
  } else if (data.uniqueCounterparties > 50) {
    score += 1;
    scoredFindings.push({
      text: `Interacted with ${data.uniqueCounterparties} unique wallets — somewhat high`,
      points: 1,
    });
  }

  // --- Factor 4: Transaction burst (time-window batching) ---
  if (data.maxTxBurst1m > 20) {
    score += 3;
    scoredFindings.push({
      text: `Extreme burst: ${data.maxTxBurst1m} transactions within 1 minute — automated/bot behavior`,
      points: 3,
    });
  } else if (data.maxTxBurst1m > 10) {
    score += 2;
    scoredFindings.push({
      text: `High burst: ${data.maxTxBurst1m} transactions within 1 minute — likely scripted activity`,
      points: 2,
    });
  } else if (data.maxTxBurst5m > 20) {
    score += 1;
    scoredFindings.push({
      text: `Elevated burst: ${data.maxTxBurst5m} transactions within 5 minutes`,
      points: 1,
    });
  }

  // --- Factor 5: Risky programs (deferred) ---

  // --- Factor 6: Token variety (distinct held mints) ---
  if (data.heldTokenMintsCount > 50) {
    score += 2;
    scoredFindings.push({
      text: `Holds ${data.heldTokenMintsCount} different tokens — unusually large variety, often seen in scam distributors`,
      points: 2,
    });
  } else if (data.heldTokenMintsCount > 20) {
    score += 1;
    scoredFindings.push({
      text: `Holds ${data.heldTokenMintsCount} different tokens — above-average variety`,
      points: 1,
    });
  }

  // --- Supplementary: Inbound unknown tokens (airdrop scam pattern) ---
  if (data.inboundTokenCount > 30) {
    score += 2;
    scoredFindings.push({
      text: `Received ${data.inboundTokenCount} different token types — heavy airdrop target or distributor`,
      points: 2,
    });
  } else if (data.inboundTokenCount > 10) {
    score += 1;
    scoredFindings.push({
      text: `Received ${data.inboundTokenCount} different token types — possible airdrop activity`,
      points: 1,
    });
  }

  // --- Coverage caveat ---
  if (data.coverage.hitCap) {
    scoredFindings.push({
      text: `Analysis based on the most recent ${data.coverage.transactionsFetched} transactions — full history was too large to fetch`,
      points: 0,
    });
  }

  // --- Determine risk level ---
  let riskLevel: "low" | "medium" | "high";
  if (score >= 6) {
    riskLevel = "high";
  } else if (score >= 3) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  // --- Generate findings list (most significant first) ---
  const findings = scoredFindings
    .sort((a, b) => b.points - a.points)
    .map((f) => f.text);

  if (findings.length === 0) {
    findings.push("No significant risk indicators detected");
  }

  // --- Generate contextual advice ---
  let advice: string;

  if (mode === "recipient") {
    if (riskLevel === "high") {
      advice =
        "Do NOT send funds to this wallet. Multiple high-risk indicators suggest this could be a scammer or drainer. Verify the recipient through a different channel before proceeding.";
    } else if (riskLevel === "medium") {
      advice =
        "Proceed with caution. Some suspicious patterns detected — verify you know this recipient personally and start with a small test amount if you must send.";
    } else {
      advice =
        "This wallet appears to have normal activity patterns. Still, always confirm the recipient's address through a trusted channel before sending large amounts.";
    }
  } else {
    if (riskLevel === "high") {
      advice =
        "This wallet shows multiple high-risk indicators. Avoid interacting with it, sending funds to it, or clicking any links it has promoted.";
    } else if (riskLevel === "medium") {
      advice =
        "This wallet shows some suspicious patterns. Exercise caution and avoid sending significant funds until you have verified the owner's identity.";
    } else {
      advice =
        "This wallet appears to have normal, healthy activity patterns. No major red flags detected, but always stay vigilant in crypto.";
    }
  }

  return { riskLevel, score, findings, advice };
}
