# Configuration

This app is designed to run in two modes:

- **Live mode**: real Solana data + AI responses (requires API keys)
- **Demo mode**: deterministic mock data and/or canned responses when keys are missing

## Environment variables

Create a `.env` file in the repo root.

### Required for full functionality

- `HELIUS_API_KEY`  
  - Enables real on-chain wallet + token analysis via Helius.
- `GEMINI_API_KEY`  
  - Enables AI chat, AI wallet assessment, and the AI token verdict.
- `ELEVENLABS_API_KEY`  
  - Enables text-to-speech (`/api/tts`) for reading assistant messages aloud.

### Example `.env`

```bash
HELIUS_API_KEY="your_helius_key_here"
GEMINI_API_KEY="your_gemini_key_here"
ELEVENLABS_API_KEY="your_elevenlabs_key_here"
```

Do not commit real keys.

## Demo mode behavior (what happens when keys are missing)

### Missing `HELIUS_API_KEY`

- `POST /api/analyze`
  - Uses `getMockWalletData(address)` from `src/lib/helius.ts`
  - Returns deterministic demo SOL balance
  - Prepends a “Demo mode…” line to `findings`
- `POST /api/token`
  - Returns deterministic mock `TokenScanResult`
- `POST /api/wallet`
  - Returns deterministic demo `solBalance` with a `note`

### Missing `GEMINI_API_KEY`

- `POST /api/chat`
  - Returns a mock safety assistant response from `getMockChatResponse`
- `POST /api/token/verdict`
  - Returns a mock verdict string from `getMockVerdict`
- `POST /api/analyze`
  - Returns heuristic analysis only (no `ai` field)

### Missing `ELEVENLABS_API_KEY`

- `POST /api/tts`
  - Returns `503` with JSON error (`ElevenLabs API key not configured`)
  - Chat UI shows an error banner if a user tries “Read aloud”

## Runtime notes

API route handlers set `export const runtime = "nodejs"` to run on the Node.js runtime (not Edge).

## See also

- [`docs/api.md`](api.md)
- [`docs/external-services.md`](external-services.md)
- [`docs/README.md`](README.md)

