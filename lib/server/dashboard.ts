import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { getInvestmentProjection } from "@/lib/server/investments";
import { listAccounts } from "@/lib/server/accounts";
import { listTransactions } from "@/lib/server/transactions";
import { normalizeCompetenceMonth } from "@/lib/server/finance";

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

export async function getMonthlyDashboard(month: string, database?: AppDb) {
  const db = resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);
  const [transactionRows, accountRows, investmentProjection] = await Promise.all([
    listTransactions({ competenceMonth }, db),
    listAccounts(undefined, db),
    getInvestmentProjection(db),
  ]);

  const activeTransactions = transactionRows.filter((row) => row.status !== "cancelled");

  const incomeCents = activeTransactions
    .filter((row) => row.type === "income")
    .reduce((total, row) => total + row.amountCents, 0);
  const fixedExpenseCents = activeTransactions
    .filter((row) => row.type === "expense" && row.category?.group === "fixed_expense")
    .reduce((total, row) => total + row.amountCents, 0);
  const variableExpenseCents = activeTransactions
    .filter((row) => row.type === "expense" && row.category?.group === "variable_expense")
    .reduce((total, row) => total + row.amountCents, 0);
  const investmentContributionCents = activeTransactions
    .filter((row) => row.type === "investment_contribution")
    .reduce((total, row) => total + row.amountCents, 0);

  return {
    competenceMonth,
    totals: {
      incomeCents,
      fixedExpenseCents,
      variableExpenseCents,
      investmentContributionCents,
      netResultCents:
        incomeCents - fixedExpenseCents - variableExpenseCents - investmentContributionCents,
    },
    accountBalances: accountRows.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalanceCents: account.currentBalanceCents,
    })),
    investmentProjection,
  };
}

export async function getMonthlyEvolution(
  months: string[],
  database?: AppDb
) {
  const db = resolveDb(database);
  return Promise.all(months.map((month) => getMonthlyDashboard(month, db)));
}

export async function getCategorySpendingReport(
  competenceMonth: string,
  database?: AppDb
) {
  const db = resolveDb(database);
  const rows = await listTransactions({ competenceMonth }, db);
  const report = new Map<string, { categoryId: string; categoryName: string; amountCents: number }>();

  for (const row of rows) {
    if (row.type !== "expense" || !row.category) {
      continue;
    }

    const current = report.get(row.category.id) ?? {
      categoryId: row.category.id,
      categoryName: row.category.name,
      amountCents: 0,
    };
    current.amountCents += row.amountCents;
    report.set(row.category.id, current);
  }

  return Array.from(report.values()).sort((left, right) => right.amountCents - left.amountCents);
}

export async function compareMonths(
  leftMonth: string,
  rightMonth: string,
  database?: AppDb
) {
  const db = resolveDb(database);
  const [left, right] = await Promise.all([
    getMonthlyDashboard(leftMonth, db),
    getMonthlyDashboard(rightMonth, db),
  ]);

  return { left, right };
}
