# External Services

This document describes the external APIs/services the app integrates with and what they’re used for.

## Helius (Solana data)

**Where:** `src/lib/helius.ts`, `src/app/api/analyze/route.ts`, `src/app/api/token/route.ts`, `src/app/api/wallet/route.ts`

**Why:** fetch public on-chain activity and holdings for a Solana address or token mint.

### Endpoints / methods used

- **Enhanced transactions by address**  
  - `GET https://api.helius.xyz/v0/addresses/{address}/transactions?...`  
  - Used by `getEnhancedTransactionsByAddress()` and the higher-level fetch loops for wallet analysis.

- **RPC methods via Helius RPC** (`https://mainnet.helius-rpc.com/?api-key=...`)  
  Used through `heliusRpcRequest()` in `src/lib/helius.ts` and `heliusRpc()` in `src/app/api/token/route.ts`:
  - `getBalance` (wallet SOL balance)
  - `getAssetsByOwner` (holdings)
  - `getAccountInfo` (token mint validation)
  - `getTokenLargestAccounts` (holder concentration)
  - `getAsset` (token metadata name/symbol when available)

### Caching / revalidation

Most fetch calls include `next: { revalidate: 60 }` to cache results for ~60 seconds in Next.js.

### Demo mode behavior

If `HELIUS_API_KEY` is missing:

- `/api/analyze` uses `getMockWalletData()` and returns a deterministic demo balance.
- `/api/token` returns a deterministic mock scan.
- `/api/wallet` returns a deterministic demo balance plus a `note`.

See [`docs/configuration.md`](configuration.md).

## Google Gemini (AI)

**Where:** `src/lib/gemini.ts`, `src/app/api/chat/route.ts`, `src/app/api/analyze/route.ts`, `src/app/api/token/verdict/route.ts`

**Why:** provide plain-language, safety-focused explanations:

- Chat assistant responses (streamed)
- Wallet AI risk assessment (JSON output)
- Token “Sheriff’s Verdict” (streamed)

### Demo mode behavior

If `GEMINI_API_KEY` is missing:

- `/api/chat` returns `getMockChatResponse(...)`
- `/api/token/verdict` returns `getMockVerdict(...)`
- `/api/analyze` returns heuristic results only (no `ai` field)

## DexScreener (token liquidity)

**Where:** `src/app/api/token/route.ts`

**Why:** liquidity is a strong practical signal for rugpull/exit risk.

**Endpoint used:**

- `GET https://api.dexscreener.com/latest/dex/tokens/{mint}`

Implementation takes the **max** liquidity (USD) among returned Solana pairs.

## ElevenLabs (text-to-speech)

**Where:** `src/app/api/tts/route.ts`, used by `src/app/chat/page.tsx`

**Why:** allow users to listen to the assistant response (“Read aloud”).

**Behavior:**

- The server strips markdown-ish formatting before sending text to ElevenLabs.
- Returns `audio/mpeg` on success.
- If `ELEVENLABS_API_KEY` is missing, route returns `503` with JSON error.

## See also

- [`docs/api.md`](api.md)
- [`docs/architecture.md`](architecture.md)
- [`docs/configuration.md`](configuration.md)

