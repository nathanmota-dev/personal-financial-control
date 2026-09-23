export type MarketQuote = {
  symbol: string;
  currency: string;
  unitPriceCents: number;
  quotedAt: Date;
  marketState: "regular" | "closed" | "delayed" | "unknown";
};

export interface MarketDataProvider {
  readonly name: "brapi";
  getQuote(symbol: string): Promise<MarketQuote>;
}

export type InvestmentQuoteRefreshItem = {
  holdingId: string;
  symbol: string;
  status: "updated" | "cooldown" | "failed";
  message?: string;
};

export type InvestmentQuoteRefreshResult = {
  updated: number;
  skippedByCooldown: number;
  failed: number;
  refreshedAt: string;
  snapshotDate: string | null;
  items: InvestmentQuoteRefreshItem[];
};
