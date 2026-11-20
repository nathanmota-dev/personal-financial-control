import type { creditCardCharges } from "@/lib/db/schema";
import type { createCreditCardChargeSchema } from "./validation";
import type { z } from "zod";

type ChargeRow = typeof creditCardCharges.$inferSelect;
type ChargeValues = z.infer<typeof createCreditCardChargeSchema>;

/** Forms send an empty note where the stored one is null; both mean "no note". */
const sameNotes = (left: string | null | undefined, right: string | null | undefined) => (left || null) === (right || null);

/**
 * Stored installments may follow the bank's own amounts and months, so they are rebuilt
 * only when the total, the count or the first invoice month actually changes.
 */
export function keepsInstallmentSchedule(existing: ChargeRow, values: ChargeValues, firstInvoiceMonth: string) {
  return values.totalAmountCents === existing.totalAmountCents
    && values.installmentCount === existing.installmentCount
    && firstInvoiceMonth === existing.firstInvoiceMonth;
}

/** A paid bill locks what was charged, not how a purchase is classified, so a category-only change skips that lock. */
export function changesOnlyCategory(existing: ChargeRow, values: ChargeValues, firstInvoiceMonth: string) {
  return keepsInstallmentSchedule(existing, values, firstInvoiceMonth)
    && values.accountId === existing.accountId
    && values.description === existing.description
    && sameNotes(values.notes, existing.notes)
    && values.purchaseDate === existing.purchaseDate
    && values.kind === existing.kind
    && (values.importFingerprint ?? null) === (existing.importFingerprint ?? null);
}
