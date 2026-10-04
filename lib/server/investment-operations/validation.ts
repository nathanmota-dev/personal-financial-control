import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
fixedIncomeIndexers,
fixedIncomeSubtypes,
investmentAssetClasses,
investmentInstrumentTypes,
investmentOperations,
investmentOperationTypes,
investmentValuationModes
} from "@/lib/db/schema";
import { z } from "zod";


export const QUANTITY_SCALE = BigInt(100_000_000);

export type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type Db = AppDb | AppDbTransaction;

export type OperationRow = typeof investmentOperations.$inferSelect;

export const nullableText = z.string().trim().nullable().optional();

export const assetSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["stock", "real_estate_fund", "etf", "treasury", "cdb", "lci", "lca"]).optional(),
  ticker: nullableText,
  institutionName: nullableText,
  assetClass: z.enum(investmentAssetClasses),
  instrumentType: z.enum(investmentInstrumentTypes),
  valuationMode: z.enum(investmentValuationModes),
  quoteSymbol: nullableText,
  notes: nullableText,
});

export const operationSchema = z.object({
  holdingId: z.string().uuid(),
  type: z.enum(investmentOperationTypes),
  operatedOn: z.string().min(1),
  settledOn: nullableText,
  quantity: z.string().trim().default("0"),
  unitPriceCents: z.number().int().nonnegative().nullable().optional(),
  grossAmountCents: z.number().int().nonnegative().optional(),
  feesCents: z.number().int().nonnegative().default(0),
  targetCostCents: z.number().int().nonnegative().nullable().optional(),
  notes: nullableText,
});

export const quoteSchema = z.object({
  holdingId: z.string().uuid(),
  quotedOn: z.string().min(1),
  unitPriceCents: z.number().int().positive(),
});

export const termsSchema = z.object({
  holdingId: z.string().uuid(),
  subtype: z.enum(fixedIncomeSubtypes),
  issuer: nullableText,
  indexer: z.enum(fixedIncomeIndexers).nullable().optional(),
  indexerPercentageBps: z.number().int().positive().max(100_000).nullable().optional(),
  rateBps: z.number().int().nullable().optional(),
  maturityDate: nullableText,
  liquidity: nullableText,
});

export const supportedTypes = {
  stock: { assetClass: "equities", instrumentType: "stock", valuationMode: "market_quote" },
  real_estate_fund: { assetClass: "real_estate", instrumentType: "real_estate_fund", valuationMode: "market_quote" },
  etf: { assetClass: "funds", instrumentType: "etf", valuationMode: "market_quote" },
  treasury: { assetClass: "fixed_income", instrumentType: "treasury", valuationMode: "manual_balance" },
  cdb: { assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "manual_balance" },
  lci: { assetClass: "fixed_income", instrumentType: "lci_lca", valuationMode: "manual_balance" },
  lca: { assetClass: "fixed_income", instrumentType: "lci_lca", valuationMode: "manual_balance" },
} as const;

export async function dbOrDefault(database?: Db): Promise<Db> {
  return database ?? getFinanceDatabase();
}

export function textOrNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
