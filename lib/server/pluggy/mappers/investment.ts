import type { PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";
import type { PluggyInvestmentClassification, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { toAmountCents } from "./bank-transaction";
import { utcDay } from "./card-bill";

const OTHER: PluggyInvestmentClassification = { assetClass: "other", instrumentType: "other" };
const FUND: PluggyInvestmentClassification = { assetClass: "funds", instrumentType: "investment_fund" };
const STOCK: PluggyInvestmentClassification = { assetClass: "equities", instrumentType: "stock" };
const ETF: PluggyInvestmentClassification = { assetClass: "funds", instrumentType: "etf" };
const LCI_LCA: PluggyInvestmentClassification = { assetClass: "fixed_income", instrumentType: "lci_lca" };

const byType: Record<string, PluggyInvestmentClassification> = {
  FIXED_INCOME: { assetClass: "fixed_income", instrumentType: "other" },
  SECURITY: OTHER,
  MUTUAL_FUND: FUND,
  EQUITY: STOCK,
  ETF,
  COE: OTHER,
};

/** Only subtypes that refine their type. The rest, such as `LF` or `STOCK_FUND`, take the default of the type. */
const bySubtype: Record<string, PluggyInvestmentClassification> = {
  CDB: { assetClass: "fixed_income", instrumentType: "cdb" },
  LCI: LCI_LCA,
  LCA: LCI_LCA,
  TREASURY: { assetClass: "fixed_income", instrumentType: "treasury" },
  DEBENTURE: { assetClass: "fixed_income", instrumentType: "debenture" },
  DEBENTURES: { assetClass: "fixed_income", instrumentType: "debenture" },
  REAL_ESTATE_FUND: { assetClass: "real_estate", instrumentType: "real_estate_fund" },
  RETIREMENT: FUND,
  STOCK,
  BDR: STOCK,
  DERIVATIVES: { assetClass: "equities", instrumentType: "other" },
  OPTION: { assetClass: "equities", instrumentType: "other" },
  ETF,
};

export function classifyPluggyInvestment(type?: string | null, subtype?: string | null): PluggyInvestmentClassification {
  return bySubtype[subtype?.trim().toUpperCase() ?? ""] ?? byType[type?.trim().toUpperCase() ?? ""] ?? OTHER;
}

/** `balance` is net of fees and taxes. `amount` is gross and would overstate what can be withdrawn. */
function netValueCents({ balance, currencyCode }: PluggyRemoteInvestment) {
  if (typeof balance !== "number" || balance < 0) return null;
  return currencyCode && currencyCode.trim().toUpperCase() !== "BRL" ? null : toAmountCents(balance);
}

/** Pure. `today` dates a position the bank sent undated. */
export function mapPluggyInvestment(remote: PluggyRemoteInvestment, today: string): PluggyMappedInvestment {
  return {
    externalAssetId: remote.id,
    name: remote.name?.trim() || remote.code?.trim() || "Investimento",
    institutionName: remote.issuer?.trim() || null,
    currentValueCents: netValueCents(remote),
    valueAsOf: utcDay(remote.date) ?? today,
    withdrawn: remote.status?.trim().toUpperCase() === "TOTAL_WITHDRAWAL",
    matchCodes: [remote.isin, remote.code].flatMap((value) => value?.trim() ? [value.trim()] : []),
    ...classifyPluggyInvestment(remote.type, remote.subtype),
  };
}
