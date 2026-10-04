import type { AppDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import {
buildInvestmentGrowthSeries,
calculateInvestmentBalance
} from "@/lib/investment-projection";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";
import { invariant } from "@/lib/server/errors";
import { normalizeDate,serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { and,eq,gte,inArray,lte } from "drizzle-orm";
import { addDaysToDate,addMonthsToDate,listPlannedInvestmentMovements } from "./planned-movements";
import { InvestmentDb,resolveReadDb } from "./validation";

export async function getInvestmentProjection(
  database?: InvestmentDb,
  options?: { asOfDate?: string }
) {
  const db = await resolveReadDb(database);
  const asOfDate = normalizeDate(options?.asOfDate ?? getFinanceToday());
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return null;
  }

  const movementRows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
      eq(transactions.status, "posted"),
      eq(transactions.isIncludedInInvestmentCheckpoint, false),
      gte(transactions.transactionDate, portfolio.checkpointDate),
      lte(transactions.transactionDate, asOfDate)
    ),
    orderBy: (table, { asc }) => [asc(table.transactionDate), asc(table.createdAt)],
  });
  const movements = movementRows.map((row) => toInvestmentMovement(row));
  const balance = calculateInvestmentBalance({
    checkpointBalanceCents: portfolio.checkpointBalanceCents,
    checkpointDate: portfolio.checkpointDate,
    expectedMonthlyRateBps: portfolio.expectedMonthlyRateBps,
    asOfDate,
    movements,
  });
  const plannedMovements = await listPlannedInvestmentMovements(
    db,
    addDaysToDate(asOfDate, 1),
    addMonthsToDate(asOfDate, 600)
  );
  const projection = Object.fromEntries(
    [1, 6, 12, 24].map((months) => [
      months,
      buildInvestmentGrowthSeries({
        currentBalanceCents: balance.balanceCents,
        expectedMonthlyRateBps: portfolio.expectedMonthlyRateBps,
        referenceDate: asOfDate,
        movements: plannedMovements,
        months,
      }).at(-1)?.balanceCents ?? balance.balanceCents,
    ])
  );

  return {
    ...serializeTimestamps(portfolio),
    currentBalanceCents: balance.balanceCents,
    asOfDate,
    estimatedInterestCents: balance.estimatedInterestCents,
    contributionCents: balance.contributionCents,
    withdrawalCents: balance.withdrawalCents,
    netMovementCents: balance.netMovementCents,
    projection,
    plannedMovements,
    nextContributionDate: plannedMovements.find(
      (movement) => movement.direction === "contribution"
    )?.date,
  };
}

export async function validateInvestmentAccountAndCategory(
  accountId: string,
  categoryId: string,
  database: AppDb
) {
  const [account, category] = await Promise.all([
    getAccountById(accountId, database),
    getCategoryById(categoryId, database),
  ]);

  invariant(
    account.type === "checking" || account.type === "savings" || account.type === "cash",
    "INVALID_INVESTMENT_ACCOUNT",
    "Investment movements require a checking, savings, or cash account."
  );
  invariant(
    category.group === "investment",
    "CATEGORY_TYPE_MISMATCH",
    "Investment movements require an investment category."
  );
}

export async function includeMovementsThroughDate(
  checkpointDate: string,
  database: InvestmentDb,
  timestamp: Date
) {
  await database
    .update(transactions)
    .set({
      isIncludedInInvestmentCheckpoint: true,
      updatedAt: timestamp,
    })
    .where(
      and(
        inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
        lte(transactions.transactionDate, checkpointDate),
        eq(transactions.status, "posted")
      )
    );
}

export function toInvestmentMovement(
  row: typeof transactions.$inferSelect,
  source: "transaction" | "recurring" = "transaction"
) {
  return {
    id: row.id,
    date: row.transactionDate,
    amountCents: row.amountCents,
    direction:
      row.type === "investment_contribution" ? ("contribution" as const) : ("withdrawal" as const),
    description: row.description,
    source,
    createdAt: row.createdAt.toISOString(),
  };
}
