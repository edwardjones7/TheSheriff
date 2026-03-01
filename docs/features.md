# Features

This document describes the app’s main user-facing features and where each one is implemented.

## 1) AI Safety Assistant (Chat)

**What users do:** describe a suspicious situation (DM, website, airdrop, “send SOL first”, etc.) and get plain-language guidance.

**How it works:**

- UI collects a conversation history and sends it to `POST /api/chat`.
- Server streams the assistant response back as **plain text**.
- If `GEMINI_API_KEY` is not configured, the server returns a deterministic **demo-mode** response from `getMockChatResponse`.

**Key files:**

- Chat UI: `src/app/chat/page.tsx`
- Chat API route: `src/app/api/chat/route.ts`
- System prompt + demo responses: `src/lib/gemini.ts`

**Voice features:**

- **STT (speech-to-text)**: browser SpeechRecognition (`window.SpeechRecognition` / `webkitSpeechRecognition`) in `src/app/chat/page.tsx`.
- **TTS (text-to-speech)**: “Read aloud” button calls `POST /api/tts` and plays returned `audio/mpeg`.

## 2) Wallet Analyzer

**What users do:** paste a Solana wallet address to get a risk level and explanation.

**How it works:**

- UI calls `POST /api/analyze` with `{ address, mode: "analyze" }`.
- Server fetches wallet transactions + assets via Helius (or uses mock data in demo mode).
- Heuristic score is computed via `src/lib/risk-scorer.ts`.
- A compact “evidence” object is built for AI via `buildRiskEvidence` (used for optional AI).
- If `GEMINI_API_KEY` is configured, server attaches an `ai` assessment (JSON) alongside the heuristic findings.

**Key files:**

- Wallet Analyzer UI: `src/app/analyze/page.tsx`
- Wallet analysis API route: `src/app/api/analyze/route.ts`
- Helius integration + evidence: `src/lib/helius.ts`
- Heuristic scoring: `src/lib/risk-scorer.ts`
- Optional AI assessment: `src/lib/gemini.ts`

## 3) Scam Token Detector (Rugpull Detector)

**What users do:** paste a token mint address to scan for rugpull signals and get an overall probability score.

**How it works:**

- UI calls `POST /api/token` with `{ address }`.
- Server uses:
  - Helius RPC calls (`getAccountInfo`, `getTokenLargestAccounts`, plus `getAsset` for metadata when available)
  - DexScreener liquidity lookup for the mint address
- Server returns a `TokenScanResult`.
- UI then calls `POST /api/token/verdict` to stream the Sheriff’s “plain-English verdict” (Gemini or demo-mode).

**Key files:**

- Token UI: `src/app/token/page.tsx`
- Token scan API route: `src/app/api/token/route.ts`
- Token verdict route: `src/app/api/token/verdict/route.ts`
- Token scan types: `src/types/index.ts`

## 4) Safety Resource Hub

**What users do:** read guides on common scams, red flags, wallet safety best practices, and beginner definitions.

**How it works:**

- Static content rendered client-side in an accordion UI.

**Key file:**

- `src/app/resources/page.tsx`

## Notes / current gaps worth knowing

- **Recipient mode exists server-side but isn’t wired in UI**: `src/app/api/analyze/route.ts` supports `mode: "recipient"` (stricter advice), but `src/app/analyze/page.tsx` always sends `mode: "analyze"`.
- **Footer includes a `/check` link that doesn’t exist**: `src/components/Footer.tsx` links to `/check`, but there is no `src/app/check/page.tsx` route currently.
- **`POST /api/wallet` exists but is not referenced by UI**: `src/app/api/wallet/route.ts` provides balance lookup, but there are no calls to `/api/wallet` in `src/app/*` today.

## See also

- [`docs/architecture.md`](architecture.md)
- [`docs/api.md`](api.md)
- [`docs/risk-engine.md`](risk-engine.md)

