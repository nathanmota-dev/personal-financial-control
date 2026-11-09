import { pluggyAccountLinks, pluggyItems } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createTestDatabase } from "@/tests/helpers/database";

type Kind = "bank" | "credit";

/** Two linked accounts with different cutoffs and one account the bank does not cover. */
export async function seedCutoverDatabase({ bankCutoff = "2026-03-01", cardCutoff = "2026-04-01" } = {}) {
  const database = await createTestDatabase();
  const { db } = database;
  const checking = await createAccount({ name: "Conta", type: "checking", initialBalanceCents: 0 }, db);
  const card = await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 }, db);
  const wallet = await createAccount({ name: "Carteira", type: "cash", initialBalanceCents: 0 }, db);
  const category = await createCategory({ name: "Mercado", group: "variable_expense" }, db);
  const [item] = await db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  const link = (externalAccountId: string, accountId: string, kind: Kind, cutoffDate: string, isEnabled = true) =>
    db.insert(pluggyAccountLinks).values({ itemId: item.id, externalAccountId, accountId, remoteName: externalAccountId, kind, cutoffDate, isEnabled });
  await link("remote-bank", checking.id, "bank", bankCutoff);
  await link("remote-card", card.id, "credit", cardCutoff);
  return { ...database, checking, card, wallet, category, link };
}

/** Every row of every table, to prove that a run wrote nothing. */
export async function snapshotAllTables(db: Awaited<ReturnType<typeof createTestDatabase>>["db"]) {
  const { rows } = await db.$client.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  const snapshot: Record<string, unknown> = {};
  for (const { name } of rows) snapshot[String(name)] = (await db.$client.execute(`SELECT * FROM "${String(name)}" ORDER BY rowid`)).rows;
  return JSON.stringify(snapshot);
}
