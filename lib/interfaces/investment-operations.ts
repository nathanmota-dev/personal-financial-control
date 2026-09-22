import type { investmentOperationTypes } from "@/lib/db/schema";
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

export type InvestmentOperationInput = {
  holdingId: string;
  type: (typeof investmentOperationTypes)[number];
  operatedOn: string;
  settledOn?: string | null;
  quantity: string;
  unitPriceCents?: number | null;
  grossAmountCents: number;
  feesCents?: number;
  targetCostCents?: number | null;
  notes?: string | null;
};

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
  rateBps?: number | null;
  maturityDate?: string | null;
  liquidity?: string | null;
};

export type InvestmentReserveSummary = InvestmentOverview["reserve"];

export type OperationalAssetInput = {
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
export type OperationFormState = { type: InvestmentOperationInput["type"]; operatedOn: string; quantity: string; grossAmount: string; fees: string; notes: string };
export type DetailMetricProps = { label: string; value: string; tone?: "neutral" | "positive" | "negative" };
