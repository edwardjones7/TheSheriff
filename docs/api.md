# API Reference (Next.js Route Handlers)

All server endpoints live under `src/app/api/**/route.ts`.

## Common notes

- Many responses are **streamed** (plain text) for better UX in chat/verdict.
- Several routes support **demo mode** when API keys are missing. See [`docs/configuration.md`](configuration.md).
- Request/response shapes are defined in `src/types/index.ts` where applicable.

## `POST /api/chat`

**Purpose:** AI Safety Assistant chat (streamed plain text).

**Handler:** `src/app/api/chat/route.ts`

**Request (JSON):**

- Body: `{ messages: Message[] }`
- `Message` type: `src/types/index.ts` (`{ role: "user" | "assistant"; content: string }`)

**Response:**

- Success: `200` with `Content-Type: text/plain; charset=utf-8`
- Body: streamed assistant text

**Demo mode:**

- If `GEMINI_API_KEY` is missing, returns a canned response from `getMockChatResponse` (still `text/plain`).

## `POST /api/analyze`

**Purpose:** Wallet Analyzer (JSON result, with optional AI assessment).

**Handler:** `src/app/api/analyze/route.ts`

**Request (JSON):**

- Body:
  - `address: string` (required)
  - `mode: "analyze" | "recipient"` (optional; defaults to `"analyze"` server-side)

**Response (JSON):** `AnalysisResult` + extra fields

- Base heuristic result: `AnalysisResult` from `src/types/index.ts`:
  - `riskLevel: "low" | "medium" | "high"`
  - `score: number`
  - `findings: string[]`
  - `advice: string`
  - Optional: `ai?: AiAssessment`, `aiError?: string`, `solBalance?: number`, `riskEvidence?: RiskEvidence`

**Demo mode:**

- If `HELIUS_API_KEY` is missing, the route uses `getMockWalletData()` and a deterministic “demo” SOL balance. The response includes a “Demo mode…” finding.

**Optional AI behavior:**

- If `GEMINI_API_KEY` is present, the route will attempt to attach an `ai` object computed from `riskEvidence`.
- If Gemini fails, it returns heuristic analysis and includes `aiError`.

## `POST /api/token`

**Purpose:** Scam Token Detector scan (JSON).

**Handler:** `src/app/api/token/route.ts`

**Request (JSON):**

- Body: `{ address: string }` (token mint address)

**Response (JSON):** `TokenScanResult` (see `src/types/index.ts`)

Includes:

- `riskLevel: "low" | "medium" | "high"`
- `rugpullProbability: number` (0–100)
- Liquidity summary (via DexScreener)
- Holder concentration (top 1 / top 10 from Helius RPC)
- Mint authority status (active vs revoked)
- `riskFactors: string[]` (human-readable explanations)

**Demo mode:**

- If `HELIUS_API_KEY` is missing, returns a deterministic mock scan (no external calls).

## `POST /api/token/verdict`

**Purpose:** “Sheriff’s Verdict” for a token scan (streamed plain text).

**Handler:** `src/app/api/token/verdict/route.ts`

**Request (JSON):**

- Body: `{ result: TokenScanResult }`

**Response:**

- Success: `200` with `Content-Type: text/plain; charset=utf-8`
- Body: streamed 3–5 sentence verdict

**Demo mode:**

- If `GEMINI_API_KEY` is missing, returns a local mock verdict (still `text/plain`).

## `POST /api/tts`

**Purpose:** Text-to-speech for assistant messages (returns audio).

**Handler:** `src/app/api/tts/route.ts`

**Request (JSON):**

- Body: `{ text: string }`

**Response:**

- Success: `200` with `Content-Type: audio/mpeg`
- Failure:
  - `503` JSON if `ELEVENLABS_API_KEY` is not configured
  - `500` JSON on other server errors

**Notes:**

- Server strips markdown-ish formatting and truncates to 2500 characters before sending to ElevenLabs.

## `POST /api/wallet`

**Purpose:** Wallet balance lookup helper (JSON).

**Handler:** `src/app/api/wallet/route.ts`

**Request (JSON):**

- Body: `{ address: string }`

**Response (JSON):**

- Success: `{ address: string; solBalance: number; note?: string }`

**Demo mode:**

- If `HELIUS_API_KEY` is missing, returns deterministic demo balance with `note`.

## See also

- [`docs/architecture.md`](architecture.md)
- [`docs/features.md`](features.md)
- [`docs/risk-engine.md`](risk-engine.md)
- [`docs/configuration.md`](configuration.md)

