import { eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { defaultCategories } from "@/lib/category-defaults";
import { categories, creditCardCharges, recurringTemplates, transactions } from "@/lib/db/schema";
import { DomainError, invariant } from "@/lib/server/errors";
import { currentTimestamp, serializeTimestamps } from "@/lib/server/finance";

const categorySchema = z.object({
  name: z.string().trim().min(1),
  group: z.enum(["income", "fixed_expense", "variable_expense", "investment"]),
});

const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().uuid(),
});

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export async function createCategory(input: z.input<typeof categorySchema>, database?: AppDb) {
  const db = await resolveDb(database);
  const values = categorySchema.parse(input);

  // The default-category migration is intentionally idempotent. Treat a
  // repeated request for the same name and group the same way so callers can
  // safely provision the defaults in an already-migrated database.
  const existing = await db.query.categories.findFirst({
    where: eq(categories.name, values.name),
  });
  const isDefaultCategory = defaultCategories.some(
    (category) => category.name === values.name && category.group === values.group
  );
  if (isDefaultCategory && existing?.group === values.group) {
    return serializeTimestamps(existing);
  }

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
  const db = await resolveDb(database);
  const rows = await db.query.categories.findMany({
    where: options?.includeArchived ? undefined : eq(categories.isArchived, false),
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return rows.map(serializeTimestamps);
}

export async function getCategoryById(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);

  return category;
}

export async function updateCategory(input: z.input<typeof updateCategorySchema>, database?: AppDb) {
  const db = await resolveDb(database);
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
  const db = await resolveDb(database);
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
  const db = await resolveDb(database);
  await getCategoryById(id, db);

  const usage = await db.query.transactions.findFirst({
    where: eq(transactions.categoryId, id),
  });
  const recurringUsage = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.categoryId, id),
  });
  const creditCardUsage = await db.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.categoryId, id),
  });

  if (usage || recurringUsage || creditCardUsage) {
    throw new DomainError(
      "CATEGORY_IN_USE",
      "Category cannot be deleted because it is already used in transactions, recurring templates, or credit card charges."
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
}
