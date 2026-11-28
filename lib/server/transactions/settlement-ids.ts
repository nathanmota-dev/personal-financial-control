import type { FinanceDatabase } from "@/lib/interfaces/database";

/**
 * Transactions that only settle other records: card bill payments and the expense side of an investment funding.
 * With `withdrawals`, the withdrawal that funded the expense is included too.
 */
export async function listSettlementTransactionIds(db: FinanceDatabase, { withdrawals = false } = {}) {
  const [payments, fundings] = await Promise.all([
    db.query.creditCardBillPayments.findMany({ columns: { transactionId: true } }),
    db.query.transactionFundingLinks.findMany({ columns: { expenseTransactionId: true, withdrawalTransactionId: true } }),
  ]);
  return new Set([
    ...payments.map((row) => row.transactionId),
    ...fundings.flatMap((row) => (withdrawals ? [row.expenseTransactionId, row.withdrawalTransactionId] : [row.expenseTransactionId])),
  ]);
}
