import type { AppDb } from "@/lib/db";
import type { PluggyApi } from "@/lib/interfaces/pluggy";
import type { CutoverAccountReport, CutoverBalanceRow, CutoverInvoiceRow, CutoverMonthTotals, CutoverReport, CutoverWindow } from "@/lib/interfaces/pluggy-cutover";
import { isPendingCategory } from "@/lib/pending-category";
import { mapCardBills } from "../mappers/card-bill";
import type { CutoverData } from "./data";
import { loadCutoverData, resolveCutoverWindows } from "./data";
import { planFromData } from "./plan";

type BankState = { balances: Map<string, number | null>; invoices: Map<string, Map<string, number>> };
type Category = { name: string; group: string } | null | undefined;

async function readBankState(client: PluggyApi, { items, links }: CutoverData): Promise<BankState> {
  const enabled = links.filter((link) => link.isEnabled);
  const balances = new Map<string, number | null>();
  for (const item of items.filter((row) => enabled.some((link) => link.itemId === row.id))) {
    for (const account of await client.listAccounts(item.externalItemId)) balances.set(account.id, account.balance ?? null);
  }
  const invoices = new Map<string, Map<string, number>>();
  for (const link of enabled.filter((row) => row.kind === "credit")) {
    const month = invoices.get(link.accountId) ?? new Map<string, number>();
    for (const bill of mapCardBills(await client.listBills(link.externalAccountId)).bills) month.set(bill.invoiceMonth, bill.statementTotalCents);
    invoices.set(link.accountId, month);
  }
  return { balances, invoices };
}

function addToGroup(row: CutoverMonthTotals, category: Category, amountCents: number) {
  if (!category || isPendingCategory(category)) row.uncategorizedCents += amountCents;
  else if (category.group === "fixed_expense") row.fixedCents += amountCents;
  else if (category.group === "variable_expense") row.variableCents += amountCents;
}

function monthRow(months: Map<string, CutoverMonthTotals>, month: string) {
  const row = months.get(month) ?? { month, incomeCents: 0, expenseCents: 0, investmentCents: 0, fixedCents: 0, variableCents: 0, uncategorizedCents: 0 };
  months.set(month, row);
  return row;
}

function addTransaction(row: CutoverMonthTotals, transaction: CutoverData["transactions"][number]) {
  if (transaction.type === "income") row.incomeCents += transaction.amountCents;
  else if (transaction.type === "investment_contribution") row.investmentCents += transaction.amountCents;
  else if (transaction.type === "investment_withdrawal") row.investmentCents -= transaction.amountCents;
  else {
    row.expenseCents += transaction.amountCents;
    addToGroup(row, transaction.category, transaction.amountCents);
  }
}

/** Bill payments stay out, as on the dashboard: the purchases are the expense and the payment only settles them. */
function accountMonths(data: CutoverData, window: CutoverWindow, paymentIds: Set<string>) {
  const months = new Map<string, CutoverMonthTotals>();
  for (const transaction of data.transactions) {
    if (transaction.accountId !== window.accountId || transaction.status === "cancelled" || paymentIds.has(transaction.id) || transaction.competenceMonth < window.cutoffMonth) continue;
    addTransaction(monthRow(months, transaction.competenceMonth), transaction);
  }
  for (const charge of data.charges.filter((row) => row.accountId === window.accountId)) {
    for (const installment of charge.installments.filter((item) => item.invoiceMonth >= window.cutoffMonth)) {
      const row = monthRow(months, installment.invoiceMonth);
      row.expenseCents += installment.amountCents;
      addToGroup(row, charge.category, installment.amountCents);
    }
  }
  return [...months.values()].sort((left, right) => left.month.localeCompare(right.month));
}

function invoiceRow(invoiceMonth: string, appTotalCents: number | null, bankTotalCents: number | null, bankAvailable: boolean): CutoverInvoiceRow {
  if (!bankAvailable) return { invoiceMonth, appTotalCents, bankTotalCents: null, differenceCents: null, status: "bank_unavailable" };
  if (appTotalCents === null) return { invoiceMonth, appTotalCents, bankTotalCents, differenceCents: null, status: "missing_in_app" };
  if (bankTotalCents === null) return { invoiceMonth, appTotalCents, bankTotalCents, differenceCents: null, status: "missing_at_bank" };
  const differenceCents = bankTotalCents - appTotalCents;
  return { invoiceMonth, appTotalCents, bankTotalCents, differenceCents, status: differenceCents ? "difference" : "matched" };
}

