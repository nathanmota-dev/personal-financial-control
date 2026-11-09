import type { CutoverAccountPlan, CutoverPaymentWarning, CutoverStraddlingCharge, CutoverTransactionWarning, CutoverWarnings, CutoverWindow } from "@/lib/interfaces/pluggy-cutover";
import { isEffectiveInvestmentWithdrawal } from "@/lib/server/transactions/mutations";
import type { CutoverData } from "./data";
import type { CutoverPlanScope } from "./plan";

type TransactionRow = CutoverData["transactions"][number];

const transactionWarning = (row: TransactionRow): CutoverTransactionWarning => ({ transactionId: row.id, description: row.description, date: row.transactionDate, amountCents: row.amountCents });

function straddlingCharges({ data }: CutoverPlanScope, accounts: CutoverAccountPlan[]): CutoverStraddlingCharge[] {
  const windows = new Map<string, CutoverWindow>(accounts.map((account) => [account.window.accountId, account.window]));
  const removed = new Set(accounts.flatMap((account) => account.chargeIds));
  const paidMonths = new Set(data.bills.filter((bill) => bill.status === "paid").map((bill) => `${bill.accountId}:${bill.invoiceMonth}`));
  return data.charges.filter((charge) => removed.has(charge.id)).flatMap((charge) => {
    const { cutoffMonth } = windows.get(charge.accountId)!;
    const outside = charge.installments.filter((item) => item.invoiceMonth < cutoffMonth).sort((left, right) => left.installmentNumber - right.installmentNumber);
    if (!outside.length) return [];
    return [{
      chargeId: charge.id,
      accountId: charge.accountId,
      description: charge.description,
      purchaseDate: charge.purchaseDate,
      totalAmountCents: charge.totalAmountCents,
      installmentCount: charge.installmentCount,
      firstInvoiceMonth: charge.firstInvoiceMonth,
      outsideInstallments: outside.map((item) => ({ installmentNumber: item.installmentNumber, invoiceMonth: item.invoiceMonth, amountCents: item.amountCents, onPaidBill: paidMonths.has(`${charge.accountId}:${item.invoiceMonth}`) })),
    }];
  });
}

function removedTransactionIds(scope: CutoverPlanScope, accounts: CutoverAccountPlan[]) {
  const managed = accounts.flatMap((account) => account.managedTransactionIds);
  const paired = managed.flatMap((id) => {
    const link = scope.linkByExpense.get(id);
    return link ? [link.withdrawalTransactionId] : [];
  });
  return new Set([...accounts.flatMap((account) => [...account.billPaymentTransactionIds, ...account.ordinaryTransactionIds]), ...managed, ...paired]);
}

function paymentWarnings({ data }: CutoverPlanScope, accounts: CutoverAccountPlan[]) {
  const removedPayments = new Set(accounts.flatMap((account) => account.billPaymentIds));
  const removedBills = new Set(accounts.flatMap((account) => account.billIds));
  const months = new Map(data.bills.map((bill) => [bill.id, bill.invoiceMonth]));
  const view = (payment: CutoverData["payments"][number]): CutoverPaymentWarning => ({ paymentId: payment.id, paymentDate: payment.paymentDate, amountCents: payment.amountCents, invoiceMonth: payment.billId ? months.get(payment.billId) ?? null : null });
  return {
    detachedBillPayments: data.payments.filter((payment) => payment.billId && removedBills.has(payment.billId) && !removedPayments.has(payment.id)).map(view),
    paymentsOnKeptBills: data.payments.filter((payment) => payment.billId && !removedBills.has(payment.billId) && removedPayments.has(payment.id)).map(view),
  };
}

function fundingWarnings(scope: CutoverPlanScope, accounts: CutoverAccountPlan[]) {
  const { data, removable, transactionsById, linkByExpense, inWindow } = scope;
  const managedWithdrawalsKept = data.fundingLinks
    .filter((link) => removable.has(link.withdrawalTransactionId) && !removable.has(link.expenseTransactionId))
    .map((link) => transactionWarning(transactionsById.get(link.withdrawalTransactionId)!));
  const fundingWithdrawalsOutsideWindow = accounts.flatMap((account) => account.managedTransactionIds).flatMap((id) => {
    const link = linkByExpense.get(id);
    const withdrawal = link ? transactionsById.get(link.withdrawalTransactionId) : undefined;
    return withdrawal && !inWindow(withdrawal) ? [transactionWarning(withdrawal)] : [];
  });
  return { managedWithdrawalsKept, fundingWithdrawalsOutsideWindow };
}

function reversalWarnings({ data, transactionsById }: CutoverPlanScope, removed: Set<string>) {
  return data.reductionEvents.flatMap((event) => {
    const transaction = event.transactionId && removed.has(event.transactionId) ? transactionsById.get(event.transactionId) : undefined;
    return transaction && event.status === "active" && isEffectiveInvestmentWithdrawal(transaction)
      ? [{ transactionId: transaction.id, description: transaction.description, date: transaction.transactionDate, amountCents: event.amountCents }]
      : [];
  });
}

function crossingTransfers({ data, windows }: CutoverPlanScope, accounts: CutoverAccountPlan[]) {
  const removed = new Set(accounts.flatMap((account) => account.transferIds));
  const windowsByAccount = new Map(windows.map((window) => [window.accountId, window]));
  const coversDate = (accountId: string, date: string) => {
    const window = windowsByAccount.get(accountId);
    return Boolean(window && date >= window.cutoffDate);
  };
  return data.transfers
    .filter((row) => removed.has(row.id) && !(coversDate(row.fromAccountId, row.transferDate) && coversDate(row.toAccountId, row.transferDate)))
    .map((row) => ({ transferId: row.id, description: row.description, date: row.transferDate, amountCents: row.amountCents }));
}

export function buildCutoverWarnings(scope: CutoverPlanScope, accounts: CutoverAccountPlan[]): CutoverWarnings {
  const removed = removedTransactionIds(scope, accounts);
  return {
    goalAllocations: scope.data.goalAllocations.flatMap((row) => row.transactionId && removed.has(row.transactionId)
      ? [{ allocationId: row.id, goalName: row.goal.name, type: row.type, amountCents: row.amountCents, occurredOn: row.occurredOn, transactionId: row.transactionId }]
      : []),
    investmentReversals: reversalWarnings(scope, removed),
    straddlingCharges: straddlingCharges(scope, accounts),
    transfersCrossingWindow: crossingTransfers(scope, accounts),
    ...paymentWarnings(scope, accounts),
    ...fundingWarnings(scope, accounts),
  };
}
