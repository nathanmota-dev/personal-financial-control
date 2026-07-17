import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { investmentPortfolio, recurringTemplates, transactions } from "@/lib/db/schema";
import {
  calculateInvestmentBalance,
  type InvestmentMovement,
  buildInvestmentGrowthSeries,
} from "@/lib/investment-projection";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { createTransaction } from "@/lib/server/transactions";
import { getFinanceToday } from "@/lib/server/runtime";

const portfolioSchema = z.object({
  checkpointBalanceCents: z.number().int().nonnegative(),
  expectedMonthlyRateBps: z.number().int().nonnegative(),
  checkpointDate: z.string(),
});

const investmentSettingsSchema = z.object({
  expectedMonthlyRateBps: z.number().int().nonnegative(),
});

const checkpointSchema = z.object({
  checkpointBalanceCents: z.number().int().nonnegative(),
  checkpointDate: z.string(),
});

const investmentContributionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
});

const investmentWithdrawalSchema = investmentContributionSchema;

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type InvestmentDb = AppDb | AppDbTransaction;

async function resolveReadDb(database?: InvestmentDb): Promise<InvestmentDb> {
  return database ?? getFinanceDatabase();
}

export async function configureInvestmentPortfolio(
  input: z.input<typeof portfolioSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = portfolioSchema.parse(input);
  values.checkpointDate = normalizeDate(values.checkpointDate);
  validateCheckpointDate(values.checkpointDate);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();
    invariant(
      !existing || values.checkpointDate >= existing.checkpointDate,
      "CHECKPOINT_DATE_MUST_ADVANCE",
      "The new checkpoint date cannot be before the current checkpoint."
    );
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

    await includeMovementsThroughDate(values.checkpointDate, transaction, timestamp);

    return serializeTimestamps(savedPortfolio);
  });
}

export async function updateInvestmentSettings(
  input: z.input<typeof investmentSettingsSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentSettingsSchema.parse(input);
  const existing = await db.query.investmentPortfolio.findFirst();

  invariant(existing, "INVESTMENT_PORTFOLIO_NOT_FOUND", "Configure the investment portfolio first.", 404);

  const [updated] = await db
    .update(investmentPortfolio)
    .set({
      expectedMonthlyRateBps: values.expectedMonthlyRateBps,
      updatedAt: currentTimestamp(),
    })
    .where(eq(investmentPortfolio.id, existing.id))
    .returning();

  return serializeTimestamps(updated);
}

export async function reconcileInvestmentBalance(
  input: z.input<typeof checkpointSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = checkpointSchema.parse(input);
  values.checkpointDate = normalizeDate(values.checkpointDate);
  validateCheckpointDate(values.checkpointDate);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();

    invariant(existing, "INVESTMENT_PORTFOLIO_NOT_FOUND", "Configure the investment portfolio first.", 404);
    invariant(
      values.checkpointDate >= existing.checkpointDate,
      "CHECKPOINT_DATE_MUST_ADVANCE",
      "The new checkpoint date cannot be before the current checkpoint."
    );

    const timestamp = currentTimestamp();
    const [updated] = await transaction
      .update(investmentPortfolio)
      .set({
        checkpointBalanceCents: values.checkpointBalanceCents,
        checkpointDate: values.checkpointDate,
        updatedAt: timestamp,
      })
      .where(eq(investmentPortfolio.id, existing.id))
      .returning();

    await includeMovementsThroughDate(values.checkpointDate, transaction, timestamp);

    return serializeTimestamps(updated);
  });
}

export async function getInvestmentPortfolio(database?: InvestmentDb) {
  const db = await resolveReadDb(database);
  const portfolio = await db.query.investmentPortfolio.findFirst();

  return portfolio ? serializeTimestamps(portfolio) : null;
}

