import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { accounts, categories, recurringTemplates, transactions } from "@/lib/db/schema";
import {
  getDefaultCategoryForRecurringType,
  isRecurringCategoryCompatible,
  recurringDefaultCategoryNames,
} from "@/lib/category-defaults";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth, serializeTimestamps } from "@/lib/server/finance";
import {
  createTransaction,
  deleteTransactionInTransaction,
} from "@/lib/server/transactions";

const recurringTemplateFields = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  type: z.enum(["income", "expense", "investment_contribution"]),
  status: z.enum(["active", "paused", "ended"]).default("active"),
  amountCents: z.number().int().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
  startMonth: z.string(),
  endMonth: z.string().nullable().optional(),
  description: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
});

const recurringTemplateSchema = recurringTemplateFields.superRefine((value, context) => {
  if (!value.description && !value.name) {
    context.addIssue({
      code: "custom",
      path: ["name"],
      message: "Informe um nome para a recorrência.",
    });
  }
});

const updateRecurringTemplateSchema = recurringTemplateFields.partial().extend({
  id: z.string().uuid(),
});
const recurringDeleteModeSchema = z.enum(["keep_history", "delete_history"]);

function resolveDb(database?: AppDb): Promise<AppDb>;
function resolveDb(database?: RecurringDb): Promise<RecurringDb>;
async function resolveDb(database?: RecurringDb) {
  return database ?? getFinanceDatabase();
}

type RecurringDb = AppDb | Parameters<Parameters<AppDb["transaction"]>[0]>[0];

async function validateRecurringDependencies(
  input: z.infer<typeof recurringTemplateSchema>,
  database: RecurringDb,
  replaceIncompatibleCategory = false
) {
  const [account, existingCategory] = await Promise.all([
    database.query.accounts.findFirst({ where: eq(accounts.id, input.accountId) }),
    database.query.categories.findFirst({ where: eq(categories.id, input.categoryId) }),
  ]);
  invariant(account, "ACCOUNT_NOT_FOUND", "Account does not exist.", 404);
  invariant(existingCategory, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);
  let category = existingCategory;

  if (!isRecurringCategoryCompatible(category.group, input.type) && replaceIncompatibleCategory) {
    const defaultCategory = await findDefaultCategory(input.type, database);
    category = defaultCategory;
  }

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

  return category;
}

async function findDefaultCategory(
  type: z.infer<typeof recurringTemplateFields>['type'],
  database: RecurringDb
) {
  const defaultCategory = getDefaultCategoryForRecurringType(type);
  const category = await database.query.categories.findFirst({
    where: and(
      eq(categories.name, recurringDefaultCategoryNames[type]),
      eq(categories.group, defaultCategory.group),
      eq(categories.isArchived, false)
    ),
  });

  invariant(
    category,
    "DEFAULT_CATEGORY_NOT_FOUND",
    `The default category ${recurringDefaultCategoryNames[type]} does not exist.`
  );

  return category;
}

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

function buildTransactionDate(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const effectiveDay = Math.min(dayOfMonth, lastDay);

  return `${month}-${String(effectiveDay).padStart(2, "0")}`;
}

async function markTemplateGenerated(
  template: typeof recurringTemplates.$inferSelect,
  competenceMonth: string,
  database: RecurringDb
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
  const db = await resolveDb(database);
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
