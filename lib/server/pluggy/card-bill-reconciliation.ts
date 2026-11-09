import type { PluggyCardBillIdentity, PluggyCardBillReconciliation } from "@/lib/interfaces/pluggy-card-bills";

/**
 * statement = current charges + prior balance still unpaid - payments made before closing.
 *
 * The same statement total is what `calculateCreditCardInvoiceSummary` shows as the invoice total.
 * IOF and late fees arrive as card records, so they are already in the current charges and `financeCharges` is never added.
 * `ignoredAmountCents` stores what the imported records hold beyond the statement. The difference stays visible either way.
 */
export function reconcileCardBill(bill: PluggyCardBillIdentity): PluggyCardBillReconciliation {
  const carriedPriorCents = Math.max(0, bill.priorBalanceCents - bill.priorPaidCents);
  const expectedCents = bill.currentChargesCents + carriedPriorCents - bill.preStatementPaymentsCents;
  const differenceCents = bill.statementTotalCents - expectedCents;
  return { carriedPriorCents, expectedCents, differenceCents, ignoredAmountCents: Math.max(0, -differenceCents) };
}