export async function createInvestmentContribution(
  input: z.input<typeof investmentContributionSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentContributionSchema.parse(input);
  values.transactionDate = normalizeDate(values.transactionDate);

  await validateInvestmentAccountAndCategory(values.accountId, values.categoryId, db);

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

export async function createInvestmentWithdrawal(
  input: z.input<typeof investmentWithdrawalSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentWithdrawalSchema.parse(input);
  values.transactionDate = normalizeDate(values.transactionDate);

  await validateInvestmentAccountAndCategory(values.accountId, values.categoryId, db);

  return createTransaction(
    {
      ...values,
      competenceMonth: values.transactionDate.slice(0, 7),
      type: "investment_withdrawal",
      status: "posted",
      description: "Resgate de investimento",
    },
    db
  );
}

export async function getInvestmentContributionHistory(database?: InvestmentDb) {
  const db = await resolveReadDb(database);
  const asOfDate = getFinanceToday();
  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
      eq(transactions.status, "posted"),
      lte(transactions.transactionDate, asOfDate)
    ),
    orderBy: (table, { asc }) => [asc(table.competenceMonth), asc(table.createdAt)],
  });

  const totalsByMonth = new Map<
    string,
    { contributionCents: number; withdrawalCents: number }
  >();

  for (const row of rows) {
    const totals = totalsByMonth.get(row.competenceMonth) ?? {
      contributionCents: 0,
      withdrawalCents: 0,
    };

    if (row.type === "investment_contribution") {
      totals.contributionCents += row.amountCents;
    } else {
      totals.withdrawalCents += row.amountCents;
    }

    totalsByMonth.set(row.competenceMonth, totals);
  }

  if (!totalsByMonth.size) {
    return {
      totalContributionCents: 0,
      totalWithdrawalCents: 0,
      points: [],
    };
  }

  const months = [...totalsByMonth.keys()].sort();
  const firstMonthIndex = monthToIndex(months[0]);
  const lastMonthIndex = Math.max(monthToIndex(months.at(-1) ?? months[0]), monthToIndex(asOfDate.slice(0, 7)));
  let cumulativeNetMovementCents = 0;
  let totalContributionCents = 0;
  let totalWithdrawalCents = 0;
  const points = [];

  for (let monthIndex = firstMonthIndex; monthIndex <= lastMonthIndex; monthIndex += 1) {
    const month = indexToMonth(monthIndex);
    const totals = totalsByMonth.get(month) ?? {
      contributionCents: 0,
      withdrawalCents: 0,
    };
    totalContributionCents += totals.contributionCents;
    totalWithdrawalCents += totals.withdrawalCents;
    cumulativeNetMovementCents += totals.contributionCents - totals.withdrawalCents;
    points.push({
      month,
      monthlyContributionCents: totals.contributionCents,
      monthlyWithdrawalCents: totals.withdrawalCents,
      cumulativeNetMovementCents,
    });
  }

  return {
    totalContributionCents,
    totalWithdrawalCents,
    points,
  };
}

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

async function validateInvestmentAccountAndCategory(
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

async function includeMovementsThroughDate(
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

function toInvestmentMovement(
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

async function listPlannedInvestmentMovements(
  database: InvestmentDb,
  startDate: string,
  endDate: string
) {
  const rows = await database.query.transactions.findMany({
    where: and(
      inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
      inArray(transactions.status, ["pending", "posted"]),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ),
  });
  const transactionMovements = rows.map((row) => toInvestmentMovement(row));
  const contributionTemplates = await database.query.recurringTemplates.findMany({
    where: and(
      eq(recurringTemplates.type, "investment_contribution"),
      eq(recurringTemplates.status, "active"),
      lte(recurringTemplates.startMonth, endDate.slice(0, 7)),
      or(
        isNull(recurringTemplates.endMonth),
        gte(recurringTemplates.endMonth, startDate.slice(0, 7))
      )
    ),
  });
  const existingOccurrences = await getExistingRecurringOccurrences(
    database,
    contributionTemplates.map((template) => template.id),
    startDate.slice(0, 7),
    endDate.slice(0, 7)
  );
  const recurringMovements: InvestmentMovement[] = [];

  for (const template of contributionTemplates) {
    for (const month of listMonths(startDate.slice(0, 7), endDate.slice(0, 7))) {
      if (
        month < template.startMonth ||
        (template.endMonth !== null && template.endMonth !== undefined && month > template.endMonth)
      ) {
        continue;
      }

      if (existingOccurrences.has(`${template.id}:${month}`)) {
        continue;
      }

      const date = buildDateInMonth(month, template.dayOfMonth);

      if (date < startDate || date > endDate) {
        continue;
      }

      recurringMovements.push({
        id: `${template.id}:${month}`,
        date,
        amountCents: template.amountCents,
        direction: "contribution",
        source: "recurring",
        createdAt: template.createdAt.toISOString(),
      });
    }
  }

  return [...transactionMovements, ...recurringMovements].sort((left, right) => {
    return (
      left.date.localeCompare(right.date) ||
      (left.createdAt ?? "").localeCompare(right.createdAt ?? "") ||
      left.id.localeCompare(right.id)
    );
  });
}

async function getExistingRecurringOccurrences(
  database: InvestmentDb,
  templateIds: string[],
  startMonth: string,
  endMonth: string
) {
  if (!templateIds.length) {
    return new Set<string>();
  }

  const rows = await database.query.transactions.findMany({
    where: and(
      inArray(transactions.recurringTemplateId, templateIds),
      gte(transactions.competenceMonth, startMonth),
      lte(transactions.competenceMonth, endMonth)
    ),
  });

  return new Set(rows.map((row) => `${row.recurringTemplateId}:${row.competenceMonth}`));
}

function buildDateInMonth(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const effectiveDay = Math.min(dayOfMonth, lastDay);

  return `${month}-${String(effectiveDay).padStart(2, "0")}`;
}

function listMonths(startMonth: string, endMonth: string) {
  const months: string[] = [];
  let cursor = startMonth;

  while (cursor <= endMonth) {
    months.push(cursor);
    cursor = addMonthsToMonth(cursor, 1);
  }

  return months;
}

function addMonthsToDate(date: string, amount: number) {
  return `${addMonthsToMonth(date.slice(0, 7), amount)}-${date.slice(8, 10)}`;
}

function addDaysToDate(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);

  return value.toISOString().slice(0, 10);
}

function addMonthsToMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
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

function todayDate() {
  return getFinanceToday();
}

function validateCheckpointDate(value: string) {
  invariant(value <= todayDate(), "CHECKPOINT_DATE_IN_FUTURE", "Checkpoint date cannot be in the future.");
}
