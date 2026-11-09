import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { accounts, pluggyAccountLinks, pluggyItems } from "@/lib/db/schema";
import type { PluggyAccountKind, PluggyApi, PluggyLinkView } from "@/lib/interfaces/pluggy";
import { isLinkableAccountType } from "@/lib/pluggy-account-rules";
import { invariant } from "@/lib/server/errors";
import type { PluggyLinkInput, PluggyLinkUpdate } from "./inputs";
import { remoteAccountKind, remoteAccountName } from "./remote";

type LinkRow = typeof pluggyAccountLinks.$inferSelect;

function linkView(row: LinkRow): PluggyLinkView {
  return {
    id: row.id,
    itemId: row.itemId,
    externalAccountId: row.externalAccountId,
    accountId: row.accountId,
    remoteName: row.remoteName,
    kind: row.kind,
    cutoffDate: row.cutoffDate,
    isEnabled: row.isEnabled,
  };
}

async function assertLinkableAccount(accountId: string, kind: PluggyAccountKind, db: AppDb) {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  invariant(account && !account.isArchived, "PLUGGY_LOCAL_ACCOUNT_NOT_FOUND", "Conta local não encontrada.", 404);
  invariant(isLinkableAccountType(kind, account.type), "PLUGGY_ACCOUNT_KIND_MISMATCH", "O tipo da conta local não corresponde à conta do banco.");
}

export async function listPluggyLinks(db: AppDb) {
  const rows = await db.query.pluggyAccountLinks.findMany({ orderBy: (table, { asc }) => [asc(table.remoteName)] });
  return rows.map(linkView);
}

export async function createPluggyLink(input: PluggyLinkInput, db: AppDb, client: PluggyApi) {
  const item = await db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, input.itemId) });
  invariant(item, "PLUGGY_ITEM_NOT_FOUND", "Conexão não encontrada.", 404);
  const remote = (await client.listAccounts(item.externalItemId)).find((account) => account.id === input.externalAccountId);
  invariant(remote, "PLUGGY_ACCOUNT_NOT_FOUND", "A conta não pertence a esta conexão.", 404);
  const kind = remoteAccountKind(remote);
  await assertLinkableAccount(input.accountId, kind, db);
  const [row] = await db.insert(pluggyAccountLinks)
    .values({ ...input, kind, remoteName: remoteAccountName(remote) })
    .onConflictDoNothing({ target: pluggyAccountLinks.externalAccountId })
    .returning();
  invariant(row, "PLUGGY_LINK_EXISTS", "Esta conta do banco já está vinculada.", 409);
  return linkView(row);
}

export async function updatePluggyLink({ id, ...changes }: PluggyLinkUpdate, db: AppDb) {
  const current = await db.query.pluggyAccountLinks.findFirst({ where: eq(pluggyAccountLinks.id, id) });
  invariant(current, "PLUGGY_LINK_NOT_FOUND", "Vínculo não encontrado.", 404);
  if (changes.accountId) await assertLinkableAccount(changes.accountId, current.kind, db);
  const [row] = await db.update(pluggyAccountLinks)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(pluggyAccountLinks.id, id))
    .returning();
  return linkView(row);
}
