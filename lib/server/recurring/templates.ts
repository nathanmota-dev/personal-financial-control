import type { AppDb } from "@/lib/db";
import { recurringTemplates,transactions } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp,normalizeCompetenceMonth,serializeTimestamps } from "@/lib/server/finance";
import {
deleteTransactionInTransaction
} from "@/lib/server/transactions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { RecurringDb,recurringDeleteModeSchema,recurringTemplateSchema,resolveDb,updateRecurringTemplateSchema,validateRecurringDependencies } from "./validation";

export async function createRecurringTemplate(
  input: z.input<typeof recurringTemplateSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const parsedValues = recurringTemplateSchema.parse(input);
  const { name, description: parsedDescription, ...rawValues } = parsedValues;
  const description = name ?? parsedDescription;
  invariant(description, "RECURRING_NAME_REQUIRED", "Informe um nome para a recorrência.");
  const values = {
    ...rawValues,
    description,
    endMonth: rawValues.endMonth ?? undefined,
  };
  values.startMonth = normalizeCompetenceMonth(values.startMonth);
  values.endMonth = values.endMonth ? normalizeCompetenceMonth(values.endMonth) : undefined;
  await validateRecurringDependencies(values, db);

  const [template] = await db
    .insert(recurringTemplates)
    .values({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .returning();

  return serializeTimestamps(template);
}

export async function listRecurringTemplates(database?: AppDb) {
  const db = await resolveDb(database);
  const rows = await db.query.recurringTemplates.findMany({
    with: {
      account: true,
      category: true,
    },
    orderBy: (table, { asc }) => [asc(table.description)],
  });

  return rows.map((row) => ({
    ...serializeTimestamps(row),
    account: row.account ? serializeTimestamps(row.account) : null,
    category: row.category ? serializeTimestamps(row.category) : null,
  }));
}

export async function getRecurringTemplateById(id: string, database?: RecurringDb) {
  const db = await resolveDb(database);
  const template = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, id),
  });

  invariant(template, "RECURRING_TEMPLATE_NOT_FOUND", "Recurring template does not exist.", 404);

  return template;
}

export async function updateRecurringTemplate(
  input: z.input<typeof updateRecurringTemplateSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const { id, ...parsedValues } = updateRecurringTemplateSchema.parse(input);
  const existing = await getRecurringTemplateById(id, db);
  const hasEndMonth = Object.prototype.hasOwnProperty.call(parsedValues, "endMonth");
  const {
    name,
    description: requestedDescription,
    endMonth: requestedEndMonth,
    ...rawValues
  } = parsedValues;
  const resolvedEndMonth = hasEndMonth ? requestedEndMonth : existing.endMonth;
  const values = {
    ...existing,
    ...rawValues,
    description: name ?? requestedDescription ?? existing.description,
    endMonth: resolvedEndMonth ?? null,
  };

  values.startMonth = normalizeCompetenceMonth(values.startMonth);
  values.endMonth = values.endMonth ? normalizeCompetenceMonth(values.endMonth) : null;
  const category = await validateRecurringDependencies(values, db, true);

  const [template] = await db
    .update(recurringTemplates)
    .set({
      ...rawValues,
      categoryId: category.id,
      description: values.description,
      startMonth: values.startMonth,
      endMonth: values.endMonth ?? null,
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, id))
    .returning();

  return serializeTimestamps(template);
}

export async function deleteRecurringTemplate(
  id: string,
  mode: z.input<typeof recurringDeleteModeSchema>,
  database?: AppDb
) {
  const parsedMode = recurringDeleteModeSchema.parse(mode);
  const db = await resolveDb(database);

  await db.transaction(async (transactionDb) => {
    await getRecurringTemplateById(id, transactionDb);

    if (parsedMode === "delete_history") {
      const generatedTransactions = await transactionDb.query.transactions.findMany({
        where: eq(transactions.recurringTemplateId, id),
      });
      for (const transaction of generatedTransactions) {
        await deleteTransactionInTransaction(transaction.id, transactionDb);
      }
    } else {
      await transactionDb
        .update(transactions)
        .set({ recurringTemplateId: null, updatedAt: currentTimestamp() })
        .where(eq(transactions.recurringTemplateId, id));
    }

    await transactionDb.delete(recurringTemplates).where(eq(recurringTemplates.id, id));
  });
}

export async function pauseRecurringTemplate(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  await getRecurringTemplateById(id, db);

  const [template] = await db
    .update(recurringTemplates)
    .set({
      status: "paused",
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, id))
    .returning();

  return serializeTimestamps(template);
}

export async function endRecurringTemplate(
  id: string,
  endMonth: string,
  database?: AppDb
) {
  const db = await resolveDb(database);
  await getRecurringTemplateById(id, db);

  const [template] = await db
    .update(recurringTemplates)
    .set({
      status: "ended",
      endMonth: normalizeCompetenceMonth(endMonth),
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, id))
    .returning();

  return serializeTimestamps(template);
}
