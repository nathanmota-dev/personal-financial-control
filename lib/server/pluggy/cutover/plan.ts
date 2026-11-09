import type { AppDb } from "@/lib/db";
import type { CutoverAccountPlan, CutoverPlan, CutoverTableCounts, CutoverWindow } from "@/lib/interfaces/pluggy-cutover";
import { isEffectiveInvestmentWithdrawal } from "@/lib/server/transactions/mutations";
import type { CutoverData } from "./data";
import { loadCutoverData, resolveCutoverWindows } from "./data";
import { findImportedRecords, importedChargeMonths } from "./imported";
import { buildCutoverWarnings } from "./warnings";

type TransactionRow = CutoverData["transactions"][number];

export type CutoverPlanScope = ReturnType<typeof createPlanScope>;

function emptyCounts(): CutoverTableCounts {
  return { recurring_templates_paused: 0, credit_card_bill_payments: 0, credit_card_bills: 0, credit_card_charges: 0, credit_card_installments: 0, transactions: 0, transaction_funding_links: 0, transfers: 0, investment_reduction_events_reversed: 0, financial_goal_allocations_unlinked: 0 };
}

/** Each transfer has one owner, so a transfer inside the window of both accounts is counted and removed once. */
function assignTransfers(data: CutoverData, windows: Map<string, CutoverWindow>, imported: Set<string>) {
  const owners = new Map<string, CutoverData["transfers"]>();
  for (const transfer of data.transfers.filter((row) => !imported.has(row.id))) {
    const owner = [windows.get(transfer.fromAccountId), windows.get(transfer.toAccountId)].find((window) => window && transfer.transferDate >= window.cutoffDate);
    if (owner) owners.set(owner.accountId, [...(owners.get(owner.accountId) ?? []), transfer]);
  }
  return owners;
}

function createPlanScope(data: CutoverData, windows: CutoverWindow[]) {
  const windowsByAccount = new Map(windows.map((window) => [window.accountId, window]));
  const imported = findImportedRecords(data);
  const paymentTransactionIds = new Set(data.payments.map((payment) => payment.transactionId));
  const inWindow = (row: TransactionRow) => {
    const window = windowsByAccount.get(row.accountId);
    return Boolean(window && row.transactionDate >= window.cutoffDate);
  };
  const removable = new Set(data.transactions.filter((row) => inWindow(row) && !imported.transactions.has(row.id) && !paymentTransactionIds.has(row.id)).map((row) => row.id));
  return {
    data,
    windows,
    imported,
    inWindow,
    removable,
    importedMonths: importedChargeMonths(data, imported),
    transactionsById: new Map(data.transactions.map((row) => [row.id, row])),
    linkByExpense: new Map(data.fundingLinks.map((link) => [link.expenseTransactionId, link])),
    linkByWithdrawal: new Map(data.fundingLinks.map((link) => [link.withdrawalTransactionId, link])),
    transferOwners: assignTransfers(data, windowsByAccount, imported.transfers),
  };
}

function planBillPayments(scope: CutoverPlanScope, window: CutoverWindow) {
  const { data, imported, transactionsById } = scope;
  const payments = data.payments.filter((payment) => {
    const transaction = transactionsById.get(payment.transactionId);
    return transaction?.accountId === window.accountId && transaction.transactionDate >= window.cutoffDate && !imported.billPayments.has(payment.id);
  });
  return { billPaymentIds: payments.map((row) => row.id), billPaymentTransactionIds: payments.map((row) => row.transactionId) };
}

function planCard(scope: CutoverPlanScope, window: CutoverWindow) {
  if (window.kind !== "credit") return { billIds: [], charges: [] };
  const { data, imported, importedMonths } = scope;
  const billIds = data.bills
    .filter((bill) => bill.accountId === window.accountId && bill.invoiceMonth >= window.cutoffMonth && !imported.bills.has(bill.id) && !importedMonths.has(`${bill.accountId}:${bill.invoiceMonth}`))
    .map((bill) => bill.id);
  // Any installment in the window removes the whole charge, because the sync imports it whole and would duplicate it.
  const charges = data.charges.filter((charge) => charge.accountId === window.accountId && !imported.charges.has(charge.id) && charge.installments.some((installment) => installment.invoiceMonth >= window.cutoffMonth));
  return { billIds, charges };
}

