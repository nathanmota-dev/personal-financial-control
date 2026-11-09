import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyItemView, PluggyOverview, PluggyRemoteAccountView } from "@/lib/interfaces/pluggy";
import { DomainError, invariant } from "@/lib/server/errors";
import type { PluggyItemInput } from "./inputs";
import { listPluggyLinks } from "./links";
import { remoteAccountView, remoteItemFields } from "./remote";

type ItemRow = typeof pluggyItems.$inferSelect;

function itemView(row: ItemRow, remoteAccounts: PluggyRemoteAccountView[], accountsError: string | null): PluggyItemView {
  return {
    id: row.id,
    label: row.label,
    connectorName: row.connectorName,
    status: row.status,
    collectedAt: row.collectedAt?.toISOString() ?? null,
    nextAutoSyncAt: row.nextAutoSyncAt?.toISOString() ?? null,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    lastErrorCode: row.lastErrorCode ?? null,
    remoteAccounts,
    accountsError,
  };
}

async function loadItemView(row: ItemRow, client: PluggyApi) {
  try {
    const accounts = await client.listAccounts(row.externalItemId);
    return itemView(row, accounts.map(remoteAccountView), null);
  } catch (error) {
    if (error instanceof DomainError) return itemView(row, [], error.message);
    throw error;
  }
}

export async function getPluggyOverview(db: AppDb, client: PluggyApi): Promise<PluggyOverview> {
  const rows = await db.query.pluggyItems.findMany({ orderBy: (table, { asc }) => [asc(table.label)] });
  const [items, links] = await Promise.all([
    Promise.all(rows.map((row) => loadItemView(row, client))),
    listPluggyLinks(db),
  ]);
  return { items, links };
}

export async function addPluggyItem(input: PluggyItemInput, db: AppDb, client: PluggyApi) {
  const remote = await client.getItem(input.externalItemId);
  const [row] = await db.insert(pluggyItems)
    .values({ externalItemId: input.externalItemId, label: input.label, ...remoteItemFields(remote) })
    .onConflictDoNothing({ target: pluggyItems.externalItemId })
    .returning();
  invariant(row, "PLUGGY_ITEM_EXISTS", "Este Item ID já foi adicionado.", 409);
  return loadItemView(row, client);
}

export async function removePluggyItem(id: string, db: AppDb) {
  const removed = await db.delete(pluggyItems).where(eq(pluggyItems.id, id)).returning();
  invariant(removed.length, "PLUGGY_ITEM_NOT_FOUND", "Conexão não encontrada.", 404);
}
