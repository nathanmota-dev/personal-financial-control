import { eq } from "drizzle-orm";

import { pluggyImportLedger } from "@/lib/db/schema";
import type { PluggyAttentionItem, PluggyAttentionReason, PluggyLinkRecord, PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import type { BankImportLedgerEntry, BankImportRunState } from "@/lib/interfaces/pluggy-bank-import";
import type { CardBillRunState } from "@/lib/interfaces/pluggy-card-bills";

const runs = new WeakMap<PluggySyncStepContext, Promise<CardBillRunState>>();

async function loadRunState({ db }: PluggySyncStepContext): Promise<CardBillRunState> {
  const [links, payments] = await Promise.all([
    db.query.pluggyAccountLinks.findMany(),
    db.query.creditCardBillPayments.findMany({ with: { transaction: true } }),
  ]);
  return {
    creditLinks: links.filter((link) => link.isEnabled && link.kind === "credit"),
    targets: new Map(),
    processedBankLinks: new Set(),
    localPayments: payments.map((payment) => ({
      id: payment.id,
      billId: payment.billId,
      amountCents: payment.amountCents,
      paymentDate: payment.paymentDate,
      accountId: payment.transaction.accountId,
      idempotencyKey: payment.idempotencyKey,
      claimed: false,
    })),
  };
}

export function cardBillRunState(context: PluggySyncStepContext) {
  if (!runs.has(context)) runs.set(context, loadRunState(context));
  return runs.get(context)!;
}

export function attentionItem(reason: PluggyAttentionReason, link: PluggyLinkRecord, description: string, date: string, amountCents: number): PluggyAttentionItem {
  return { reason, accountLabel: link.remoteName, description, date, amountCents };
}

export async function updateBillLedger(context: PluggySyncStepContext, run: BankImportRunState, entry: BankImportLedgerEntry) {
  await context.write((db) => db.update(pluggyImportLedger)
    .set({ outcome: entry.outcome, localTable: entry.localTable, localId: entry.localId, lastSeenAt: context.now, updatedAt: context.now })
    .where(eq(pluggyImportLedger.fingerprint, entry.fingerprint)));
  run.ledger.set(entry.fingerprint, entry);
}
