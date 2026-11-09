import { eq, inArray } from "drizzle-orm";

import { pluggyImportLedger, transactions } from "@/lib/db/schema";
import type { BankImportScope, BankImportRunState, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import type { PluggyAccountSyncStep, PluggyLinkRecord, PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import { createBankRecord, recordCardPayment } from "../bank-import/create-record";
import { importOwnTransfer } from "../bank-import/own-transfer";
import { adoptReplacedRow, cancelMissingPendingRows, replaceableRows, resyncExistingRow } from "../bank-import/resync";
import { bankImportRunState, readBankRows } from "../bank-import/run-state";
import { flagAttention } from "../bank-import/scope";
import { classifyBankTransaction, isPossibleOwnTransfer } from "../classify-bank-transaction";

async function createScope(context: PluggySyncStepContext, link: PluggyLinkRecord, run: BankImportRunState, remoteFingerprints: Set<string>): Promise<BankImportScope> {
  const rows = await context.db.query.transactions.findMany({ where: eq(transactions.accountId, link.accountId) });
  const locals = new Map(rows.map((row) => [row.id, row]));
  return { context, link, run, locals, replaceable: replaceableRows({ run, locals }), remoteFingerprints, claimed: new Set(), counts: {}, attention: [] };
}

async function importNewRow(scope: BankImportScope, row: PluggyBankRow) {
  const { identity } = scope.run;
  const classification = classifyBankTransaction(row, identity);
  if (classification === "own_transfer") return importOwnTransfer(scope, row);
  if (classification === "card_payment") return recordCardPayment(scope, row);
  const type = classification === "ordinary" ? row.type : classification;
  if (row.status === "posted" && await adoptReplacedRow(scope, row, type)) return;
  await createBankRecord(scope, row, classification);
  if (classification === "ordinary" && isPossibleOwnTransfer(row, identity)) flagAttention(scope, row, "possible_own_transfer");
}

export const importBankTransactionsStep: PluggyAccountSyncStep = {
  name: "import-bank-transactions",
  scope: "account",
  async run(context, link) {
    if (link.kind !== "bank") return;
    const [run, { rows, fingerprints, ignored }] = await Promise.all([bankImportRunState(context), readBankRows(context, link)]);
    const scope = await createScope(context, link, run, fingerprints);
    const seen: string[] = [];
    for (const row of rows) {
      const entry = run.ledger.get(row.fingerprint);
      if (entry) {
        seen.push(row.fingerprint);
        await resyncExistingRow(scope, row, entry);
      } else {
        await importNewRow(scope, row);
      }
    }
    await cancelMissingPendingRows(scope);
    if (seen.length) await context.write((db) => db.update(pluggyImportLedger).set({ lastSeenAt: context.now, updatedAt: context.now }).where(inArray(pluggyImportLedger.fingerprint, seen)));
    if (ignored) scope.counts.bankIgnored = ignored;
    return { counts: scope.counts, attention: scope.attention };
  },
};
