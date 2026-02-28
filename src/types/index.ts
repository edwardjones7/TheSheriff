export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AnalysisResult {
  riskLevel: "low" | "medium" | "high";
  score: number;
  findings: string[];
  advice: string;
  solBalance?: number;
}

export interface WalletData {
  transactions: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  age: number;
  uniqueOutboundWallets: number;
  inboundTokenCount: number;
  transactionCount: number;
}

export interface WalletInfoOverview {
  address: string;
  firstSeenTimestamp: number | null;
  lastSeenTimestamp: number | null;
  ageDays: number | null;
  solBalance: number | null;
  transactionCountShown: number;
  tokenCount: number;
  nftCount: number;
}

export interface WalletInfoTransaction {
  signature: string;
  timestamp: number | null;
  type: string;
  source: string | null;
  description: string | null;
  status: "success" | "failed";
  nativeTransfersCount: number;
  tokenTransfersCount: number;
}

export interface WalletInfoTokenHolding {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
}

export interface WalletInfoHoldings {
  topTokens: WalletInfoTokenHolding[];
}

export interface WalletInfoPagination {
  before: string | null;
  hasMore: boolean;
  limit: number;
}

export interface WalletInfoResponse {
  overview: WalletInfoOverview;
  transactions: WalletInfoTransaction[];
  holdings: WalletInfoHoldings;
  pagination: WalletInfoPagination;
}

export interface WalletBalanceResponse {
  address: string;
  solBalance: number;
  note?: string;
}
