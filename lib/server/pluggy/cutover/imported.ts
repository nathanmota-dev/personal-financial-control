import { isPluggyImported } from "../category-rules";
import type { CutoverData } from "./data";

export type CutoverImportedRecords = {
  transactions: Set<string>;
  charges: Set<string>;
  transfers: Set<string>;
  bills: Set<string>;
  billPayments: Set<string>;
};

function ledgerIds(ledger: CutoverData["ledger"], table: string) {
  return ledger.flatMap((entry) => entry.localTable === table && entry.localId ? [entry.localId] : []);
}

/**
 * Records the sync already owns. The ledger keeps a deleted record deleted, so removing one of these would lose it,
 * and skipping them also makes running the cleanup again after a sync a no-op.
 */
export function findImportedRecords({ ledger, transactions, charges, payments }: CutoverData): CutoverImportedRecords {
  const chargeIds = new Set([...ledgerIds(ledger, "credit_card_charges"), ...charges.filter((row) => isPluggyImported(row.importFingerprint)).map((row) => row.id)]);
  const billPayments = new Set([...ledgerIds(ledger, "credit_card_bill_payments"), ...payments.filter((row) => isPluggyImported(row.idempotencyKey)).map((row) => row.id)]);
  const keptPayments = payments.filter((row) => billPayments.has(row.id));
  return {
    transactions: new Set([...ledgerIds(ledger, "transactions"), ...transactions.filter((row) => isPluggyImported(row.importFingerprint)).map((row) => row.id), ...keptPayments.map((row) => row.transactionId)]),
    charges: chargeIds,
    transfers: new Set(ledgerIds(ledger, "transfers")),
    bills: new Set([...ledgerIds(ledger, "credit_card_bills"), ...keptPayments.flatMap((row) => row.billId ? [row.billId] : [])]),
    billPayments,
  };
}

/** A bill carries no import marker, so a month holding imported purchases is what shows the bank already wrote it. */
export function importedChargeMonths({ charges }: CutoverData, imported: CutoverImportedRecords) {
  return new Set(charges.filter((charge) => imported.charges.has(charge.id)).flatMap((charge) => charge.installments.map((installment) => `${charge.accountId}:${installment.invoiceMonth}`)));
}
