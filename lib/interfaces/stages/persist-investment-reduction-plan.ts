
export interface PersistInvestmentReductionPlanContext {
  event: { id: string; type: "withdrawal" | "reconciliation"; createdAt: Date; updatedAt: Date; status: "active" | "reversed"; amountCents: number; transactionId: string | null; occurredOn: string; reversedAt: Date | null; };
  allocationReductions: Map<string, number>;
  allocationsById: Map<string, { id: string; createdAt: Date; updatedAt: Date; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; }>;
  transaction: Parameters<Parameters<import("@/lib/db").AppDb["transaction"]>[0]>[0];
  timestamp: Date;
  holdingReductions: Map<string, number>;
  holdingsById: Map<string, { id: string; name: string; isArchived: boolean; createdAt: Date; updatedAt: Date; notes: string | null; ticker: string | null; institutionName: string | null; assetClass: "cash" | "other" | "fixed_income" | "equities" | "funds" | "real_estate" | "crypto"; instrumentType: "cash" | "other" | "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset"; valuationMode: "market_quote" | "manual_balance" | "contract_estimate"; currency: string; quoteSymbol: string | null; externalProvider: string | null; externalAssetId: string | null; currentValueCents: number; valueAsOf: string; activeQuoteSymbolHash: string | null; }>;
  sourceRows: { sourceType: "allocation" | "holding_free" | "not_registered"; holdingId: string | null; purposeId: string | null; allocationId: string | null; amountCents: number; }[];
}
