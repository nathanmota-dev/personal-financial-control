import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { listCreditCardExpenseEntries } from "@/lib/server/credit-card";
import { getInvestmentProjection } from "@/lib/server/investments";
import { listAccounts } from "@/lib/server/accounts";
import { listTransactions } from "@/lib/server/transactions";
import { normalizeCompetenceMonth } from "@/lib/server/finance";

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

function buildExpenseEntries(
  transactions: Awaited<ReturnType<typeof listTransactions>>,
  creditCardExpenses: Awaited<ReturnType<typeof listCreditCardExpenseEntries>>
) {
  const nonCreditTransactions = transactions
    .filter(
      (row) =>
        row.type === "expense" &&
        row.status !== "cancelled" &&
        row.account?.type !== "credit"
    )
    .map((row) => ({
      id: row.id,
      amountCents: row.amountCents,
      description: row.description,
      expenseDate: row.transactionDate,
      category: row.category,
      account: row.account,
    }));

  const creditEntries = creditCardExpenses.map((row) => ({
    id: row.id,
    amountCents: row.amountCents,
    description: row.description,
    expenseDate: row.expenseDate,
    category: row.category,
    account: row.account,
  }));

  return [...nonCreditTransactions, ...creditEntries].sort((left, right) => {
    return (
      right.expenseDate.localeCompare(left.expenseDate) ||
      right.amountCents - left.amountCents ||
      left.description.localeCompare(right.description)
    );
  });
}

export async function getMonthlyDashboard(month: string, database?: AppDb) {
  const db = resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);
  const [transactionRows, accountRows, investmentProjection, creditCardExpenses] = await Promise.all([
    listTransactions({ competenceMonth }, db),
    listAccounts(undefined, db),
    getInvestmentProjection(db),
    listCreditCardExpenseEntries(competenceMonth, db),
  ]);

  const activeTransactions = transactionRows.filter((row) => row.status !== "cancelled");
  const expenseEntries = buildExpenseEntries(transactionRows, creditCardExpenses);
  const invoiceTotalsByAccountId = creditCardExpenses.reduce<Map<string, number>>((accumulator, entry) => {
    if (!entry.account?.id) {
      return accumulator;
    }

    accumulator.set(
      entry.account.id,
      (accumulator.get(entry.account.id) ?? 0) + entry.amountCents
    );
    return accumulator;
  }, new Map());

  const incomeCents = activeTransactions
    .filter((row) => row.type === "income")
    .reduce((total, row) => total + row.amountCents, 0);
  const fixedExpenseCents = expenseEntries
    .filter((row) => row.category?.group === "fixed_expense")
    .reduce((total, row) => total + row.amountCents, 0);
  const variableExpenseCents = expenseEntries
    .filter((row) => row.category?.group === "variable_expense")
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
      currentBalanceCents:
        account.type === "credit"
          ? (invoiceTotalsByAccountId.get(account.id) ?? 0)
          : account.currentBalanceCents,
      metricLabel: account.type === "credit" ? "Fatura do mês" : "Saldo atual",
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
  const [rows, creditCardExpenses] = await Promise.all([
    listTransactions({ competenceMonth }, db),
    listCreditCardExpenseEntries(competenceMonth, db),
  ]);
  const expenseEntries = buildExpenseEntries(rows, creditCardExpenses);
  const report = new Map<string, { categoryId: string; categoryName: string; amountCents: number }>();

  for (const row of expenseEntries) {
    if (!row.category) {
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

export async function getMonthlyExpenseFeed(
  competenceMonth: string,
  database?: AppDb
) {
  const db = resolveDb(database);
  const [rows, creditCardExpenses] = await Promise.all([
    listTransactions({ competenceMonth }, db),
    listCreditCardExpenseEntries(competenceMonth, db),
  ]);

  return buildExpenseEntries(rows, creditCardExpenses);
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
