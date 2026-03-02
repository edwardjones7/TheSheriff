# HenHacks 2026 Security Submission
The Solana Sheriff a tool use to mitigate a multi-billion dollar fraud industry.

Devpost: [Link](https://devpost.com/software/the-solana-sheriff?ref_content=my-projects-tab&ref_feature=my_projects)

# The Solana Sheriff (Developer Docs)

These docs explain what **The Solana Sheriff** is, how it works end-to-end, and where to find the main pieces of the system in the codebase.

## What this app does

The Solana Sheriff is a **Next.js** web app that helps crypto newcomers avoid scams and bad decisions on Solana. It provides:

- **AI Safety Assistant**: a plain-language chat experience (with optional voice features).
- **Wallet Analyzer**: a wallet risk assessment based on on-chain patterns, with an optional AI summary.
- **Scam Token Detector**: a token “rugpull risk” scan (liquidity + distribution + mint authority), plus an optional AI verdict.
- **Safety Resource Hub**: curated educational content about common scams and best practices.

High-level principle: **no wallet connection required**. Users paste addresses; the app fetches public on-chain data and returns guidance.

## At-a-glance architecture

- **Frontend (App Router pages)**: `src/app/*/page.tsx`
- **Server endpoints (Next.js route handlers)**: `src/app/api/**/route.ts`
- **Core domain logic**:
  - Helius integrations + evidence building: `src/lib/helius.ts`
  - Heuristic wallet risk scoring: `src/lib/risk-scorer.ts`
  - Gemini prompts + wallet AI assessment: `src/lib/gemini.ts`
- **Shared types/contracts**: `src/types/index.ts`

If you’re new, start with:

- **Architecture overview**: [`docs/architecture.md`](architecture.md)
- **Endpoints**: [`docs/api.md`](api.md)
- **Risk logic**: [`docs/risk-engine.md`](risk-engine.md)
- **Env/config**: [`docs/configuration.md`](configuration.md)
- **External services**: [`docs/external-services.md`](external-services.md)

## Local development quickstart

### Prerequisites

- Node.js (works with the repo’s Next.js 14 setup)

### Install and run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

### Environment variables

Create a `.env` file in the repo root (see [`docs/configuration.md`](configuration.md) for details).

Required for “live” mode:

- `HELIUS_API_KEY` (on-chain data)
- `GEMINI_API_KEY` (AI assistant + AI wallet assessment + token verdict)
- `ELEVENLABS_API_KEY` (text-to-speech)

The app also supports **demo mode** when certain keys are missing (it returns deterministic mock data and/or canned AI responses). See [`docs/configuration.md`](configuration.md).

## Where to look first (code map)

- **Home / navigation**: `src/app/page.tsx`, `src/components/Navbar.tsx`
- **Chat UI + streaming**: `src/app/chat/page.tsx` → `src/app/api/chat/route.ts`
- **Wallet Analyzer UI + API**: `src/app/analyze/page.tsx` → `src/app/api/analyze/route.ts`
- **Token scan UI + API**: `src/app/token/page.tsx` → `src/app/api/token/route.ts`
- **Token AI verdict**: `src/app/api/token/verdict/route.ts`
- **TTS (assistant “Read aloud”)**: `src/app/api/tts/route.ts`

