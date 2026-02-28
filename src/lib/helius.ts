import {
  WalletData,
  WalletInfoResponse,
  WalletInfoTokenHolding,
  WalletInfoTransaction,
} from "@/types";

const HELIUS_BASE_URL = "https://api.helius.xyz/v0";
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com";
const DEFAULT_REVALIDATE_SECONDS = 60;

function getHeliusApiKey(): string {
  const apiKey = process.env.HELIUS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("HELIUS_API_KEY not configured");
  }
  return apiKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function heliusRpcRequest(
  method: string,
  params: Record<string, unknown> | unknown[]
): Promise<unknown> {
  const apiKey = getHeliusApiKey();
  const response = await fetch(`${HELIUS_RPC_URL}/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: method,
      method,
      params,
    }),
    next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Helius RPC error: ${response.status} — ${text}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error("Invalid Helius RPC response");
  }

  if (payload.error) {
    throw new Error(`Helius RPC method failed: ${method}`);
  }

  return payload.result;
}

export async function getEnhancedTransactionsByAddress(
  address: string,
  options: { before?: string; limit?: number } = {}
): Promise<Record<string, unknown>[]> {
  const apiKey = getHeliusApiKey();
  const params = new URLSearchParams({
    "api-key": apiKey,
    limit: String(options.limit ?? 25),
  });

  if (options.before) {
    params.set("before", options.before);
  }

  const response = await fetch(
    `${HELIUS_BASE_URL}/addresses/${address}/transactions?${params.toString()}`,
    { next: { revalidate: DEFAULT_REVALIDATE_SECONDS } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Helius API error: ${response.status} — ${text}`);
  }

  const data: unknown = await response.json();
  return Array.isArray(data)
    ? (data.filter(isRecord) as Record<string, unknown>[])
    : [];
}

export async function getAssetsByOwner(
  address: string
): Promise<Record<string, unknown>[]> {
  const result = await heliusRpcRequest("getAssetsByOwner", {
    ownerAddress: address,
    page: 1,
    limit: 1000,
    options: {
      showFungible: true,
      showNativeBalance: true,
    },
  });

  if (!isRecord(result) || !Array.isArray(result.items)) {
    return [];
  }

  return result.items.filter(isRecord) as Record<string, unknown>[];
}

export async function getSolBalance(address: string): Promise<number> {
  const result = await heliusRpcRequest("getBalance", [address]);
  if (!isRecord(result)) {
    return 0;
  }
  const lamports = asNumber(result.value) ?? 0;
  return lamports / 1_000_000_000;
}

function countWalletAgeDays(
  transactions: Record<string, unknown>[]
): { firstSeenTimestamp: number | null; lastSeenTimestamp: number | null; ageDays: number | null } {
  const timestamps = transactions
    .map((tx) => asNumber(tx.timestamp))
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return {
      firstSeenTimestamp: null,
      lastSeenTimestamp: null,
      ageDays: null,
    };
  }

  const firstSeenTimestamp = Math.min(...timestamps);
  const lastSeenTimestamp = Math.max(...timestamps);
  const ageDays = (Date.now() / 1000 - firstSeenTimestamp) / 86400;

  return { firstSeenTimestamp, lastSeenTimestamp, ageDays };
}

function normalizeTransaction(
  tx: Record<string, unknown>
): WalletInfoTransaction | null {
  const signature = asString(tx.signature);
  if (!signature) {
    return null;
  }

  const nativeTransfers = Array.isArray(tx.nativeTransfers)
    ? tx.nativeTransfers
    : [];
  const tokenTransfers = Array.isArray(tx.tokenTransfers) ? tx.tokenTransfers : [];
  const status = tx.transactionError ? "failed" : "success";

  return {
    signature,
    timestamp: asNumber(tx.timestamp),
    type: asString(tx.type) ?? "UNKNOWN",
    source: asString(tx.source),
    description: asString(tx.description),
    status,
    nativeTransfersCount: nativeTransfers.length,
    tokenTransfersCount: tokenTransfers.length,
  };
}

function extractTokenHolding(
  asset: Record<string, unknown>
): WalletInfoTokenHolding | null {
  const tokenInfo = isRecord(asset.token_info) ? asset.token_info : null;
  if (!tokenInfo) {
    return null;
  }

  const balance = asNumber(tokenInfo.balance) ?? 0;
  if (balance <= 0) {
    return null;
  }

  const decimals = asNumber(tokenInfo.decimals) ?? 0;
  const mint = asString(tokenInfo.mint) ?? asString(asset.id) ?? "unknown";
  const content = isRecord(asset.content) ? asset.content : null;
  const metadata = content && isRecord(content.metadata) ? content.metadata : null;
  const symbol =
    asString(metadata?.symbol) ??
    asString(metadata?.name) ??
    `${mint.slice(0, 4)}...${mint.slice(-4)}`;

  const divisor = 10 ** decimals;
  const amount = divisor > 0 ? balance / divisor : balance;

  return {
    mint,
    symbol,
    amount,
    decimals,
  };
}

function isFungibleAsset(asset: Record<string, unknown>): boolean {
  const interfaceName = asString(asset.interface);
  if (interfaceName && interfaceName.toLowerCase().includes("fungible")) {
    return true;
  }
  return isRecord(asset.token_info);
}

