import type { PluggyAttentionItem, PluggyInvoiceReconciliation, PluggyLinkRecord, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import type { BankImportRunState } from "@/lib/interfaces/pluggy-bank-import";
import type { CardBillRunState, PluggyBillPaymentEntry, PluggyCardBillTarget } from "@/lib/interfaces/pluggy-card-bills";
import { bankImportRunState } from "../bank-import/run-state";
import { bump } from "../bank-import/scope";
import { singlePaymentFingerprint } from "../group-card-installments";
import { billEntryMatches } from "../match-bill-payment";
import { mapCardTransaction } from "../mappers/card-transaction";
import { attentionItem, cardBillRunState, updateBillLedger } from "./run-state";

/** The card's own record of a payment carries no money, so it only closes against the bill that lists it. */
async function resolveCardSideRecords(context: PluggySyncStepContext, link: PluggyLinkRecord, run: BankImportRunState, targets: PluggyCardBillTarget[]) {
  for (const row of (await context.remoteTransactions(link)).flatMap((record) => mapCardTransaction(record) ?? [])) {
    const fingerprint = singlePaymentFingerprint(row.remoteId);
    if (row.kind !== "bill_payment" || row.status !== "posted" || run.ledger.get(fingerprint)?.outcome !== "pending_card_payment") continue;
    const subject = { amountCents: row.amountCents, date: row.date };
    const target = targets.find((item) => item.payments.some((entry) => !entry.mirrored && billEntryMatches(entry, subject)));
    if (!target) continue;
    target.payments.find((entry) => !entry.mirrored && billEntryMatches(entry, subject))!.mirrored = true;
    await updateBillLedger(context, run, { fingerprint, outcome: "matched", localTable: "credit_card_bills", localId: target.billId });
  }
}

/** Bank rows before the cutoff are never read, and an unread account may still hold the payment. */
function externalEntries(target: PluggyCardBillTarget, run: BankImportRunState, state: CardBillRunState): PluggyBillPaymentEntry[] {
  if (run.links.some((link) => !state.processedBankLinks.has(link.id))) return [];
  const earliest = run.links.reduce<string | null>((oldest, link) => (!oldest || link.cutoffDate < oldest ? link.cutoffDate : oldest), null);
  return target.payments.filter((entry) => !entry.claimed && (!earliest || entry.date >= earliest));
}

function invoiceStatus(differenceCents: number, unlinkedPaymentCents: number): PluggyInvoiceReconciliation["status"] {
  if (differenceCents) return "difference";
  return unlinkedPaymentCents ? "unlinked_payment" : "matched";
}

/** A dry run wrote no purchases, so the imported totals it could compare are stale. */
export async function reportLinkBills(context: PluggySyncStepContext, link: PluggyLinkRecord): Promise<PluggySyncStepResult> {
  const [run, state] = await Promise.all([bankImportRunState(context), cardBillRunState(context)]);
  const counts: Record<string, number> = {};
  const attention: PluggyAttentionItem[] = [];
  const invoices: PluggyInvoiceReconciliation[] = [];
  const targets = state.targets.get(link.id) ?? [];
  await resolveCardSideRecords(context, link, run, targets);
  // Purchases of invoices before the cutoff month are not imported, so those bills cannot be compared.
  for (const target of targets.filter((item) => item.invoiceMonth >= link.cutoffDate.slice(0, 7))) {
    const external = externalEntries(target, run, state);
    for (const entry of external) {
      bump({ counts }, "billPaymentsExternal");
      attention.push(attentionItem("card_payment_outside_links", link, `Fatura ${target.invoiceMonth}`, entry.date, entry.amountCents));
    }
    const unlinkedPaymentCents = external.reduce((total, entry) => total + entry.amountCents, 0);
    invoices.push({ accountLabel: link.remoteName, invoiceMonth: target.invoiceMonth, statementTotalCents: target.statementTotalCents, importedCents: target.importedCents, differenceCents: target.differenceCents, unlinkedPaymentCents, status: invoiceStatus(target.differenceCents, unlinkedPaymentCents) });
  }
  return { counts, attention, invoices: context.dryRun ? [] : invoices };
}
