import { eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { categories, recurringTemplates, transactions } from "@/lib/db/schema";
import { DomainError, invariant } from "@/lib/server/errors";
import { currentTimestamp, serializeTimestamps } from "@/lib/server/finance";

const categorySchema = z.object({
  name: z.string().trim().min(1),
  group: z.enum(["income", "fixed_expense", "variable_expense", "investment"]),
});

const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().uuid(),
});

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

export async function createCategory(input: z.input<typeof categorySchema>, database?: AppDb) {
  const db = resolveDb(database);
  const values = categorySchema.parse(input);

  const [category] = await db
    .insert(categories)
    .values({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .returning();

  return serializeTimestamps(category);
}

export async function listCategories(
  options?: { includeArchived?: boolean },
  database?: AppDb
) {
  const db = resolveDb(database);
  const rows = await db.query.categories.findMany({
    where: options?.includeArchived ? undefined : eq(categories.isArchived, false),
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return rows.map(serializeTimestamps);
}

export async function getCategoryById(id: string, database?: AppDb) {
  const db = resolveDb(database);
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);

  return category;
}

export async function updateCategory(input: z.input<typeof updateCategorySchema>, database?: AppDb) {
  const db = resolveDb(database);
  const { id, ...values } = updateCategorySchema.parse(input);
  await getCategoryById(id, db);

  const [category] = await db
    .update(categories)
    .set({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .where(eq(categories.id, id))
    .returning();

  return serializeTimestamps(category);
}

export async function archiveCategory(id: string, database?: AppDb) {
  const db = resolveDb(database);
  await getCategoryById(id, db);

  const [category] = await db
    .update(categories)
    .set({
      isArchived: true,
      updatedAt: currentTimestamp(),
    })
    .where(eq(categories.id, id))
    .returning();

  return serializeTimestamps(category);
}

export async function deleteCategory(id: string, database?: AppDb) {
  const db = resolveDb(database);
  await getCategoryById(id, db);

  const usage = await db.query.transactions.findFirst({
    where: eq(transactions.categoryId, id),
  });
  const recurringUsage = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.categoryId, id),
  });

  if (usage || recurringUsage) {
    throw new DomainError(
      "CATEGORY_IN_USE",
      "Category cannot be deleted because it is already used in transactions or recurring templates."
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
}
