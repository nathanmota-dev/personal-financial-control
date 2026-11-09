import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { accounts, pluggySettings } from "@/lib/db/schema";
import type { PluggyIdentityView } from "@/lib/interfaces/pluggy";
import type { PluggyOwnIdentity } from "@/lib/interfaces/pluggy-bank-import";
import { isOtherOwnAccountType } from "@/lib/pluggy-account-rules";
import { invariant } from "@/lib/server/errors";
import { normalizeOwnerName } from "./classify-bank-transaction";
import type { PluggyIdentityInput } from "./inputs";

function maskCpf(cpf: string) {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

function storedNames(row: typeof pluggySettings.$inferSelect | undefined) {
  return row ? JSON.parse(row.ownerNames) as string[] : [];
}

export async function getPluggyIdentity(db: AppDb): Promise<PluggyIdentityView> {
  const row = await db.query.pluggySettings.findFirst();
  return { names: storedNames(row), cpfMasked: row?.ownerCpf ? maskCpf(row.ownerCpf) : null, otherOwnAccountId: row?.otherOwnAccountId ?? null };
}

/** Omitting `cpf` keeps the stored one, because the form never receives it in full. */
export async function savePluggyIdentity(input: PluggyIdentityInput, db: AppDb): Promise<PluggyIdentityView> {
  if (input.otherOwnAccountId) {
    const account = await db.query.accounts.findFirst({ where: eq(accounts.id, input.otherOwnAccountId) });
    invariant(account && !account.isArchived && isOtherOwnAccountType(account.type), "PLUGGY_OTHER_ACCOUNT_INVALID", "Escolha uma conta corrente, poupança ou dinheiro ativa.");
  }
  const existing = await db.query.pluggySettings.findFirst();
  const values = {
    ownerNames: JSON.stringify(input.names),
    ownerCpf: input.cpf ?? existing?.ownerCpf ?? null,
    otherOwnAccountId: input.otherOwnAccountId,
    updatedAt: new Date(),
  };
  if (existing) await db.update(pluggySettings).set(values).where(eq(pluggySettings.id, existing.id));
  else await db.insert(pluggySettings).values(values);
  return getPluggyIdentity(db);
}

/** A missing or archived destination counts as not configured, so those transfers go to review. */
export async function loadOwnIdentityForImport(db: AppDb): Promise<{ identity: PluggyOwnIdentity; otherOwnAccountId: string | null }> {
  const row = await db.query.pluggySettings.findFirst();
  const account = row?.otherOwnAccountId ? await db.query.accounts.findFirst({ where: eq(accounts.id, row.otherOwnAccountId) }) : undefined;
  return {
    identity: { names: storedNames(row).map(normalizeOwnerName), cpf: row?.ownerCpf ?? null },
    otherOwnAccountId: account && !account.isArchived ? account.id : null,
  };
}
