import type { CardImportScope, PluggyCardCharge, PluggyCardMatch, PluggyCardPurchase, PluggyCardRow } from "@/lib/interfaces/pluggy-card-import";
import { createCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { bump } from "../bank-import/scope";
import { resolveCardCategoryId } from "../category-rules";
import { APPROXIMATE_DATE_NOTE, singlePaymentFingerprint } from "../group-card-installments";
import type { ChargePatch } from "./charge-writes";
import { chargeIsLocked, chargeLedgerEntry, patchCharge, reportResidual, setLedger, syncInstallmentPlan } from "./charge-writes";
import { adoptReplacedCharge } from "./reconcile";

function findMatch({ charges, run }: CardImportScope, purchase: PluggyCardPurchase): PluggyCardMatch {
  const fingerprints = [purchase.fingerprint, ...purchase.alternateFingerprints];
  const fingerprint = fingerprints.find((candidate) => charges.has(candidate) || run.ledger.has(candidate)) ?? purchase.fingerprint;
  return { fingerprint, charge: charges.get(fingerprint), entry: run.ledger.get(fingerprint) };
}

/** A total inside the residual range is already correct, and replacing it would only trade one estimate for another. */
function bankOwnedPatch(charge: PluggyCardCharge, purchase: PluggyCardPurchase, isProvisional: boolean): ChargePatch | null {
  const patch: ChargePatch = {};
  if (Math.abs(charge.totalAmountCents - purchase.totalCents) > purchase.residualCents) patch.totalAmountCents = purchase.totalCents;
  const replacesApproximateDate = charge.notes === APPROXIMATE_DATE_NOTE && !purchase.dateIsApproximate;
  if (replacesApproximateDate) patch.notes = null;
  if ((replacesApproximateDate || isProvisional) && charge.purchaseDate !== purchase.purchaseDate) patch.purchaseDate = purchase.purchaseDate;
  return Object.keys(patch).length ? patch : null;
}

async function mergeIntoCharge(scope: CardImportScope, charge: PluggyCardCharge, { fingerprint, entry }: PluggyCardMatch, purchase: PluggyCardPurchase) {
  scope.seen.push(fingerprint);
  const patch = bankOwnedPatch(charge, purchase, entry?.outcome === "pending_card_charge");
  const locked = patch ? await chargeIsLocked(scope, purchase, charge.id) : false;
  if (patch && !locked) {
    await patchCharge(scope, charge, patch);
    bump(scope, "cardUpdated");
    reportResidual(scope, purchase);
  }
  if (!locked) await syncInstallmentPlan(scope, charge, purchase);
  const expected = chargeLedgerEntry(fingerprint, charge.id, purchase.status);
  // Once a record is posted the charge is confirmed, and a later pending state of another installment cannot undo that.
  if (!entry || (entry.outcome === "pending_card_charge" && expected.outcome === "created")) await setLedger(scope, fingerprint, expected);
}

async function createCharge(scope: CardImportScope, purchase: PluggyCardPurchase) {
  const { context, link, run, charges } = scope;
  const holder: { charge?: PluggyCardCharge } = {};
  await context.write(async (db) => {
    holder.charge = await createCreditCardCharge({
      accountId: link.accountId,
      categoryId: await resolveCardCategoryId(db, run.categoryRules, purchase.description),
      description: purchase.description,
      notes: purchase.dateIsApproximate ? APPROXIMATE_DATE_NOTE : null,
      purchaseDate: purchase.purchaseDate,
      totalAmountCents: purchase.totalCents,
      installmentCount: purchase.installmentCount,
      kind: purchase.kind,
      firstInvoiceMonth: purchase.firstInvoiceMonth,
      importFingerprint: purchase.fingerprint,
      installmentPlan: purchase.installmentPlan,
    }, db);
  });
  // The charge is written first: if the ledger write fails, the next run finds the charge by its fingerprint and restores the entry.
  await setLedger(scope, purchase.fingerprint, chargeLedgerEntry(purchase.fingerprint, holder.charge?.id ?? null, purchase.status));
  if (holder.charge) charges.set(purchase.fingerprint, holder.charge);
  bump(scope, purchase.kind === "adjustment" ? "cardRefunds" : "cardPurchases");
  reportResidual(scope, purchase);
}

export async function importCardPurchase(scope: CardImportScope, purchase: PluggyCardPurchase) {
  const match = findMatch(scope, purchase);
  if (match.charge) return mergeIntoCharge(scope, match.charge, match, purchase);
  // The ledger remembers a charge that the user deleted, so it stays deleted.
  if (match.entry && match.entry.outcome !== "cancelled") return void scope.seen.push(match.fingerprint);
  if (purchase.status === "posted" && await adoptReplacedCharge(scope, purchase)) return;
  await createCharge(scope, purchase);
}

/** Records no charge: linking the payment to its bill completes it later. */
export async function recordBillPayment(scope: CardImportScope, row: PluggyCardRow) {
  if (row.date < scope.link.cutoffDate) return bump(scope, "cardIgnored");
  if (row.status !== "posted") return bump(scope, "cardDeferred");
  const fingerprint = singlePaymentFingerprint(row.remoteId);
  if (scope.run.ledger.has(fingerprint)) return void scope.seen.push(fingerprint);
  await setLedger(scope, fingerprint, { fingerprint, outcome: "pending_card_payment", localTable: null, localId: null });
  bump(scope, "cardBillPayment");
}