export async function getWalletInfo(
  address: string,
  options: { before?: string; limit?: number } = {}
): Promise<WalletInfoResponse> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);

  const [transactionsRaw, assets, solBalance] = await Promise.all([
    getEnhancedTransactionsByAddress(address, {
      before: options.before,
      limit,
    }),
    getAssetsByOwner(address),
    getSolBalance(address),
  ]);

  const normalizedTransactions = transactionsRaw
    .map(normalizeTransaction)
    .filter((tx): tx is WalletInfoTransaction => tx !== null);

  const { firstSeenTimestamp, lastSeenTimestamp, ageDays } =
    countWalletAgeDays(transactionsRaw);

  const fungibleAssets = assets.filter(isFungibleAsset);
  const nftCount = Math.max(assets.length - fungibleAssets.length, 0);
  const topTokens = fungibleAssets
    .map(extractTokenHolding)
    .filter((token): token is WalletInfoTokenHolding => token !== null)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const lastTx = transactionsRaw[transactionsRaw.length - 1];
  const nextBefore = isRecord(lastTx) ? asString(lastTx.signature) : null;

  return {
    overview: {
      address,
      firstSeenTimestamp,
      lastSeenTimestamp,
      ageDays,
      solBalance,
      transactionCountShown: normalizedTransactions.length,
      tokenCount: fungibleAssets.length,
      nftCount,
    },
    transactions: normalizedTransactions,
    holdings: { topTokens },
    pagination: {
      before: nextBefore,
      hasMore: normalizedTransactions.length >= limit,
      limit,
    },
  };
}

export async function getWalletData(address: string): Promise<WalletData> {
  const transactions = await getEnhancedTransactionsByAddress(address, { limit: 100 });
  const assets = await getAssetsByOwner(address);

  const { ageDays } = countWalletAgeDays(transactions);
  const age = ageDays ?? 0;

  const outboundWallets = new Set<string>();
  for (const tx of transactions) {
    const nativeTransfers = Array.isArray(tx.nativeTransfers) ? tx.nativeTransfers : [];
    const tokenTransfers = Array.isArray(tx.tokenTransfers) ? tx.tokenTransfers : [];

    for (const transfer of nativeTransfers) {
      if (!isRecord(transfer)) continue;
      if (
        asString(transfer.fromUserAccount) === address &&
        asString(transfer.toUserAccount)
      ) {
        outboundWallets.add(asString(transfer.toUserAccount) as string);
      }
    }

    for (const transfer of tokenTransfers) {
      if (!isRecord(transfer)) continue;
      if (
        asString(transfer.fromUserAccount) === address &&
        asString(transfer.toUserAccount)
      ) {
        outboundWallets.add(asString(transfer.toUserAccount) as string);
      }
    }
  }

  const inboundTokenMints = new Set<string>();
  for (const tx of transactions) {
    const tokenTransfers = Array.isArray(tx.tokenTransfers) ? tx.tokenTransfers : [];
    for (const transfer of tokenTransfers) {
      if (!isRecord(transfer)) continue;
      if (
        asString(transfer.toUserAccount) === address &&
        asString(transfer.mint)
      ) {
        inboundTokenMints.add(asString(transfer.mint) as string);
      }
    }
  }

  return {
    transactions,
    assets,
    age,
    uniqueOutboundWallets: outboundWallets.size,
    inboundTokenCount: inboundTokenMints.size,
    transactionCount: transactions.length,
  };
}

export function getMockWalletInfo(
  address: string,
  options: { limit?: number } = {}
): WalletInfoResponse {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const txCount = Math.min(limit, 15 + (seed % 20));
  const now = Math.floor(Date.now() / 1000);

  const transactions: WalletInfoTransaction[] = Array.from(
    { length: txCount },
    (_, index) => ({
      signature: `${address.slice(0, 8)}-mock-${index + 1}`,
      timestamp: now - index * 7200,
      type: index % 3 === 0 ? "TRANSFER" : "UNKNOWN",
      source: index % 2 === 0 ? "SYSTEM_PROGRAM" : "JUPITER",
      description:
        index % 3 === 0
          ? "Transferred SOL to another wallet"
          : "Program interaction detected",
      status: "success",
      nativeTransfersCount: index % 3 === 0 ? 1 : 0,
      tokenTransfersCount: index % 2,
    })
  );

  return {
    overview: {
      address,
      firstSeenTimestamp: now - 86400 * (30 + (seed % 90)),
      lastSeenTimestamp: now - 3600,
      ageDays: 30 + (seed % 90),
      solBalance: (seed % 300) / 10,
      transactionCountShown: transactions.length,
      tokenCount: 4 + (seed % 6),
      nftCount: 1 + (seed % 4),
    },
    transactions,
    holdings: {
      topTokens: [
        {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          amount: 1.25 + (seed % 5),
          decimals: 9,
        },
        {
          mint: "Es9vMFrzaCERmJfrF4H2V6n6YfJmRoTSesQ5xQwdtY5",
          symbol: "USDT",
          amount: 42 + (seed % 50),
          decimals: 6,
        },
      ],
    },
    pagination: {
      before: transactions[transactions.length - 1]?.signature ?? null,
      hasMore: true,
      limit,
    },
  };
}

export function getMockWalletData(address: string): WalletData {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  const age = 30 + (seed % 300);
  const txCount = 10 + (seed % 90);
  const outbound = seed % 15;
  const inbound = seed % 8;

  return {
    transactions: Array(txCount).fill({}),
    assets: [],
    age,
    uniqueOutboundWallets: outbound,
    inboundTokenCount: inbound,
    transactionCount: txCount,
  };
}
