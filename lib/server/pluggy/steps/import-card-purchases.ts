import { eq, inArray } from "drizzle-orm";

import { accounts, creditCardCharges, pluggyImportLedger } from "@/lib/db/schema";
import type { CardImportScope, PluggyCardCharge, PluggyCardRow } from "@/lib/interfaces/pluggy-card-import";
import type { PluggyAccountSyncStep, PluggyLinkRecord, PluggyRemoteBill, PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import { invariant } from "@/lib/server/errors";
import { bankImportRunState } from "../bank-import/run-state";
import { bump } from "../bank-import/scope";
import { importCardPurchase, recordBillPayment } from "../card-import/import-purchase";
import { cancelMissingCharges, provisionalCharges } from "../card-import/reconcile";
import { assignInvoiceMonths, endsBeforeCutoff, groupCardPurchases } from "../group-card-installments";
import { mapCardTransaction } from "../mappers/card-transaction";

async function requireClosingDay({ db }: PluggySyncStepContext, link: PluggyLinkRecord) {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, link.accountId) });
  invariant(account?.type === "credit", "PLUGGY_CARD_ACCOUNT_INVALID", "Vincule este cartão a uma conta local do tipo cartão de crédito.");
  invariant(account.creditClosingDay, "PLUGGY_CARD_CLOSING_DAY_MISSING", "Defina o dia de fechamento do cartão para importar as compras.");
  return account.creditClosingDay;
}

/** A bill's invoice is the month of its due date, which is a date-only value read in UTC. */
function billMonths(bills: PluggyRemoteBill[]) {
  return new Map(bills.flatMap((bill) => {
    const dueDate = new Date(bill.dueDate);
    return Number.isNaN(dueDate.getTime()) ? [] : [[bill.id, dueDate.toISOString().slice(0, 7)] as const];
  }));
}

function flagUnconverted(scope: CardImportScope, row: PluggyCardRow) {
  bump(scope, "cardIgnored");
  scope.attention.push({ reason: "card_missing_account_currency", accountLabel: scope.link.remoteName, description: row.description, date: row.date, amountCents: row.amountCents });
}

async function createScope(context: PluggySyncStepContext, link: PluggyLinkRecord): Promise<CardImportScope> {
  const [run, rows] = await Promise.all([bankImportRunState(context), context.db.query.creditCardCharges.findMany({ where: eq(creditCardCharges.accountId, link.accountId) })]);
  const charges = new Map<string, PluggyCardCharge>(rows.flatMap((row) => row.importFingerprint ? [[row.importFingerprint, row] as const] : []));
  return { context, link, run, charges, provisional: provisionalCharges(charges.values(), run.ledger), remoteFingerprints: new Set(), claimed: new Set(), seen: [], counts: {}, attention: [] };
}

function readRows(remote: Awaited<ReturnType<PluggySyncStepContext["remoteTransactions"]>>, scope: CardImportScope) {
  const rows: PluggyCardRow[] = [];
  for (const record of remote) {
    const row = mapCardTransaction(record);
    if (row) rows.push(row);
    else bump(scope, "cardIgnored");
  }
  return rows;
}

export const importCardPurchasesStep: PluggyAccountSyncStep = {
  name: "import-card-purchases",
  scope: "account",
  async run(context, link) {
    if (link.kind !== "credit") return;
    const closingDay = await requireClosingDay(context, link);
    const [remote, bills, scope] = await Promise.all([context.remoteTransactions(link), context.remoteBills(link), createScope(context, link)]);
    const rows = readRows(remote, scope);
    for (const row of rows.filter((item) => item.kind === "unconverted")) flagUnconverted(scope, row);
    for (const row of rows.filter((item) => item.kind === "bill_payment")) await recordBillPayment(scope, row);
    const purchasable = rows.filter((row) => row.kind === "purchase" || row.kind === "refund");
    const purchases = groupCardPurchases(assignInvoiceMonths(purchasable, billMonths(bills), closingDay), { accountId: link.accountId, closingDay });
    // Includes purchases before the cutoff, because those still exist at the bank.
    for (const purchase of purchases) [purchase.fingerprint, ...purchase.alternateFingerprints].forEach((value) => scope.remoteFingerprints.add(value));
    for (const purchase of purchases) {
      if (endsBeforeCutoff(purchase, link.cutoffDate)) bump(scope, "cardIgnored");
      else await importCardPurchase(scope, purchase);
    }
    await cancelMissingCharges(scope);
    if (scope.seen.length) await context.write((db) => db.update(pluggyImportLedger).set({ lastSeenAt: context.now, updatedAt: context.now }).where(inArray(pluggyImportLedger.fingerprint, scope.seen)));
    return { counts: scope.counts, attention: scope.attention };
  },
};
