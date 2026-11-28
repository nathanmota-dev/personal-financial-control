import type { AppDb } from "@/lib/db";
import { investmentHoldings, transactions } from "@/lib/db/schema";
import { buildBankContributionBackfill } from "@/lib/bank-contribution-backfill";
import type { InvestmentContributionHistory } from "@/lib/interfaces/investments";
import { normalizeDate } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { createTransaction } from "@/lib/server/transactions";
import { indexToMonth,monthToIndex } from "@/lib/utils/finance-month";
import { and,eq,inArray,lte } from "drizzle-orm";
import { z } from "zod";
import { validateInvestmentAccountAndCategory } from "./projection";
import { investmentContributionSchema,InvestmentDb,investmentWithdrawalSchema,resolveDb,resolveReadDb } from "./validation";

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
      description: "Aporte à reserva",
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
      description: "Retirada da reserva",
      sourceSelections: values.sourceSelections ?? values.sources,
    },
    db
  );
}

type MonthTotals = { contributionCents: number; withdrawalCents: number };

/** Active positions the bank follows, with what it reports about their purchase. */
async function readBankPurchases(db: InvestmentDb) {
  const holdings = await db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) });
  return holdings.filter((holding) => holding.externalAssetId).map(({ principalCents, purchasedOn }) => ({ principalCents, purchasedOn }));
}

export async function getInvestmentContributionHistory(database?: InvestmentDb): Promise<InvestmentContributionHistory> {
  const db = await resolveReadDb(database);
  const asOfDate = getFinanceToday();
  const [rows, purchases] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
        eq(transactions.status, "posted"),
        lte(transactions.transactionDate, asOfDate)
      ),
      orderBy: (table, { asc }) => [asc(table.competenceMonth), asc(table.createdAt)],
    }),
    readBankPurchases(db),
  ]);

  const totalsByMonth = new Map<string, MonthTotals>();
  const monthTotals = (month: string) => totalsByMonth.get(month) ?? { contributionCents: 0, withdrawalCents: 0 };
  let recordedNetCents = 0;

  for (const row of rows) {
    const totals = monthTotals(row.competenceMonth);
    const contribution = row.type === "investment_contribution";
    if (contribution) totals.contributionCents += row.amountCents;
    else totals.withdrawalCents += row.amountCents;
    recordedNetCents += contribution ? row.amountCents : -row.amountCents;
    totalsByMonth.set(row.competenceMonth, totals);
  }

  const recordedSince = rows.map((row) => row.transactionDate).sort()[0] ?? null;
  const filled = buildBankContributionBackfill(purchases, recordedSince, recordedNetCents);
  for (const [month, cents] of filled?.monthlyCents ?? []) {
    const totals = monthTotals(month);
    totals.contributionCents += cents;
    totalsByMonth.set(month, totals);
  }
  const bankBackfill = filled?.backfill ?? null;

  if (!totalsByMonth.size) {
    return {
      totalContributionCents: 0,
      totalWithdrawalCents: 0,
      bankBackfill,
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
    const totals = monthTotals(month);
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
    bankBackfill,
    points,
  };
}
