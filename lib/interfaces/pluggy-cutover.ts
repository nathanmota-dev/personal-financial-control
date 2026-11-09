import type { PluggyAccountKind } from "./pluggy";

export type CutoverWindow = {
  accountId: string;
  accountName: string;
  kind: PluggyAccountKind;
  /** First day imported from the bank. Bank records on or after it are in the window. */
  cutoffDate: string;
  /** First invoice month in the window, because card records belong to invoices and not to days. */
  cutoffMonth: string;
};

export type CutoverTableCounts = {
  recurring_templates_paused: number;
  credit_card_bill_payments: number;
  credit_card_bills: number;
  credit_card_charges: number;
  credit_card_installments: number;
  transactions: number;
  transaction_funding_links: number;
  transfers: number;
  investment_reduction_events_reversed: number;
  financial_goal_allocations_unlinked: number;
};

export type CutoverAccountPlan = {
  window: CutoverWindow;
  templateIds: string[];
  billPaymentIds: string[];
  billPaymentTransactionIds: string[];
  billIds: string[];
  chargeIds: string[];
  /** Plain rows, removed in bulk because deleting them has no side effect. */
  ordinaryTransactionIds: string[];
  /** Rows that need the service: effective withdrawals and the expense side of funding pairs. */
  managedTransactionIds: string[];
  transferIds: string[];
  counts: CutoverTableCounts;
};

export type CutoverGoalAllocationWarning = { allocationId: string; goalName: string; type: string; amountCents: number; occurredOn: string; transactionId: string };
export type CutoverReversalWarning = { transactionId: string; description: string; date: string; amountCents: number };
export type CutoverOutsideInstallment = { installmentNumber: number; invoiceMonth: string; amountCents: number; onPaidBill: boolean };
export type CutoverStraddlingCharge = { chargeId: string; accountId: string; description: string; purchaseDate: string; totalAmountCents: number; installmentCount: number; firstInvoiceMonth: string; outsideInstallments: CutoverOutsideInstallment[] };
export type CutoverTransferWarning = { transferId: string; description: string; date: string; amountCents: number };
export type CutoverPaymentWarning = { paymentId: string; paymentDate: string; amountCents: number; invoiceMonth: string | null };
export type CutoverTransactionWarning = { transactionId: string; description: string; date: string; amountCents: number };

export type CutoverWarnings = {
  goalAllocations: CutoverGoalAllocationWarning[];
  investmentReversals: CutoverReversalWarning[];
  straddlingCharges: CutoverStraddlingCharge[];
  /** Transfers removed from one account's window whose other side is unlinked or starts later. */
  transfersCrossingWindow: CutoverTransferWarning[];
  /** Payments that stay because their transaction is outside the window, while their bill is removed. */
  detachedBillPayments: CutoverPaymentWarning[];
  /** Payments removed from a bill that stays, which may still be marked as paid. */
  paymentsOnKeptBills: CutoverPaymentWarning[];
  /** Managed withdrawals in the window that stay because their expense stays. */
  managedWithdrawalsKept: CutoverTransactionWarning[];
  /** Withdrawals outside any window that are removed along with their expense. */
  fundingWithdrawalsOutsideWindow: CutoverTransactionWarning[];
};

export type CutoverPreservedCounts = { transactions: number; charges: number; transfers: number; bills: number };

export type CutoverPlan = {
  accounts: CutoverAccountPlan[];
  totals: CutoverTableCounts;
  warnings: CutoverWarnings;
  /** Bank records in the window. The import ledger remembers them, so removing one would lose it for good. */
  preserved: CutoverPreservedCounts;
};

export type CutoverMonthTotals = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
  fixedCents: number;
  variableCents: number;
  uncategorizedCents: number;
};

export type CutoverInvoiceStatus = "matched" | "difference" | "missing_in_app" | "missing_at_bank" | "bank_unavailable";
export type CutoverInvoiceRow = { invoiceMonth: string; appTotalCents: number | null; bankTotalCents: number | null; differenceCents: number | null; status: CutoverInvoiceStatus };

export type CutoverBalanceRow = {
  appCents: number;
  bankCents: number | null;
  differenceCents: number | null;
  /** Only a proposal. It is applied by the `adjust` command, after confirmation. */
  proposedInitialBalanceCents: number | null;
};

export type CutoverAccountReport = {
  accountId: string;
  accountName: string;
  kind: PluggyAccountKind;
  cutoffDate: string;
  months: CutoverMonthTotals[];
  invoices: CutoverInvoiceRow[];
  balance: CutoverBalanceRow | null;
  uncategorizedCount: number;
};

export type CutoverImportedCharge = { accountId: string; totalAmountCents: number; installmentCount: number; firstInvoiceMonth: string; installments: { installmentNumber: number; amountCents: number }[] };

export type CutoverReport = {
  label: string;
  bankAvailable: boolean;
  accounts: CutoverAccountReport[];
  plan: CutoverPlan;
  importedCharges: CutoverImportedCharge[];
  unmatchedBillPayments: number;
  pendingCardPayments: number;
};

export type CutoverMonthComparison = { month: string; before: CutoverMonthTotals | null; after: CutoverMonthTotals | null };

export type CutoverInstallmentChange = { accountId: string; description: string; installmentNumber: number; invoiceMonth: string; beforeCents: number; afterCents: number | null };

export type CutoverAccountComparison = {
  accountName: string;
  cutoffDate: string;
  months: CutoverMonthComparison[];
  invoices: CutoverInvoiceRow[];
  balance: CutoverBalanceRow | null;
  uncategorizedCount: number;
};

export type CutoverComparison = {
  accounts: CutoverAccountComparison[];
  changedInstallments: CutoverInstallmentChange[];
  unmatchedBillPayments: number;
  pendingCardPayments: number;
};

export type CutoverCommand =
  | { command: "clean"; apply: boolean; confirmTarget?: string }
  | { command: "report"; label: string }
  | { command: "compare"; before: string; after: string }
  | { command: "adjust"; accountId: string; initialBalanceCents: number; apply: boolean; confirmTarget?: string };

export type CutoverCliIo = {
  log(message: string): void;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
};
