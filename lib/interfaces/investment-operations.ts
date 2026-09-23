import type {
  getInvestmentAssetDetails,
  getInvestmentOverview,
  listLongTermInvestmentPositions,
} from "@/lib/server/investment-operations";

export type InvestmentOverview = Awaited<ReturnType<typeof getInvestmentOverview>>;
export type InvestmentPosition = Awaited<
  ReturnType<typeof listLongTermInvestmentPositions>
>[number];
export type InvestmentAssetDetails = NonNullable<
  Awaited<ReturnType<typeof getInvestmentAssetDetails>>
>;

type InvestmentOperationBase = {
  holdingId: string;
  operatedOn: string;
  settledOn?: string | null;
  feesCents?: number;
  notes?: string | null;
};

export type InvestmentOperationInput =
  | (InvestmentOperationBase & { type: "buy" | "sell"; quantity: string; unitPriceCents: number; grossAmountCents?: never; targetCostCents?: never })
  | (InvestmentOperationBase & { type: "application" | "redemption"; quantity?: "0"; grossAmountCents: number; unitPriceCents?: never; targetCostCents?: never })
  | (InvestmentOperationBase & { type: "correction"; quantity: string; grossAmountCents: number; targetCostCents: number; unitPriceCents?: never; notes: string });

export type ManualQuoteInput = {
  holdingId: string;
  quotedOn: string;
  unitPriceCents: number;
};

export type FixedIncomeTermsInput = {
  holdingId: string;
  subtype: "treasury" | "cdb" | "lci_lca" | "debenture" | "other";
  issuer?: string | null;
  indexer?: string | null;
  indexerPercentageBps?: number | null;
  rateBps?: number | null;
  maturityDate?: string | null;
  liquidity?: string | null;
};

export type InvestmentReserveSummary = InvestmentOverview["reserve"];

export type OperationalAssetInput = {
  type?: "stock" | "real_estate_fund" | "etf" | "treasury" | "cdb" | "lci" | "lca";
  name: string;
  ticker?: string | null;
  institutionName?: string | null;
  assetClass: "fixed_income" | "equities" | "funds" | "real_estate" | "crypto" | "cash" | "other";
  instrumentType: "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset" | "cash" | "other";
  valuationMode: "market_quote" | "manual_balance" | "contract_estimate";
  quoteSymbol?: string | null;
  notes?: string | null;
};

export type InvestmentOverviewViewProps = { overview: InvestmentOverview };
export type OperationalPortfolioViewProps = { positions: InvestmentPosition[] };
export type InvestmentAssetDetailViewProps = { asset: InvestmentAssetDetails };
export type OverviewMetricProps = { icon: React.ReactNode; label: string; value: string; detail: string; tone: "cyan" | "teal" | "blue" | "green" | "red"; href?: string };
export type AssetFormState = { name: string; ticker: string; institutionName: string; assetClass: OperationalAssetInput["assetClass"]; instrumentType: OperationalAssetInput["instrumentType"]; valuationMode: OperationalAssetInput["valuationMode"]; quoteSymbol: string };
export type OperationFormState = { type: InvestmentOperationInput["type"]; operatedOn: string; quantity: string; unitPrice: string; grossAmount: string; fees: string; notes: string };
export type DetailMetricProps = { label: string; value: string; tone?: "neutral" | "positive" | "negative" };
