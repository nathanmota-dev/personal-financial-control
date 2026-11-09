import type { PluggyLinkRecord } from "@/lib/interfaces/pluggy";

/** One entry of a bill's `payments`. The flags keep each entry paired with at most one record per side. */
/** `excess` marks money paid beyond this bill, which belongs to the next statement. */
export type PluggyBillPaymentEntry = { amountCents: number; date: string; claimed: boolean; mirrored: boolean; excess: boolean };

export type PluggyMappedCardBill = {
  invoiceMonth: string;
  dueDate: string;
  closingDate: string | null;
  statementTotalCents: number;
  priorBalanceCents: number;
  /** What was paid on the previous bill after it closed. */
  priorPaidCents: number;
  preStatementPaymentsCents: number;
  payments: PluggyBillPaymentEntry[];
};

/** `amountCents` is null when the bank sent no total, which leaves nothing to show the user beyond the count. */
export type PluggySkippedCardBill = { invoiceMonth: string; dueDate: string; amountCents: number | null };
export type PluggyMappedCardBills = { bills: PluggyMappedCardBill[]; skipped: PluggySkippedCardBill[] };

export type PluggyCardBillIdentity = {
  statementTotalCents: number;
  currentChargesCents: number;
  priorBalanceCents: number;
  priorPaidCents: number;
  preStatementPaymentsCents: number;
};

export type PluggyCardBillReconciliation = {
  carriedPriorCents: number;
  expectedCents: number;
  /** Positive when the statement is higher than the imported records explain. */
  differenceCents: number;
  ignoredAmountCents: number;
};

/** A bill of this run. `billId` is null only on a dry run, where a new bill is not written. */
export type PluggyCardBillTarget = PluggyMappedCardBill & {
  link: PluggyLinkRecord;
  billId: string | null;
  paid: boolean;
  settledCents: number;
  importedCents: number;
  differenceCents: number;
};

export type PluggyBillPaymentSubject = { amountCents: number; date: string };

export type PluggyBillPaymentMatch =
  | { outcome: "matched"; target: PluggyCardBillTarget; entry: PluggyBillPaymentEntry | null }
  | { outcome: "ambiguous" }
  | { outcome: "none" };

export type PluggyLocalBillPayment = {
  id: string;
  billId: string | null;
  amountCents: number;
  paymentDate: string;
  accountId: string;
  idempotencyKey: string;
  claimed: boolean;
};

/** Shared by the three bill steps of a run, so a dry run plans from memory what a real run reads back. */
export type CardBillRunState = {
  creditLinks: PluggyLinkRecord[];
  targets: Map<string, PluggyCardBillTarget[]>;
  processedBankLinks: Set<string>;
  localPayments: PluggyLocalBillPayment[];
};
