import { eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { investmentPortfolio } from "@/lib/db/schema";
import { currentTimestamp, normalizeDate, projectCompoundBalance, serializeTimestamps } from "@/lib/server/finance";

const investmentPortfolioSchema = z.object({
  currentBalanceCents: z.number().int().nonnegative(),
  monthlyContributionCents: z.number().int().nonnegative(),
  expectedMonthlyRateBps: z.number().int().nonnegative(),
  referenceDate: z.string(),
});

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

export async function saveInvestmentPortfolio(
  input: z.input<typeof investmentPortfolioSchema>,
  database?: AppDb
) {
  const db = resolveDb(database);
  const values = investmentPortfolioSchema.parse(input);
  values.referenceDate = normalizeDate(values.referenceDate);

  const existing = await db.query.investmentPortfolio.findFirst();

  if (!existing) {
    const [created] = await db
      .insert(investmentPortfolio)
      .values({
        ...values,
        updatedAt: currentTimestamp(),
      })
      .returning();

    return serializeTimestamps(created);
  }

  const [updated] = await db
    .update(investmentPortfolio)
    .set({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .where(eq(investmentPortfolio.id, existing.id))
    .returning();

  return serializeTimestamps(updated);
}

export async function getInvestmentPortfolio(database?: AppDb) {
  const db = resolveDb(database);
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return null;
  }

  return serializeTimestamps(portfolio);
}

export async function getInvestmentProjection(
  customMonths?: number,
  database?: AppDb
) {
  const db = resolveDb(database);
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return null;
  }

  const horizons = [1, 6, 12, customMonths].filter(
    (value): value is number => typeof value === "number" && value > 0
  );

  const projection = Object.fromEntries(
    horizons.map((months) => [
      months,
      projectCompoundBalance({
        currentBalanceCents: portfolio.currentBalanceCents,
        monthlyContributionCents: portfolio.monthlyContributionCents,
        expectedMonthlyRateBps: portfolio.expectedMonthlyRateBps,
        months,
      }),
    ])
  );

  return {
    ...serializeTimestamps(portfolio),
    projection,
  };
}
