import { eq } from "drizzle-orm";

import { pluggyImportLedger } from "@/lib/db/schema";
import type { BankImportLedgerEntry } from "@/lib/interfaces/pluggy-bank-import";
import type { CardImportScope, PluggyCardCharge, PluggyCardLockSubject, PluggyCardPurchase } from "@/lib/interfaces/pluggy-card-import";
import { DomainError } from "@/lib/server/errors";
import { updateCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { assertChargeCanMutate } from "@/lib/server/credit-card/queries";
import { ledgerValues, bump } from "../bank-import/scope";

export type ChargePatch = Partial<Pick<PluggyCardCharge, "notes" | "purchaseDate" | "totalAmountCents" | "firstInvoiceMonth" | "importFingerprint">>;

function flag(scope: CardImportScope, subject: PluggyCardLockSubject, reason: CardImportScope["attention"][number]["reason"], amountCents: number) {
  scope.attention.push({ reason, accountLabel: scope.link.remoteName, description: subject.description, date: subject.purchaseDate, amountCents });
}

export function reportResidual(scope: CardImportScope, purchase: PluggyCardPurchase) {
  if (!purchase.residualCents) return;
  bump(scope, "cardResidual");
  flag(scope, purchase, "card_total_residual", purchase.residualCents);
}

/** Read directly because a dry run must plan the same no-op as a real run. */
export async function chargeIsLocked(scope: CardImportScope, subject: PluggyCardLockSubject, chargeId: string) {
  try {
    await assertChargeCanMutate(chargeId, scope.context.db);
    return false;
  } catch (error) {
    if (!(error instanceof DomainError) || error.code !== "CREDIT_CARD_CHARGE_BILL_PAID") throw error;
    bump(scope, "cardLocked");
    flag(scope, subject, "card_locked_by_paid_bill", subject.totalCents);
    return true;
  }
}

/** Always sends the invoice month, because the service would otherwise derive it from a changed purchase date. */
export async function patchCharge(scope: CardImportScope, charge: PluggyCardCharge, patch: ChargePatch) {
  await scope.context.write((db) => updateCreditCardCharge({ id: charge.id, firstInvoiceMonth: charge.firstInvoiceMonth, ...patch, notes: patch.notes === undefined ? charge.notes : patch.notes, importFingerprint: patch.importFingerprint ?? charge.importFingerprint ?? undefined }, db));
  Object.assign(charge, patch);
}

export async function setLedger(scope: CardImportScope, fingerprint: string, next: BankImportLedgerEntry) {
  const { context, run } = scope;
  const stored = run.ledger.has(fingerprint);
  await context.write((db) => stored
    ? db.update(pluggyImportLedger).set({ ...next, lastSeenAt: context.now, updatedAt: context.now }).where(eq(pluggyImportLedger.fingerprint, fingerprint))
    : db.insert(pluggyImportLedger).values(ledgerValues(next, context.now)));
  run.ledger.delete(fingerprint);
  run.ledger.set(next.fingerprint, next);
}

export function chargeLedgerEntry(fingerprint: string, chargeId: string | null, status: PluggyCardPurchase["status"]): BankImportLedgerEntry {
  return { fingerprint, outcome: status === "pending" ? "pending_card_charge" : "created", localTable: "credit_card_charges", localId: chargeId };
}
