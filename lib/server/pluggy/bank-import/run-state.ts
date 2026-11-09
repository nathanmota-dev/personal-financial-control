import type { AppDb } from "@/lib/db";
import type { BankImportOwnLeg, BankImportParkedTransfer, BankImportRows, BankImportRunState, BankImportScope } from "@/lib/interfaces/pluggy-bank-import";
import type { PluggyLinkRecord, PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import { loadCategoryRuleIndex } from "../category-rules";
import { classifyBankTransaction } from "../classify-bank-transaction";
import { mapBankTransaction } from "../mappers/bank-transaction";
import { loadOwnIdentityForImport } from "../own-identity";

const runs = new WeakMap<PluggySyncStepContext, Promise<BankImportRunState>>();

async function investmentCategoryId(db: AppDb) {
  const rows = await db.query.categories.findMany();
  const usable = rows.filter((category) => category.group === "investment" && !category.isArchived);
  return (usable.find((category) => category.name === "Investimentos") ?? usable[0])?.id ?? null;
}

async function parkedTransfers(db: AppDb, ledgerIds: Set<string>, otherOwnAccountId: string | null): Promise<BankImportParkedTransfer[]> {
  if (!otherOwnAccountId || !ledgerIds.size) return [];
  const rows = await db.query.transfers.findMany();
  return rows.filter((row) => ledgerIds.has(row.id) && (row.fromAccountId === otherOwnAccountId || row.toAccountId === otherOwnAccountId));
}

async function loadRunState({ db }: PluggySyncStepContext): Promise<BankImportRunState> {
  const [own, links, ledgerRows, categoryId, categoryRules] = await Promise.all([
    loadOwnIdentityForImport(db),
    db.query.pluggyAccountLinks.findMany(),
    db.query.pluggyImportLedger.findMany(),
    investmentCategoryId(db),
    loadCategoryRuleIndex(db),
  ]);
  const transferIds = new Set(ledgerRows.flatMap((row) => row.localTable === "transfers" && row.localId ? [row.localId] : []));
  return {
    ...own,
    investmentCategoryId: categoryId,
    categoryRules,
    links: links.filter((link) => link.isEnabled && link.kind === "bank"),
    ledger: new Map(ledgerRows.map((row) => [row.fingerprint, row])),
    parkedTransfers: await parkedTransfers(db, transferIds, own.otherOwnAccountId),
    ownLegs: new Map(),
  };
}

export function bankImportRunState(context: PluggySyncStepContext) {
  if (!runs.has(context)) runs.set(context, loadRunState(context));
  return runs.get(context)!;
}

/** `fingerprints` includes rows before the cutoff, because those still exist at the bank. */
export async function readBankRows(context: PluggySyncStepContext, link: PluggyLinkRecord): Promise<BankImportRows> {
  const rows = [];
  const fingerprints = new Set<string>();
  let ignored = 0;
  for (const remote of await context.remoteTransactions(link)) {
    const row = mapBankTransaction(remote);
    if (row) fingerprints.add(row.fingerprint);
    if (row && row.transactionDate >= link.cutoffDate) rows.push(row);
    else ignored++;
  }
  rows.sort((left, right) => left.transactionDate.localeCompare(right.transactionDate) || left.fingerprint.localeCompare(right.fingerprint));
  return { rows, fingerprints, ignored };
}

/** An account that cannot be read offers no partner here; its own step reports that failure. */
export function ownTransferLegs(scope: BankImportScope, link: PluggyLinkRecord): Promise<BankImportOwnLeg[]> {
  const { context, run } = scope;
  if (!run.ownLegs.has(link.id)) {
    run.ownLegs.set(link.id, readBankRows(context, link)
      .then(({ rows }) => rows
        .filter((row) => row.status === "posted" && classifyBankTransaction(row, run.identity) === "own_transfer")
        .map((row) => ({ accountId: link.accountId, row })))
      .catch(() => []));
  }
  return run.ownLegs.get(link.id)!;
}
