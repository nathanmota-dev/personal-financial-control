
export interface AllocationDialogDialogFooter3Props {
  isExisting: boolean;
  isPending: boolean;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  holdings: { allocatedCents: number; freeValueCents: number; allocationCount: number; allocations: { purposeName: string; purposeColor: string; id: string; createdAt: Date & string; updatedAt: Date & string; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; }[]; id: string; name: string; isArchived: boolean; createdAt: Date & string; updatedAt: Date & string; notes: string | null; ticker: string | null; institutionName: string | null; assetClass: "cash" | "other" | "fixed_income" | "equities" | "funds" | "real_estate" | "crypto"; instrumentType: "cash" | "other" | "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset"; valuationMode: "market_quote" | "manual_balance" | "contract_estimate"; currency: string; quoteSymbol: string | null; externalProvider: string | null; externalAssetId: string | null; currentValueCents: number; valueAsOf: string; activeQuoteSymbolHash: string | null; }[];
  purposes: { allocatedCents: number; percentage: number; holdingCount: number; lastAllocatedOn: string; progressPercentage: number | null; allocations: { holdingName: string; id: string; createdAt: Date & string; updatedAt: Date & string; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; }[]; id: string; name: string; isArchived: boolean; createdAt: Date & string; updatedAt: Date & string; notes: string | null; kind: "general" | "emergency_reserve"; targetAmountCents: number | null; color: string; activeEmergencyHash: string | null; }[];
}
