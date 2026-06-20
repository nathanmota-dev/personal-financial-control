import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { investmentPortfolio, transactions } from "@/lib/db/schema";
import { projectCompoundBalance } from "@/lib/investment-projection";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { createTransaction } from "@/lib/server/transactions";

const investmentPortfolioSchema = z.object({
  currentBalanceCents: z.number().int().nonnegative(),
  monthlyContributionCents: z.number().int().nonnegative(),
  expectedMonthlyRateBps: z.number().int().nonnegative(),
  referenceDate: z.string(),
});

const investmentContributionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
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

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();
    const timestamp = currentTimestamp();
    let savedPortfolio;

    if (!existing) {
      [savedPortfolio] = await transaction
        .insert(investmentPortfolio)
        .values({
          ...values,
          updatedAt: timestamp,
        })
        .returning();
    } else {
      [savedPortfolio] = await transaction
        .update(investmentPortfolio)
        .set({
          ...values,
          updatedAt: timestamp,
        })
        .where(eq(investmentPortfolio.id, existing.id))
        .returning();
    }

    await transaction
      .update(transactions)
      .set({
        isIncludedInInvestmentBalance: true,
        updatedAt: timestamp,
      })
      .where(
        and(
          eq(transactions.type, "investment_contribution"),
          eq(transactions.status, "posted"),
          eq(transactions.isIncludedInInvestmentBalance, false)
        )
      );

    return serializeTimestamps(savedPortfolio);
  });
}

export async function getInvestmentPortfolio(database?: AppDb) {
  const db = resolveDb(database);
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return null;
  }

  return serializeTimestamps(portfolio);
}

export async function createInvestmentContribution(
  input: z.input<typeof investmentContributionSchema>,
  database?: AppDb
) {
  const db = resolveDb(database);
  const values = investmentContributionSchema.parse(input);
  values.transactionDate = normalizeDate(values.transactionDate);

  const [account, category] = await Promise.all([
    getAccountById(values.accountId, db),
    getCategoryById(values.categoryId, db),
  ]);

  invariant(
    account.type === "checking" || account.type === "savings" || account.type === "cash",
    "INVALID_INVESTMENT_SOURCE_ACCOUNT",
    "Investment contributions require a checking, savings, or cash source account."
  );
  invariant(
    category.group === "investment",
    "CATEGORY_TYPE_MISMATCH",
    "Investment contributions require an investment category."
  );

  return createTransaction(
    {
      ...values,
      competenceMonth: values.transactionDate.slice(0, 7),
      type: "investment_contribution",
      status: "posted",
      description: "Aporte de investimento",
    },
    db
  );
}

export async function getInvestmentContributionHistory(database?: AppDb) {
  const db = resolveDb(database);
  const rows = await db.query.transactions.findMany({
    where: and(
      eq(transactions.type, "investment_contribution"),
      eq(transactions.status, "posted")
    ),
    orderBy: (table, { asc }) => [asc(table.competenceMonth), asc(table.createdAt)],
  });

  const totalsByMonth = new Map<string, number>();

  for (const row of rows) {
    totalsByMonth.set(
      row.competenceMonth,
      (totalsByMonth.get(row.competenceMonth) ?? 0) + row.amountCents
    );
  }

  if (!totalsByMonth.size) {
    return { totalContributionCents: 0, points: [] };
  }

  const months = [...totalsByMonth.keys()].sort();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const firstMonthIndex = monthToIndex(months[0]);
  const lastMonthIndex = Math.max(
    monthToIndex(months[months.length - 1]),
    monthToIndex(currentMonth)
  );
  let cumulativeContributionCents = 0;
  const points = [];

  for (let monthIndex = firstMonthIndex; monthIndex <= lastMonthIndex; monthIndex += 1) {
    const month = indexToMonth(monthIndex);
    const monthlyContributionCents = totalsByMonth.get(month) ?? 0;
    cumulativeContributionCents += monthlyContributionCents;
    points.push({
      month,
      monthlyContributionCents,
      cumulativeContributionCents,
    });
  }

  return {
    totalContributionCents: cumulativeContributionCents,
    points,
  };
}

export async function getInvestmentProjection(database?: AppDb) {
  const db = resolveDb(database);
  const [portfolio, unincorporatedContributions] = await Promise.all([
    db.query.investmentPortfolio.findFirst(),
    db.query.transactions.findMany({
      where: and(
        eq(transactions.type, "investment_contribution"),
        eq(transactions.status, "posted"),
        eq(transactions.isIncludedInInvestmentBalance, false)
      ),
    }),
  ]);

  if (!portfolio) {
    return null;
  }

  const unincorporatedContributionCents = unincorporatedContributions.reduce(
    (total, contribution) => total + contribution.amountCents,
    0
  );
  const currentBalanceCents =
    portfolio.currentBalanceCents + unincorporatedContributionCents;
  const referenceDate = unincorporatedContributions.reduce(
    (latestDate, contribution) =>
      contribution.transactionDate > latestDate
        ? contribution.transactionDate
        : latestDate,
    portfolio.referenceDate
  );
  const horizons = [1, 6, 12, 24];
  const projection = Object.fromEntries(
    horizons.map((months) => [
      months,
      projectCompoundBalance({
        currentBalanceCents,
        monthlyContributionCents: portfolio.monthlyContributionCents,
        expectedMonthlyRateBps: portfolio.expectedMonthlyRateBps,
        referenceDate,
        months,
      }),
    ])
  );

  return {
    ...serializeTimestamps(portfolio),
    baseBalanceCents: portfolio.currentBalanceCents,
    baseReferenceDate: portfolio.referenceDate,
    currentBalanceCents,
    referenceDate,
    unincorporatedContributionCents,
    projection,
  };
}

function monthToIndex(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + monthNumber - 1;
}

function indexToMonth(index: number) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
