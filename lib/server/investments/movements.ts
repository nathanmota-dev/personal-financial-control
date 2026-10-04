import type { AppDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
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
