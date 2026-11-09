import { eq } from "drizzle-orm";

import { pluggyImportLedger, transactions } from "@/lib/db/schema";
import type { BankImportLedgerEntry, BankImportLocalRow, BankImportScope, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import { bump, closestByDate, dayDistance } from "./scope";

const PENDING_MATCH_WINDOW_DAYS = 3;

/** Only state the bank owns. A competence month that the user moved away from the date is kept. */
function bankOwnedPatch(local: BankImportLocalRow, row: PluggyBankRow, now: Date) {
  const competenceFollowsDate = local.competenceMonth === local.transactionDate.slice(0, 7);
  return {
    status: row.status,
    amountCents: row.amountCents,
    transactionDate: row.transactionDate,
    competenceMonth: competenceFollowsDate ? row.competenceMonth : local.competenceMonth,
    updatedAt: now,
  };
}

function bankStateChanged(local: BankImportLocalRow, row: PluggyBankRow) {
  return local.status !== row.status || local.amountCents !== row.amountCents || local.transactionDate !== row.transactionDate;
}

async function writeRowChange(scope: BankImportScope, local: BankImportLocalRow, patch: Partial<BankImportLocalRow>, ledgerFingerprint: string, ledger: Partial<BankImportLedgerEntry>) {
  const { context } = scope;
  await context.write((db) => db.transaction(async (tx) => {
    await tx.update(transactions).set(patch).where(eq(transactions.id, local.id));
    await tx.update(pluggyImportLedger).set({ ...ledger, lastSeenAt: context.now, updatedAt: context.now }).where(eq(pluggyImportLedger.fingerprint, ledgerFingerprint));
  }));
  Object.assign(local, patch);
}

/** A row the sync cancelled came back, which Pluggy allows because `transactions/deleted` is not permanent. */
async function restoreCancelled(scope: BankImportScope, row: PluggyBankRow, entry: BankImportLedgerEntry, local: BankImportLocalRow) {
  const patch = local.status === "cancelled" ? bankOwnedPatch(local, row, scope.context.now) : {};
  await writeRowChange(scope, local, patch, entry.fingerprint, { outcome: "created" });
  entry.outcome = "created";
  bump(scope, "bankRestored");
}

export async function resyncExistingRow(scope: BankImportScope, row: PluggyBankRow, entry: BankImportLedgerEntry) {
  const local = entry.localTable === "transactions" && entry.localId ? scope.locals.get(entry.localId) : undefined;
  if (!local) return;
  if (entry.outcome === "cancelled") return restoreCancelled(scope, row, entry, local);
  if (local.status !== "pending" || !bankStateChanged(local, row)) return;
  await writeRowChange(scope, local, bankOwnedPatch(local, row, scope.context.now), entry.fingerprint, {});
  bump(scope, "bankUpdated");
}

/** Rows whose remote id may have been replaced: still pending locally, or cancelled by an earlier sync. */
export function replaceableRows({ run, locals }: Pick<BankImportScope, "run" | "locals">) {
  return [...locals.values()].filter((local) => {
    const entry = local.importFingerprint ? run.ledger.get(local.importFingerprint) : undefined;
    return entry?.localTable === "transactions" && (local.status === "pending" || entry.outcome === "cancelled");
  });
}

/** Pluggy can delete a pending record and recreate it posted under a new id, which must not duplicate the row. */
export async function adoptReplacedRow(scope: BankImportScope, row: PluggyBankRow, type: BankImportLocalRow["type"]) {
  const { run, remoteFingerprints, claimed, context } = scope;
  const candidates = scope.replaceable.filter((local) =>
    !claimed.has(local.id) && !remoteFingerprints.has(local.importFingerprint!) && local.type === type && local.amountCents === row.amountCents
    && dayDistance(local.transactionDate, row.transactionDate) <= PENDING_MATCH_WINDOW_DAYS);
  const local = closestByDate(candidates, row.transactionDate, (candidate) => candidate.transactionDate);
  if (!local) return false;
  const previous = local.importFingerprint!;
  const entry = run.ledger.get(previous)!;
  await writeRowChange(scope, local, { ...bankOwnedPatch(local, row, context.now), importFingerprint: row.fingerprint }, previous, { fingerprint: row.fingerprint, outcome: "created" });
  run.ledger.delete(previous);
  run.ledger.set(row.fingerprint, { ...entry, fingerprint: row.fingerprint, outcome: "created" });
  claimed.add(local.id);
  bump(scope, "bankUpdated");
  return true;
}

export async function cancelMissingPendingRows(scope: BankImportScope) {
  const { run, link, remoteFingerprints, claimed, context } = scope;
  for (const local of scope.replaceable) {
    const fingerprint = local.importFingerprint!;
    const entry = run.ledger.get(fingerprint);
    if (claimed.has(local.id) || !entry || entry.outcome === "cancelled" || local.status !== "pending") continue;
    if (remoteFingerprints.has(fingerprint) || local.transactionDate < link.cutoffDate) continue;
    await writeRowChange(scope, local, { status: "cancelled", updatedAt: context.now }, fingerprint, { outcome: "cancelled" });
    entry.outcome = "cancelled";
    bump(scope, "bankCancelled");
  }
}
