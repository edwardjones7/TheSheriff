# Risk Engine

The wallet analysis feature has two layers:

1) **Heuristic scoring** (always available) in `src/lib/risk-scorer.ts`  
2) **Optional AI assessment** (only when `GEMINI_API_KEY` is set) using evidence built in `src/lib/helius.ts` and prompts in `src/lib/gemini.ts`

## Heuristic wallet scoring (`src/lib/risk-scorer.ts`)

The function `scoreRisk(data, mode)` takes a `WalletData` object (derived from on-chain history) and outputs an `AnalysisResult`:

- **Inputs (`WalletData`):** age (days), tx count, unique counterparties, inbound token variety, held token mint count, max bursts, and coverage metadata.
- **Outputs (`AnalysisResult`):** `riskLevel`, numeric `score`, human-readable `findings[]`, and contextual `advice`.

### What the heuristic factors mean

The heuristics focus on patterns commonly seen in automated drainers/scammers, while attempting to avoid false positives:

- **Wallet age**: very new wallets can be suspicious in some contexts.
- **Transaction count**: extremely high volume can indicate automation (but volume alone isn’t proof).
- **Unique counterparties**: interacting with very many wallets is treated as a stronger drainer/scammer indicator.
- **Burstiness**: many transactions in a short window suggests scripted behavior.
- **Token variety**: holding or receiving many distinct tokens can correlate with spam/airdrop patterns.
- **Coverage warning**: if history hit a cap, findings include a note that analysis is based on a partial sample.

### Risk levels

The heuristic score is mapped to a `riskLevel`:

- **Low**: score < 3  
- **Medium**: 3 ≤ score < 6  
- **High**: score ≥ 6

`mode` influences advice wording:

- `"analyze"`: user is investigating a wallet
- `"recipient"`: user is about to send funds (advice is stricter)

## Evidence building for AI (`src/lib/helius.ts`)

AI assessment is driven by a **bounded evidence object** (`RiskEvidence`) built from the wallet’s on-chain data.

### Why evidence exists

Instead of sending raw transactions to the model, the app constructs a smaller, structured payload:

- reduces token/latency cost
- standardizes what the model may use
- makes it easier to enforce “no hallucination” constraints in prompts

### Evidence contents

`buildRiskEvidence(address, data)` returns:

- `inputs`: address + analysis timestamp
- `factors`: derived summary stats (age, tx count, unique counterparties, bursts, held token mint count)
- `holdings`: fungible token holdings derived from `getAssetsByOwner`
- `transactions`: a normalized sample of transactions (capped)
- `coverage`: metadata that indicates whether history was capped or partial

Important caps/limits:

- Fetch cap: up to **2000 transactions** in `fetchAllEnhancedTransactions` (`TX_FETCH_CAP = 2000`)
- Evidence tx cap: **200 transactions** included in AI evidence (`EVIDENCE_TX_CAP = 200`)

If `coverage.hitCap` or `coverage.hasMore` is true, the history is partial and the AI prompt instructs the model to lower confidence.

## AI wallet assessment (`src/lib/gemini.ts`)

When `GEMINI_API_KEY` is configured, `assessWalletRiskWithGemini(evidence, mode)` attempts to attach an `AiAssessment`:

- `riskLevel: "low" | "medium" | "high"`
- `advice: string` (2–4 sentences, plain language, evidence-based)
- `keyReasons: string[]` (2–5 reasons; must cite concrete evidence values)
- `confidence: number` (0–1), adjusted down for partial coverage and small samples
- `model: string` (`gemini-3-flash-preview`)

### Hallucination controls

The system prompt (`WALLET_RISK_SYSTEM_PROMPT`) is designed to reduce invented claims by requiring:

- **Evidence-only reasoning**
- **Numeric citations** in `keyReasons` (e.g., `maxTxBurst1m=22`, `coverage.hitCap=true`)
- JSON-only output with a fixed schema

### Failure modes

If Gemini errors (network, invalid JSON, etc.), the server still returns heuristic results and includes `aiError` in the `/api/analyze` response.

## See also

- [`docs/api.md`](api.md)
- [`docs/architecture.md`](architecture.md)
- [`docs/external-services.md`](external-services.md)
- [`docs/configuration.md`](configuration.md)

