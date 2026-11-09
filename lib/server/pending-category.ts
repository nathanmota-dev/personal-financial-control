import { eq } from "drizzle-orm";

import { categories } from "@/lib/db/schema";
import { isPendingCategory, PENDING_CATEGORY_GROUP, PENDING_CATEGORY_NAME } from "@/lib/pending-category";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import type { TransactionDb } from "@/lib/server/transactions/validation";

const findByName = (db: TransactionDb) => db.query.categories.findFirst({ where: eq(categories.name, PENDING_CATEGORY_NAME) });

export async function findPendingCategory(db: TransactionDb) {
  const category = await findByName(db);
  return isPendingCategory(category) ? category! : null;
}

/** Category names are unique, so another group holding this name cannot be worked around here. */
export async function getOrCreatePendingCategory(db: TransactionDb) {
  const existing = await findByName(db);
  if (!existing) {
    const [created] = await db.insert(categories).values({ name: PENDING_CATEGORY_NAME, group: PENDING_CATEGORY_GROUP, updatedAt: currentTimestamp() }).returning();
    return created;
  }
  invariant(isPendingCategory(existing), "PENDING_CATEGORY_CONFLICT", `Renomeie a categoria "${PENDING_CATEGORY_NAME}" para continuar importando compras do cartão.`);
  if (!existing.isArchived) return existing;
  const [restored] = await db.update(categories).set({ isArchived: false, updatedAt: currentTimestamp() }).where(eq(categories.id, existing.id)).returning();
  return restored;
}
