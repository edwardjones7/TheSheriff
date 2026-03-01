import {
  RiskEvidence,
  RiskEvidenceHolding,
  RiskEvidenceTransaction,
  WalletData,
  WalletDataCoverage,
  WalletInfoResponse,
  WalletInfoTokenHolding,
  WalletInfoTransaction,
} from "@/types";

const HELIUS_BASE_URL = "https://api.helius.xyz/v0";
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com";
const DEFAULT_REVALIDATE_SECONDS = 60;
const TX_FETCH_CAP = 2000;
const TX_PAGE_SIZE = 100;

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
  options: { before?: string; limit?: number; sortOrder?: "asc" | "desc" } = {}
): Promise<Record<string, unknown>[]> {
  const apiKey = getHeliusApiKey();
  const params = new URLSearchParams({
    "api-key": apiKey,
    limit: String(options.limit ?? 25),
  });

  if (options.before) {
    params.set("before-signature", options.before);
  }

  if (options.sortOrder) {
    params.set("sort-order", options.sortOrder);
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

async function getOldestTxTimestamp(
  address: string
): Promise<number | null> {
  const page = await getEnhancedTransactionsByAddress(address, {
    limit: 1,
    sortOrder: "asc",
  });

  if (page.length === 0) return null;
  return asNumber(page[0].timestamp);
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

  const [transactionsRaw, assets, solBalance, oldestTimestamp] =
    await Promise.all([
      getEnhancedTransactionsByAddress(address, {
        before: options.before,
        limit,
      }),
      getAssetsByOwner(address),
      getSolBalance(address),
      getOldestTxTimestamp(address),
    ]);

  const normalizedTransactions = transactionsRaw
    .map(normalizeTransaction)
    .filter((tx): tx is WalletInfoTransaction => tx !== null);

  const pageTimes = countWalletAgeDays(transactionsRaw);
  const firstSeenTimestamp = oldestTimestamp ?? pageTimes.firstSeenTimestamp;
  const lastSeenTimestamp = pageTimes.lastSeenTimestamp;
  const ageDays =
    firstSeenTimestamp !== null
      ? (Date.now() / 1000 - firstSeenTimestamp) / 86400
      : null;

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

async function fetchAllEnhancedTransactions(
  address: string,
  cap: number = TX_FETCH_CAP
): Promise<{ transactions: Record<string, unknown>[]; hitCap: boolean; hasMore: boolean }> {
  const allTransactions: Record<string, unknown>[] = [];
  let before: string | undefined;
  let hasMore = true;

  while (allTransactions.length < cap) {
    const remaining = cap - allTransactions.length;
    const pageSize = Math.min(TX_PAGE_SIZE, remaining);

    const page = await getEnhancedTransactionsByAddress(address, {
      limit: pageSize,
      before,
    });

    if (page.length === 0) {
      hasMore = false;
      break;
    }

    allTransactions.push(...page);

    const lastTx = page[page.length - 1];
    const lastSig = isRecord(lastTx) ? asString(lastTx.signature) : null;

    if (!lastSig || page.length < pageSize) {
      hasMore = page.length >= pageSize;
      break;
    }

    if (lastSig === before) {
      hasMore = false;
      break;
    }

    before = lastSig;
  }

  const hitCap = allTransactions.length >= cap;

  return { transactions: allTransactions, hitCap, hasMore };
}

function computeCounterpartiesAndInbound(
  transactions: Record<string, unknown>[],
  address: string
): { counterparties: number; inboundTokenMints: number } {
  const counterparties = new Set<string>();
  const inboundTokenMints = new Set<string>();

  for (const tx of transactions) {
    const nativeTransfers = Array.isArray(tx.nativeTransfers)
      ? tx.nativeTransfers
      : [];
    const tokenTransfers = Array.isArray(tx.tokenTransfers)
      ? tx.tokenTransfers
      : [];

    for (const transfer of nativeTransfers) {
      if (!isRecord(transfer)) continue;
      const from = asString(transfer.fromUserAccount);
      const to = asString(transfer.toUserAccount);
      if (from === address && to) counterparties.add(to);
      else if (to === address && from) counterparties.add(from);
    }

    for (const transfer of tokenTransfers) {
      if (!isRecord(transfer)) continue;
      const from = asString(transfer.fromUserAccount);
      const to = asString(transfer.toUserAccount);
      if (from === address && to) counterparties.add(to);
      else if (to === address && from) counterparties.add(from);

      if (to === address) {
        const mint = asString(transfer.mint);
        if (mint) inboundTokenMints.add(mint);
      }
    }
  }

  return {
    counterparties: counterparties.size,
    inboundTokenMints: inboundTokenMints.size,
  };
}

function computeMaxTxBurst(
  transactions: Record<string, unknown>[],
  windowSeconds: number
): number {
  const timestamps = transactions
    .map((tx) => asNumber(tx.timestamp))
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);

  if (timestamps.length <= 1) return timestamps.length;

  let maxBurst = 1;
  let windowStart = 0;

  for (let windowEnd = 1; windowEnd < timestamps.length; windowEnd++) {
    while (timestamps[windowEnd] - timestamps[windowStart] > windowSeconds) {
      windowStart++;
    }
    maxBurst = Math.max(maxBurst, windowEnd - windowStart + 1);
  }

  return maxBurst;
}

function countHeldFungibleMints(assets: Record<string, unknown>[]): number {
  let count = 0;
  for (const asset of assets) {
    if (!isFungibleAsset(asset)) continue;
    const holding = extractTokenHolding(asset);
    if (holding) count++;
  }
  return count;
}

export async function getWalletData(address: string): Promise<WalletData> {
  const [{ transactions, hitCap, hasMore }, assets, oldestTimestamp] =
    await Promise.all([
      fetchAllEnhancedTransactions(address),
      getAssetsByOwner(address),
      getOldestTxTimestamp(address),
    ]);

  const { lastSeenTimestamp } = countWalletAgeDays(transactions);

  const firstSeenTimestamp =
    oldestTimestamp ?? countWalletAgeDays(transactions).firstSeenTimestamp;

  const ageDays =
    firstSeenTimestamp !== null
      ? (Date.now() / 1000 - firstSeenTimestamp) / 86400
      : null;

  const { counterparties, inboundTokenMints } =
    computeCounterpartiesAndInbound(transactions, address);

  const coverage: WalletDataCoverage = {
    transactionsFetched: transactions.length,
    hitCap,
    firstSeenTimestamp,
    lastSeenTimestamp,
    hasMore,
  };

  return {
    transactions,
    assets,
    age: ageDays ?? 0,
    transactionCount: transactions.length,
    uniqueCounterparties: counterparties,
    inboundTokenCount: inboundTokenMints,
    heldTokenMintsCount: countHeldFungibleMints(assets),
    maxTxBurst1m: computeMaxTxBurst(transactions, 60),
    maxTxBurst5m: computeMaxTxBurst(transactions, 300),
    coverage,
  };
}

const EVIDENCE_TX_CAP = 200;

export function buildRiskEvidence(
  address: string,
  data: WalletData
): RiskEvidence {
  const normalizedTx: RiskEvidenceTransaction[] = data.transactions
    .slice(0, EVIDENCE_TX_CAP)
    .map((tx) => {
      const norm = normalizeTransaction(tx);
      if (!norm) return null;
      return {
        signature: norm.signature,
        timestamp: norm.timestamp,
        type: norm.type,
        source: norm.source,
        status: norm.status,
        nativeTransfersCount: norm.nativeTransfersCount,
        tokenTransfersCount: norm.tokenTransfersCount,
      };
    })
    .filter((tx): tx is RiskEvidenceTransaction => tx !== null);

  const holdings: RiskEvidenceHolding[] = data.assets
    .filter(isFungibleAsset)
    .map(extractTokenHolding)
    .filter((h): h is WalletInfoTokenHolding => h !== null)
    .sort((a, b) => b.amount - a.amount)
    .map((h) => ({ mint: h.mint, symbol: h.symbol, amount: h.amount }));

  return {
    inputs: {
      address,
      analyzedAt: new Date().toISOString(),
    },
    factors: {
      walletAgeDays: data.age,
      transactionCount: data.transactionCount,
      uniqueCounterpartiesCount: data.uniqueCounterparties,
      maxTxBurst1m: data.maxTxBurst1m,
      maxTxBurst5m: data.maxTxBurst5m,
      heldTokenMintsCount: data.heldTokenMintsCount,
    },
    holdings,
    transactions: normalizedTx,
    coverage: data.coverage,
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
  const counterparties = seed % 25;
  const inbound = seed % 8;
  const heldMints = 3 + (seed % 10);
  const now = Math.floor(Date.now() / 1000);

  return {
    transactions: Array(txCount).fill({}),
    assets: [],
    age,
    transactionCount: txCount,
    uniqueCounterparties: counterparties,
    inboundTokenCount: inbound,
    heldTokenMintsCount: heldMints,
    maxTxBurst1m: 1 + (seed % 4),
    maxTxBurst5m: 2 + (seed % 8),
    coverage: {
      transactionsFetched: txCount,
      hitCap: false,
      firstSeenTimestamp: now - age * 86400,
      lastSeenTimestamp: now - 3600,
      hasMore: false,
    },
  };
}