function accountInvoices(data: CutoverData, window: CutoverWindow, bank: BankState | null) {
  if (window.kind !== "credit") return [];
  const local = new Map(data.bills.filter((bill) => bill.accountId === window.accountId && bill.invoiceMonth >= window.cutoffMonth).map((bill) => [bill.invoiceMonth, bill.statementTotalCents]));
  const remote = new Map([...(bank?.invoices.get(window.accountId) ?? [])].filter(([month]) => month >= window.cutoffMonth));
  return [...new Set([...local.keys(), ...remote.keys()])].sort().map((month) => invoiceRow(month, local.get(month) ?? null, remote.get(month) ?? null, Boolean(bank)));
}

function appBalance({ accounts, transactions, transfers }: CutoverData, accountId: string) {
  const initial = accounts.find((account) => account.id === accountId)?.initialBalanceCents ?? 0;
  const ledger = transactions.filter((row) => row.accountId === accountId && row.status === "posted").reduce((total, row) => total + (row.type === "income" || row.type === "investment_withdrawal" ? row.amountCents : -row.amountCents), 0);
  const moved = transfers.reduce((total, row) => total + (row.toAccountId === accountId ? row.amountCents : 0) - (row.fromAccountId === accountId ? row.amountCents : 0), 0);
  return initial + ledger + moved;
}

function bankBalance(data: CutoverData, window: CutoverWindow, bank: BankState | null) {
  const values = data.links.filter((link) => link.isEnabled && link.accountId === window.accountId).map((link) => bank?.balances.get(link.externalAccountId) ?? null);
  return values.some((value) => value === null) || !values.length ? null : Math.round(values.reduce<number>((total, value) => total + value!, 0) * 100);
}

function accountBalance(data: CutoverData, window: CutoverWindow, bank: BankState | null): CutoverBalanceRow | null {
  if (window.kind !== "bank") return null;
  const appCents = appBalance(data, window.accountId);
  const bankCents = bankBalance(data, window, bank);
  if (bankCents === null) return { appCents, bankCents, differenceCents: null, proposedInitialBalanceCents: null };
  const differenceCents = bankCents - appCents;
  const initial = data.accounts.find((account) => account.id === window.accountId)!.initialBalanceCents;
  return { appCents, bankCents, differenceCents, proposedInitialBalanceCents: differenceCents ? initial + differenceCents : null };
}

function uncategorizedCount(data: CutoverData, window: CutoverWindow, paymentIds: Set<string>) {
  const isOpen = (category: Category) => !category || isPendingCategory(category);
  const transactions = data.transactions.filter((row) => row.accountId === window.accountId && (row.type === "income" || row.type === "expense") && row.status !== "cancelled" && !paymentIds.has(row.id) && row.competenceMonth >= window.cutoffMonth && isOpen(row.category));
  const charges = data.charges.filter((row) => row.accountId === window.accountId && isOpen(row.category) && row.installments.some((item) => item.invoiceMonth >= window.cutoffMonth));
  return transactions.length + charges.length;
}

function accountReport(data: CutoverData, window: CutoverWindow, bank: BankState | null, paymentIds: Set<string>): CutoverAccountReport {
  return {
    accountId: window.accountId,
    accountName: window.accountName,
    kind: window.kind,
    cutoffDate: window.cutoffDate,
    months: accountMonths(data, window, paymentIds),
    invoices: accountInvoices(data, window, bank),
    balance: accountBalance(data, window, bank),
    uncategorizedCount: uncategorizedCount(data, window, paymentIds),
  };
}

/** Without a client, the local side is still reported and every bank comparison says it could not be made. */
export async function buildCutoverReport(db: AppDb, client: PluggyApi | null, label: string): Promise<CutoverReport> {
  const data = await loadCutoverData(db);
  const bank = client ? await readBankState(client, data) : null;
  const paymentIds = new Set(data.payments.map((payment) => payment.transactionId));
  return {
    label,
    bankAvailable: Boolean(bank),
    accounts: resolveCutoverWindows(data).map((window) => accountReport(data, window, bank, paymentIds)),
    plan: planFromData(data),
    importedCharges: data.charges.filter((charge) => charge.importFingerprint?.startsWith("pluggy:")).map((charge) => ({
      accountId: charge.accountId,
      totalAmountCents: charge.totalAmountCents,
      installmentCount: charge.installmentCount,
      firstInvoiceMonth: charge.firstInvoiceMonth,
      installments: charge.installments.map((item) => ({ installmentNumber: item.installmentNumber, amountCents: item.amountCents })),
    })),
    unmatchedBillPayments: data.payments.filter((payment) => !payment.billId || payment.kind === "unlinked").length,
    pendingCardPayments: data.ledger.filter((entry) => entry.outcome === "pending_card_payment").length,
  };
}
