import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { investmentReductionSelectionSchema } from "@/lib/server/investment-reconciliation";
import { z } from "zod";


export { getInvestmentReductionSources } from "@/lib/server/investment-reconciliation";

export const portfolioSchema = z.object({
  checkpointBalanceCents: z.number().int().nonnegative(),
  expectedMonthlyRateBps: z.number().int().nonnegative(),
  checkpointDate: z.string(),
});

export const investmentSettingsSchema = z.object({
  expectedMonthlyRateBps: z.number().int().nonnegative(),
});

export const checkpointSchema = z.object({
  checkpointBalanceCents: z.number().int().nonnegative(),
  checkpointDate: z.string(),
  sourceSelections: z.array(investmentReductionSelectionSchema).optional(),
  sources: z.array(investmentReductionSelectionSchema).optional(),
});

export const investmentContributionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
});

export const investmentWithdrawalSchema = investmentContributionSchema.extend({
  sourceSelections: z.array(investmentReductionSelectionSchema).optional(),
  sources: z.array(investmentReductionSelectionSchema).optional(),
});

export async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type InvestmentDb = AppDb | AppDbTransaction;

export async function resolveReadDb(database?: InvestmentDb): Promise<InvestmentDb> {
  return database ?? getFinanceDatabase();
}
