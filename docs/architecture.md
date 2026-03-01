# Architecture

This document is a high-level technical overview of how The Solana Sheriff is structured and how requests flow through the system.

## Tech stack

- **Next.js 14 (App Router)** for UI + server endpoints
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Google Gemini** (optional) for chat + AI-generated assessments
- **Helius** (optional) for Solana on-chain data
- **DexScreener** (token liquidity lookup)
- **ElevenLabs** (optional) for text-to-speech

## Repo layout (key paths)

- **UI pages**: `src/app/**/page.tsx`
  - `src/app/page.tsx` (home)
  - `src/app/chat/page.tsx` (AI assistant)
  - `src/app/analyze/page.tsx` (wallet analyzer)
  - `src/app/token/page.tsx` (token scan)
  - `src/app/resources/page.tsx` (education hub)
- **API routes**: `src/app/api/**/route.ts`
- **Core libs**: `src/lib/*`
  - `src/lib/helius.ts`: Solana data fetch + normalization + evidence building
  - `src/lib/risk-scorer.ts`: heuristic wallet risk scoring
  - `src/lib/gemini.ts`: prompts + wallet AI assessment helper
- **Shared types**: `src/types/index.ts`
- **UI components**: `src/components/*`

## End-to-end flows

### Flow 1: AI Safety Assistant (Chat)

The chat UI streams assistant output as plain text.

```mermaid
flowchart TD
  User[User] --> ChatPage[src_app_chat_page_tsx]
  ChatPage -->|POST /api/chat| ChatRoute[src_app_api_chat_route_ts]
  ChatRoute -->|If GEMINI_API_KEY missing: mock response| DemoChat[MockChatResponse]
  ChatRoute -->|If GEMINI_API_KEY present: stream| GeminiChat[GeminiChatStream]
  GeminiChat --> ChatPage
  DemoChat --> ChatPage
```

Key files:

- `src/app/chat/page.tsx` (streams `response.body` to render partial assistant text)
- `src/app/api/chat/route.ts` (Gemini streaming; demo-mode fallback)
- `src/lib/gemini.ts` (`SHERIFF_SYSTEM_PROMPT`, mock responses)

### Flow 2: Wallet Analyzer (Helius + heuristic + optional AI)

Wallet analysis returns a JSON payload including findings, advice, and (optionally) an AI assessment.

```mermaid
flowchart TD
  User[User] --> AnalyzePage[src_app_analyze_page_tsx]
  AnalyzePage -->|POST /api/analyze| AnalyzeRoute[src_app_api_analyze_route_ts]
  AnalyzeRoute -->|If HELIUS_API_KEY missing| DemoWallet[getMockWalletData]
  AnalyzeRoute -->|If HELIUS_API_KEY present| HeliusLib[getWalletData]
  DemoWallet --> RiskScorer[src_lib_risk_scorer_ts]
  HeliusLib --> RiskScorer
  AnalyzeRoute --> Evidence[src_lib_helius_buildRiskEvidence]
  AnalyzeRoute -->|If GEMINI_API_KEY present| GeminiAssess[src_lib_gemini_assessWalletRiskWithGemini]
  RiskScorer --> AnalyzeRoute
  Evidence --> AnalyzeRoute
  GeminiAssess --> AnalyzeRoute
  AnalyzeRoute --> AnalyzePage
```

Key files:

- `src/app/api/analyze/route.ts` (orchestration + demo mode)
- `src/lib/helius.ts` (`getWalletData`, `getSolBalance`, `buildRiskEvidence`, mocks)
- `src/lib/risk-scorer.ts` (`scoreRisk`)
- `src/lib/gemini.ts` (`assessWalletRiskWithGemini`)
- `src/types/index.ts` (`AnalysisResult`, `RiskEvidence`, `AiAssessment`)

### Flow 3: Scam Token Detector (Helius RPC + DexScreener + optional AI verdict)

Token scan is JSON; “Sheriff’s Verdict” is streamed as plain text.

```mermaid
flowchart TD
  User[User] --> TokenPage[src_app_token_page_tsx]
  TokenPage -->|POST /api/token| TokenRoute[src_app_api_token_route_ts]
  TokenRoute -->|If HELIUS_API_KEY missing| DemoToken[getMockTokenScan]
  TokenRoute -->|If HELIUS_API_KEY present| HeliusRpc[HeliusRPC_getAccountInfo_getTokenLargestAccounts_getAsset]
  TokenRoute --> DexScreener[DexScreenerLiquidity]
  HeliusRpc --> TokenRoute
  DexScreener --> TokenRoute
  TokenRoute --> TokenPage

  TokenPage -->|POST /api/token/verdict| VerdictRoute[src_app_api_token_verdict_route_ts]
  VerdictRoute -->|If GEMINI_API_KEY missing: mock verdict| DemoVerdict[getMockVerdict]
  VerdictRoute -->|If GEMINI_API_KEY present: stream| GeminiVerdict[GeminiGenerateContentStream]
  DemoVerdict --> TokenPage
  GeminiVerdict --> TokenPage
```

Key files:

- `src/app/api/token/route.ts` (scan + demo mode)
- `src/app/api/token/verdict/route.ts` (Gemini streaming verdict + demo mode)
- `src/types/index.ts` (`TokenScanResult`)

## See also

- [`docs/features.md`](features.md)
- [`docs/api.md`](api.md)
- [`docs/risk-engine.md`](risk-engine.md)
- [`docs/external-services.md`](external-services.md)
- [`docs/configuration.md`](configuration.md)

