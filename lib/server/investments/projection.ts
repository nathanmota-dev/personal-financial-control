import type { AppDb } from "@/lib/db";
import { investmentHoldings, investmentPortfolio, transactions } from "@/lib/db/schema";
import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";
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
import { buildBankReserveSplit } from "./bank-reserve";
import { planReserveMovements } from "./reserve-contribution";
import { InvestmentDb,resolveReadDb } from "./validation";

export async function getInvestmentProjection(
  database?: InvestmentDb,
  options?: { asOfDate?: string }
) {
  const db = await resolveReadDb(database);
  const asOfDate = normalizeDate(options?.asOfDate ?? getFinanceToday());
  const [portfolio, holdings] = await Promise.all([
    db.query.investmentPortfolio.findFirst(),
    db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) }),
  ]);
  const bank = await buildBankReserveSplit(db, holdings, portfolio, asOfDate);

  if (bank) {
    return getBankReserveProjection(db, bank, portfolio, asOfDate);
  }

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
  const { plannedMovements, projection, contribution } = await projectReserve(db, balance.balanceCents, portfolio.expectedMonthlyRateBps, asOfDate, portfolio.reserveMonthlyContributionCents);

  return {
    ...serializeTimestamps(portfolio),
    source: "manual" as const,
    bank: null,
    contribution,
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

async function projectReserve(db: InvestmentDb, balanceCents: number, expectedMonthlyRateBps: number, asOfDate: string, savedMonthlyCents: number | null | undefined) {
  const { plannedMovements, contribution } = await planReserveMovements(db, asOfDate, savedMonthlyCents);
  const projection = Object.fromEntries(
    [1, 6, 12, 24].map((months) => [
      months,
      buildInvestmentGrowthSeries({
        currentBalanceCents: balanceCents,
        expectedMonthlyRateBps,
        referenceDate: asOfDate,
        movements: plannedMovements,
        months,
      }).at(-1)?.balanceCents ?? balanceCents,
    ])
  );
  return { plannedMovements, projection, contribution };
}

/**
 * With linked positions, the reserve is the amount the user set over the bank's values: no checkpoint and no estimate.
 * The projection uses the realized rate, and the configured rate only until enough snapshots exist.
 */
async function getBankReserveProjection(db: InvestmentDb, bank: BankReserveSplit, portfolio: typeof investmentPortfolio.$inferSelect | undefined, asOfDate: string) {
  const expectedMonthlyRateBps = bank.realizedYield?.monthlyRateBps ?? portfolio?.expectedMonthlyRateBps ?? 0;
  const { plannedMovements, projection, contribution } = await projectReserve(db, bank.reserveCents, expectedMonthlyRateBps, asOfDate, portfolio?.reserveMonthlyContributionCents);
  const timestamps = portfolio ? serializeTimestamps(portfolio) : null;
  // Without a stored row the bank's date stands in, typed like the serialized timestamps the views expect.
  const fallbackTimestamp = `${bank.valueAsOf}T00:00:00.000Z` as Date & string;
  return {
    id: portfolio?.id ?? "bank-reserve",
    checkpointBalanceCents: bank.reserveCents,
    expectedMonthlyRateBps,
    checkpointDate: bank.valueAsOf <= asOfDate ? bank.valueAsOf : asOfDate,
    reserveAmountCents: bank.configuredReserveCents,
    createdAt: timestamps?.createdAt ?? fallbackTimestamp,
    updatedAt: timestamps?.updatedAt ?? fallbackTimestamp,
    source: "bank" as const,
    bank,
    contribution,
    currentBalanceCents: bank.reserveCents,
    asOfDate,
    estimatedInterestCents: 0,
    contributionCents: 0,
    withdrawalCents: 0,
    netMovementCents: 0,
    projection,
    plannedMovements,
    nextContributionDate: plannedMovements.find((movement) => movement.direction === "contribution")?.date,
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
