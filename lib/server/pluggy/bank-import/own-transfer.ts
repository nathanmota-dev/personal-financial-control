import { eq } from "drizzle-orm";

import { pluggyImportLedger, transfers } from "@/lib/db/schema";
import type { BankImportOwnLeg, BankImportParkedTransfer, BankImportScope, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import { createTransfer } from "@/lib/server/transfers";
import { ownTransferLegs } from "./run-state";
import { bump, closestByDate, dayDistance, flagAttention, ledgerValues } from "./scope";

/** A Pix made on a weekend or holiday is posted by one bank only on the next business day. */
const TRANSFER_WINDOW_DAYS = 3;

type TransferInput = Parameters<typeof createTransfer>[0];

function transferInput(fromAccountId: string, toAccountId: string, source: PluggyBankRow): TransferInput {
  return { fromAccountId, toAccountId, amountCents: source.amountCents, transferDate: source.transactionDate, competenceMonth: source.competenceMonth, description: source.description };
}

function isPairable(row: PluggyBankRow, amountCents: number, date: string) {
  return row.amountCents === amountCents && dayDistance(row.transactionDate, date) <= TRANSFER_WINDOW_DAYS;
}

async function findPartner(scope: BankImportScope, row: PluggyBankRow) {
  const { run, link } = scope;
  const others = run.links.filter((other) => other.id !== link.id && other.accountId !== link.accountId);
  const legs = (await Promise.all(others.map((other) => ownTransferLegs(scope, other)))).flat();
  const candidates = legs.filter((leg) => leg.row.direction !== row.direction && !run.ledger.has(leg.row.fingerprint) && isPairable(leg.row, row.amountCents, row.transactionDate));
  return closestByDate(candidates, row.transactionDate, (leg) => leg.row.transactionDate);
}

/** Finds a transfer sent to the catch-all account by an earlier run, before this side had arrived. */
function findParked(scope: BankImportScope, row: PluggyBankRow) {
  const { run, link } = scope;
  const other = run.otherOwnAccountId;
  const candidates = run.parkedTransfers.filter((transfer) => {
    if (transfer.amountCents !== row.amountCents || dayDistance(transfer.transferDate, row.transactionDate) > TRANSFER_WINDOW_DAYS) return false;
    return row.direction === "CREDIT"
      ? transfer.toAccountId === other && transfer.fromAccountId !== link.accountId
      : transfer.fromAccountId === other && transfer.toAccountId !== link.accountId;
  });
  return closestByDate(candidates, row.transactionDate, (transfer) => transfer.transferDate);
}

async function writeTransfer(scope: BankImportScope, input: TransferInput, fingerprints: { fingerprint: string; outcome: "created" | "matched" }[]) {
  const { context, run } = scope;
  const holder: { id?: string } = {};
  const entries = (id: string | null) => fingerprints.map(({ fingerprint, outcome }) => ({ fingerprint, outcome, localTable: "transfers", localId: id }));
  await context.write((db) => db.transaction(async (tx) => {
    const created = await createTransfer(input, tx);
    holder.id = created.id;
    for (const entry of entries(created.id)) await tx.insert(pluggyImportLedger).values(ledgerValues(entry, context.now));
  }));
  for (const entry of entries(holder.id ?? null)) run.ledger.set(entry.fingerprint, entry);
  bump(scope, "bankOwnTransfer");
  return holder.id ?? "";
}

function pairWithPartner(scope: BankImportScope, row: PluggyBankRow, partner: BankImportOwnLeg) {
  const accountId = scope.link.accountId;
  const input = row.direction === "DEBIT" ? transferInput(accountId, partner.accountId, row) : transferInput(partner.accountId, accountId, partner.row);
  return writeTransfer(scope, input, [{ fingerprint: row.fingerprint, outcome: "created" }, { fingerprint: partner.row.fingerprint, outcome: "matched" }]);
}

async function repointParked(scope: BankImportScope, row: PluggyBankRow, parked: BankImportParkedTransfer) {
  const { context, link, run } = scope;
  const change = row.direction === "CREDIT" ? { toAccountId: link.accountId } : { fromAccountId: link.accountId };
  const entry = { fingerprint: row.fingerprint, outcome: "matched" as const, localTable: "transfers", localId: parked.id };
  await context.write((db) => db.transaction(async (tx) => {
    await tx.update(transfers).set({ ...change, updatedAt: context.now }).where(eq(transfers.id, parked.id));
    await tx.insert(pluggyImportLedger).values(ledgerValues(entry, context.now));
  }));
  run.ledger.set(row.fingerprint, entry);
  run.parkedTransfers.splice(run.parkedTransfers.indexOf(parked), 1);
  bump(scope, "bankUpdated");
}

async function parkTransfer(scope: BankImportScope, row: PluggyBankRow, otherAccountId: string) {
  const accountId = scope.link.accountId;
  const input = row.direction === "DEBIT" ? transferInput(accountId, otherAccountId, row) : transferInput(otherAccountId, accountId, row);
  const id = await writeTransfer(scope, input, [{ fingerprint: row.fingerprint, outcome: "created" }]);
  scope.run.parkedTransfers.push({ id, fromAccountId: input.fromAccountId, toAccountId: input.toAccountId, amountCents: row.amountCents, transferDate: row.transactionDate });
}

/** Transfers have no pending state, so a row waits until it posts. The ledger guards `createTransfer`, which has no idempotency key. */
export async function importOwnTransfer(scope: BankImportScope, row: PluggyBankRow) {
  if (row.status !== "posted") return bump(scope, "bankDeferred");
  const partner = await findPartner(scope, row);
  if (partner) {
    await pairWithPartner(scope, row, partner);
    return;
  }
  const parked = findParked(scope, row);
  if (parked) return repointParked(scope, row, parked);
  const other = scope.run.otherOwnAccountId;
  if (other && other !== scope.link.accountId) return parkTransfer(scope, row, other);
  flagAttention(scope, row, "missing_other_own_account");
}
