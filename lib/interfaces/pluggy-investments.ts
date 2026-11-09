import type { investmentAssetClasses, investmentHoldings, investmentInstrumentTypes } from "@/lib/db/schema";
import type { PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";

export type PluggyInvestmentClassification = {
  assetClass: (typeof investmentAssetClasses)[number];
  instrumentType: (typeof investmentInstrumentTypes)[number];
};

export type PluggyMappedInvestment = PluggyInvestmentClassification & {
  externalAssetId: string;
  name: string;
  institutionName: string | null;
  /** Net of fees and taxes. Null when the bank sent no value in reais, which must never read as a zero balance. */
  currentValueCents: number | null;
  valueAsOf: string;
  withdrawn: boolean;
  /** `isin` and `code`. They only suggest a holding, because banks can repeat them across positions. */
  matchCodes: string[];
};

export type PluggyLocalHolding = typeof investmentHoldings.$inferSelect;

export type PluggyInvestmentRead = { positions: PluggyRemoteInvestment[]; error: string | null };

export type PluggyInvestmentView = {
  itemId: string;
  itemLabel: string;
  externalAssetId: string;
  name: string;
  institutionName: string | null;
  currentValueCents: number | null;
  valueAsOf: string;
  withdrawn: boolean;
  link: { holdingId: string; holdingName: string } | null;
  suggestedHoldingId: string | null;
};

export type PluggyInvestmentHoldingOption = { id: string; name: string; institutionName: string | null };
export type PluggyInvestmentNotice = { itemId: string; label: string; message: string; failed: boolean };

export type PluggyInvestmentOverview = {
  investments: PluggyInvestmentView[];
  /** Active holdings that are still free to be linked. */
  holdings: PluggyInvestmentHoldingOption[];
  /** Connections that showed no positions, because connectors expose different products. */
  notices: PluggyInvestmentNotice[];
};
