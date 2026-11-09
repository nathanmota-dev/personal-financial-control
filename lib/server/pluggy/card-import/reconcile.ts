import type { BankImportLedgerEntry } from "@/lib/interfaces/pluggy-bank-import";
import type { CardImportScope, PluggyCardCharge, PluggyCardPurchase } from "@/lib/interfaces/pluggy-card-import";
import { deleteCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { bump, closestByDate, dayDistance } from "../bank-import/scope";
import { chargeIsLocked, chargeLedgerEntry, patchCharge, reportResidual, setLedger } from "./charge-writes";

const PENDING_MATCH_WINDOW_DAYS = 3;

export function provisionalCharges(charges: Iterable<PluggyCardCharge>, ledger: ReadonlyMap<string, BankImportLedgerEntry>) {
  return [...charges].filter((charge) => charge.importFingerprint && ledger.get(charge.importFingerprint)?.outcome === "pending_card_charge");
}

/** Installments of a pending purchase can be rounded differently once posted, by less than one cent each. */
function sameAmount(charge: PluggyCardCharge, purchase: PluggyCardPurchase) {
  return Math.abs(charge.totalAmountCents - purchase.totalCents) < purchase.installmentCount;
}

/** Pluggy can delete a pending record and recreate it posted under a new id, which must not duplicate the charge. */
export async function adoptReplacedCharge(scope: CardImportScope, purchase: PluggyCardPurchase) {
  const { provisional, claimed, remoteFingerprints, charges } = scope;
  const candidates = provisional.filter((charge) =>
    !claimed.has(charge.id) && !remoteFingerprints.has(charge.importFingerprint!) && charge.kind === purchase.kind && charge.installmentCount === purchase.installmentCount
    && sameAmount(charge, purchase) && dayDistance(charge.purchaseDate, purchase.purchaseDate) <= PENDING_MATCH_WINDOW_DAYS);
  const charge = closestByDate(candidates, purchase.purchaseDate, (candidate) => candidate.purchaseDate);
  if (!charge) return false;
  claimed.add(charge.id);
  if (await chargeIsLocked(scope, purchase, charge.id)) return true;
  const previous = charge.importFingerprint!;
  await patchCharge(scope, charge, { importFingerprint: purchase.fingerprint, firstInvoiceMonth: purchase.firstInvoiceMonth, purchaseDate: purchase.purchaseDate, totalAmountCents: purchase.totalCents });
  await setLedger(scope, previous, chargeLedgerEntry(purchase.fingerprint, charge.id, "posted"));
  charges.delete(previous);
  charges.set(purchase.fingerprint, charge);
  bump(scope, "cardUpdated");
  reportResidual(scope, purchase);
  return true;
}

/** Charges have no cancelled status, so a pending purchase the bank dropped is deleted and recreated if it returns. */
export async function cancelMissingCharges(scope: CardImportScope) {
  const { provisional, claimed, remoteFingerprints, run, link, context, charges } = scope;
  for (const charge of provisional) {
    const fingerprint = charge.importFingerprint!;
    const entry = run.ledger.get(fingerprint);
    if (claimed.has(charge.id) || remoteFingerprints.has(fingerprint) || entry?.outcome !== "pending_card_charge" || charge.purchaseDate < link.cutoffDate) continue;
    if (await chargeIsLocked(scope, { description: charge.description, purchaseDate: charge.purchaseDate, totalCents: charge.totalAmountCents }, charge.id)) continue;
    await context.write((db) => deleteCreditCardCharge(charge.id, db));
    await setLedger(scope, fingerprint, { ...entry, outcome: "cancelled", localId: null });
    charges.delete(fingerprint);
    bump(scope, "cardCancelled");
  }
}