function planTransactions(scope: CutoverPlanScope, window: CutoverWindow) {
  const ordinary: string[] = [];
  const managed: string[] = [];
  const paired: TransactionRow[] = [];
  for (const row of scope.data.transactions.filter((item) => item.accountId === window.accountId && scope.removable.has(item.id))) {
    // The withdrawal side is managed by its expense, and deleting it directly raises MANAGED_TRANSACTION.
    if (scope.linkByWithdrawal.has(row.id)) continue;
    const link = scope.linkByExpense.get(row.id);
    if (link) {
      managed.push(row.id);
      paired.push(scope.transactionsById.get(link.withdrawalTransactionId)!);
    } else if (isEffectiveInvestmentWithdrawal(row)) {
      managed.push(row.id);
    } else {
      ordinary.push(row.id);
    }
  }
  return { ordinary, managed, paired };
}

function reversedEvents(scope: CutoverPlanScope, managed: string[], paired: TransactionRow[]) {
  const effective = new Set([...managed.flatMap((id) => {
    const row = scope.transactionsById.get(id)!;
    return isEffectiveInvestmentWithdrawal(row) ? [id] : [];
  }), ...paired.filter(isEffectiveInvestmentWithdrawal).map((row) => row.id)]);
  return scope.data.reductionEvents.filter((event) => event.status === "active" && event.transactionId && effective.has(event.transactionId));
}

function planAccount(scope: CutoverPlanScope, window: CutoverWindow): CutoverAccountPlan {
  const { data } = scope;
  const templateIds = data.templates.filter((row) => row.accountId === window.accountId && row.status === "active" && (!row.endMonth || row.endMonth >= window.cutoffMonth)).map((row) => row.id);
  const payments = planBillPayments(scope, window);
  const { billIds, charges } = planCard(scope, window);
  const { ordinary, managed, paired } = planTransactions(scope, window);
  const transfers = scope.transferOwners.get(window.accountId) ?? [];
  const removedIds = new Set([...payments.billPaymentTransactionIds, ...ordinary, ...managed, ...paired.map((row) => row.id)]);
  return {
    window,
    templateIds,
    ...payments,
    billIds,
    chargeIds: charges.map((row) => row.id),
    ordinaryTransactionIds: ordinary,
    managedTransactionIds: managed,
    transferIds: transfers.map((row) => row.id),
    counts: {
      recurring_templates_paused: templateIds.length,
      credit_card_bill_payments: payments.billPaymentIds.length,
      credit_card_bills: billIds.length,
      credit_card_charges: charges.length,
      credit_card_installments: charges.reduce((total, charge) => total + charge.installments.length, 0),
      transactions: removedIds.size,
      transaction_funding_links: paired.length,
      transfers: transfers.length,
      investment_reduction_events_reversed: reversedEvents(scope, managed, paired).length,
      financial_goal_allocations_unlinked: data.goalAllocations.filter((row) => row.transactionId && removedIds.has(row.transactionId)).length,
    },
  };
}

function sumCounts(accounts: CutoverAccountPlan[]) {
  const totals = emptyCounts();
  for (const { counts } of accounts) for (const key of Object.keys(totals) as (keyof CutoverTableCounts)[]) totals[key] += counts[key];
  return totals;
}

function countPreserved({ data, imported, inWindow, windows }: CutoverPlanScope) {
  const windowsByAccount = new Map(windows.map((window) => [window.accountId, window]));
  const inMonthWindow = (accountId: string, month: string) => {
    const window = windowsByAccount.get(accountId);
    return Boolean(window && month >= window.cutoffMonth);
  };
  return {
    transactions: data.transactions.filter((row) => inWindow(row) && imported.transactions.has(row.id)).length,
    charges: data.charges.filter((row) => imported.charges.has(row.id) && row.installments.some((item) => inMonthWindow(row.accountId, item.invoiceMonth))).length,
    transfers: data.transfers.filter((row) => imported.transfers.has(row.id)).length,
    bills: data.bills.filter((row) => imported.bills.has(row.id) && inMonthWindow(row.accountId, row.invoiceMonth)).length,
  };
}

export function planFromData(data: CutoverData): CutoverPlan {
  const scope = createPlanScope(data, resolveCutoverWindows(data));
  const accounts = scope.windows.map((window) => planAccount(scope, window));
  return { accounts, totals: sumCounts(accounts), warnings: buildCutoverWarnings(scope, accounts), preserved: countPreserved(scope) };
}

/** Only reads. Every write goes through `applyCutoverPlan`. */
export async function buildCutoverPlan(db: AppDb) {
  return planFromData(await loadCutoverData(db));
}
