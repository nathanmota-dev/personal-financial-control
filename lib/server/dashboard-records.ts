import { eq, inArray } from "drizzle-orm";
import type { AppDb } from "@/lib/db";
import { accounts, creditCardBills, creditCardInstallments, transactions } from "@/lib/db/schema";
import { buildDashboardCard, DASHBOARD_CARD_INVOICE_COUNT, shiftMonth } from "@/lib/dashboard-cards";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { DashboardAccountBalance, DashboardExpense } from "@/lib/interfaces/dashboard";
import type { DashboardCardsData } from "@/lib/interfaces/dashboard-cards";
import { serializeTimestamps } from "@/lib/server/finance";

export async function readDashboardRecords(months: string[], db: AppDb) {
  const [rows, installments, payments] = await Promise.all([
    db.query.transactions.findMany({
      where: inArray(transactions.competenceMonth, months),
      with: { category: true, account: true },
    }),
    db.query.creditCardInstallments.findMany({
      where: inArray(creditCardInstallments.invoiceMonth, months),
      with: { charge: { with: { category: true, account: true } } },
    }),
    db.query.creditCardBillPayments.findMany({ columns: { transactionId: true } }),
  ]);
  const paymentIds = new Set(payments.map((payment) => payment.transactionId));
  const activeTransactions = rows.filter((row) => row.status !== "cancelled" && !paymentIds.has(row.id));
  const expenses: DashboardExpense[] = activeTransactions.filter((row) => row.type === "expense").map((row) => ({
    id: row.id, amountCents: row.amountCents, description: row.description,
    expenseDate: row.transactionDate, competenceMonth: row.competenceMonth,
    category: row.category ? serializeTimestamps(row.category) : null,
    account: row.account ? serializeTimestamps(row.account) : null,
  }));
  for (const row of installments) {
    expenses.push({
      id: row.id, amountCents: row.amountCents, description: row.charge.description,
      expenseDate: row.charge.purchaseDate, competenceMonth: row.invoiceMonth,
      category: row.charge.category ? serializeTimestamps(row.charge.category) : null,
      account: row.charge.account ? serializeTimestamps(row.charge.account) : null,
    });
  }
  return { activeTransactions, expenses, installments };
}

export function readDashboardAccounts(db: AppDb) {
  return db.query.accounts.findMany({ where: eq(accounts.isArchived, false), orderBy: (table, { asc }) => [asc(table.name)] });
}

export async function readDashboardBalances(month: string, expenses: DashboardExpense[], db: AppDb, accountRows?: Awaited<ReturnType<typeof readDashboardAccounts>>): Promise<DashboardAccountBalance[]> {
  const [rows, ledger, transfers, bills] = await Promise.all([
    accountRows ?? readDashboardAccounts(db),
    db.query.transactions.findMany({ where: eq(transactions.status, "posted") }),
    db.query.transfers.findMany(),
    db.query.creditCardBills.findMany({ where: eq(creditCardBills.invoiceMonth, month) }),
  ]);
  const balances = new Map(rows.map((account) => [account.id, account.initialBalanceCents]));
  for (const entry of ledger) {
    const sign = entry.type === "income" || entry.type === "investment_withdrawal" ? 1 : -1;
    balances.set(entry.accountId, (balances.get(entry.accountId) ?? 0) + sign * entry.amountCents);
  }
  for (const transfer of transfers) {
    balances.set(transfer.fromAccountId, (balances.get(transfer.fromAccountId) ?? 0) - transfer.amountCents);
    balances.set(transfer.toAccountId, (balances.get(transfer.toAccountId) ?? 0) + transfer.amountCents);
  }
  const invoiceTotals = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.account?.type === "credit") invoiceTotals.set(expense.account.id, (invoiceTotals.get(expense.account.id) ?? 0) + expense.amountCents);
  }
  const billsByAccount = new Map(bills.map((bill) => [bill.accountId, bill.statementTotalCents]));
  return rows.map((account) => ({
    id: account.id, name: account.name, type: account.type,
    currentBalanceCents: account.type === "credit" ? billsByAccount.get(account.id) ?? invoiceTotals.get(account.id) ?? 0 : balances.get(account.id) ?? 0,
    metricLabel: account.type === "credit" ? `Fatura de ${formatMonthLabel(month)}` : "Saldo atual",
  }));
}

/** Cards reuse the batched records; only the bills of the visible invoices are read. */
export async function readDashboardCards(month: string, expenses: DashboardExpense[], accountRows: Awaited<ReturnType<typeof readDashboardAccounts>>, db: AppDb): Promise<DashboardCardsData> {
  const months = Array.from({ length: DASHBOARD_CARD_INVOICE_COUNT }, (_, index) => shiftMonth(month, index));
  const bills = await db.query.creditCardBills.findMany({ where: inArray(creditCardBills.invoiceMonth, months) });
  const totals = new Map<string, Map<string, number>>();
  for (const expense of expenses) {
    if (expense.account?.type !== "credit") continue;
    const byMonth = totals.get(expense.account.id) ?? new Map<string, number>();
    byMonth.set(expense.competenceMonth, (byMonth.get(expense.competenceMonth) ?? 0) + expense.amountCents);
    totals.set(expense.account.id, byMonth);
  }
  return accountRows.filter((account) => account.type === "credit").map((account) => buildDashboardCard({
    account, month,
    totalsByMonth: totals.get(account.id) ?? new Map(),
    billRows: bills.filter((bill) => bill.accountId === account.id),
  }));
}
