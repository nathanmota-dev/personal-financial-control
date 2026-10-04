import {
getDefaultCategoryForRecurringType,
isRecurringCategoryCompatible,
recurringDefaultCategoryNames,
} from "@/lib/category-defaults";
import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { accounts,categories } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { and,eq } from "drizzle-orm";
import { z } from "zod";


export const recurringTemplateFields = z.object({
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

export const recurringTemplateSchema = recurringTemplateFields.superRefine((value, context) => {
  if (!value.description && !value.name) {
    context.addIssue({
      code: "custom",
      path: ["name"],
      message: "Informe um nome para a recorrência.",
    });
  }
});

export const updateRecurringTemplateSchema = recurringTemplateFields.partial().extend({
  id: z.string().uuid(),
});

export const recurringDeleteModeSchema = z.enum(["keep_history", "delete_history"]);

export function resolveDb(database?: AppDb): Promise<AppDb>;

export function resolveDb(database?: RecurringDb): Promise<RecurringDb>;

export async function resolveDb(database?: RecurringDb) {
  return database ?? getFinanceDatabase();
}

export type RecurringDb = AppDb | Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export async function validateRecurringDependencies(
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

export async function findDefaultCategory(
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
