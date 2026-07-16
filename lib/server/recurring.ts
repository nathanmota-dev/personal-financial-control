import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { recurringTemplates, transactions } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth, serializeTimestamps } from "@/lib/server/finance";
import { createTransaction } from "@/lib/server/transactions";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";

const recurringTemplateSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  type: z.enum(["income", "expense", "investment_contribution"]),
  status: z.enum(["active", "paused", "ended"]).default("active"),
  amountCents: z.number().int().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
  startMonth: z.string(),
  endMonth: z.string().optional(),
  description: z.string().trim().min(1),
});

const updateRecurringTemplateSchema = recurringTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

async function validateRecurringDependencies(
  input: z.infer<typeof recurringTemplateSchema>,
  database: AppDb
) {
  const [account, category] = await Promise.all([
    getAccountById(input.accountId, database),
    getCategoryById(input.categoryId, database),
  ]);

  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
  invariant(!category.isArchived, "CATEGORY_ARCHIVED", "Cannot use an archived category.");

  if (input.type === "income") {
    invariant(
      category.group === "income",
      "CATEGORY_TYPE_MISMATCH",
      "Income recurring entries require an income category."
    );
  }

  if (input.type === "expense") {
    invariant(
      category.group === "fixed_expense" || category.group === "variable_expense",
      "CATEGORY_TYPE_MISMATCH",
      "Expense recurring entries require an expense category."
    );
  }

  if (input.type === "investment_contribution") {
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment recurring entries require an investment category."
    );
    invariant(
      account.type === "checking" || account.type === "savings" || account.type === "cash",
      "INVALID_INVESTMENT_ACCOUNT",
      "Investment recurring entries require a checking, savings, or cash account."
    );
  }
}

export async function createRecurringTemplate(
  input: z.input<typeof recurringTemplateSchema>,
  database?: AppDb
) {
  const db = resolveDb(database);
  const values = recurringTemplateSchema.parse(input);
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
  const db = resolveDb(database);
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

export async function getRecurringTemplateById(id: string, database?: AppDb) {
  const db = resolveDb(database);
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
  const db = resolveDb(database);
  const { id, ...rawValues } = updateRecurringTemplateSchema.parse(input);
  const existing = await getRecurringTemplateById(id, db);
  const values = {
    ...existing,
    ...rawValues,
    endMonth: rawValues.endMonth ?? existing.endMonth ?? undefined,
  };

  values.startMonth = normalizeCompetenceMonth(values.startMonth);
  values.endMonth = values.endMonth ? normalizeCompetenceMonth(values.endMonth) : undefined;
  await validateRecurringDependencies(values, db);

  const [template] = await db
    .update(recurringTemplates)
    .set({
      ...rawValues,
      startMonth: values.startMonth,
      endMonth: values.endMonth,
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, id))
    .returning();

  return serializeTimestamps(template);
}

export async function pauseRecurringTemplate(id: string, database?: AppDb) {
  const db = resolveDb(database);
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
  const db = resolveDb(database);
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

function buildTransactionDate(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const effectiveDay = Math.min(dayOfMonth, lastDay);

  return `${month}-${String(effectiveDay).padStart(2, "0")}`;
}

async function markTemplateGenerated(
  template: typeof recurringTemplates.$inferSelect,
  competenceMonth: string,
  database: AppDb
) {
  const lastGeneratedMonth =
    !template.lastGeneratedMonth || template.lastGeneratedMonth < competenceMonth
      ? competenceMonth
      : template.lastGeneratedMonth;

  await database
    .update(recurringTemplates)
    .set({
      lastGeneratedMonth,
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, template.id));
}

export async function generateRecurringTransactions(month: string, database?: AppDb) {
  const db = resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);

  const templates = await db.query.recurringTemplates.findMany({
    where: and(
      eq(recurringTemplates.status, "active"),
      lte(recurringTemplates.startMonth, competenceMonth),
      or(
        isNull(recurringTemplates.endMonth),
        gte(recurringTemplates.endMonth, competenceMonth)
      )
    ),
  });

  const created = [];

  for (const template of templates) {
    const duplicate = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.recurringTemplateId, template.id),
        eq(transactions.competenceMonth, competenceMonth)
      ),
    });

    if (duplicate) {
      await markTemplateGenerated(template, competenceMonth, db);
      continue;
    }

    const transaction = await createTransaction(
      {
        accountId: template.accountId,
        categoryId: template.categoryId,
        type: template.type,
        amountCents: template.amountCents,
        competenceMonth,
        transactionDate: buildTransactionDate(competenceMonth, template.dayOfMonth),
        description: template.description,
        status: "posted",
        recurringTemplateId: template.id,
      },
      db
    );

    await markTemplateGenerated(template, competenceMonth, db);

    created.push(transaction);
  }

  return created;
}
