
export interface ValidatePurposeAllocationCapacityContext {
  transaction: Parameters<Parameters<import("@/lib/db").AppDb["transaction"]>[0]>[0];
  holding: { id: string; name: string; isArchived: boolean; createdAt: Date; updatedAt: Date; notes: string | null; ticker: string | null; institutionName: string | null; assetClass: "cash" | "other" | "fixed_income" | "equities" | "funds" | "real_estate" | "crypto"; instrumentType: "cash" | "other" | "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset"; valuationMode: "market_quote" | "manual_balance" | "contract_estimate"; currency: string; quoteSymbol: string | null; externalProvider: string | null; externalAssetId: string | null; currentValueCents: number; valueAsOf: string; activeQuoteSymbolHash: string | null; };
  existing: { id: string; createdAt: Date; updatedAt: Date; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; } | undefined;
  purpose: { id: string; name: string; isArchived: boolean; createdAt: Date; updatedAt: Date; notes: string | null; kind: "general" | "emergency_reserve"; targetAmountCents: number | null; color: string; activeEmergencyHash: string | null; };
  values: { holdingId: string; purposeId: string; amountCents: number; allocatedOn: string; notes?: string | null | undefined; };
}
