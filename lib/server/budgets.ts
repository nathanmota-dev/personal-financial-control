import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getFinanceDatabase, type AppDb } from "@/lib/db";
import { categories, monthlyBudgets } from "@/lib/db/schema";
import { aggregateBudgets } from "@/lib/budget-aggregation";
import { buildRecentMonths, isValidMonth } from "@/lib/finance-ui";
import type { BudgetInput, BudgetOverview } from "@/lib/interfaces/budgets";
import { listCategories } from "@/lib/server/categories";
import { readDashboardRecords } from "@/lib/server/dashboard-records";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";

const monthSchema = z.string().refine(isValidMonth, "Informe uma competência válida.");
const keySchema = z.object({ categoryId: z.string().uuid(), competenceMonth: monthSchema });
const limitSchema = keySchema.extend({ amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
const expenseGroups = new Set(["fixed_expense", "variable_expense"]);

export async function saveBudget(input: BudgetInput, database?: AppDb) {
  const values = limitSchema.parse(input);
  const db = database ?? await getFinanceDatabase();
  return db.transaction(async (tx) => {
    const category = await tx.query.categories.findFirst({ where: eq(categories.id, values.categoryId) });
    invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);
    invariant(expenseGroups.has(category.group), "INVALID_CATEGORY", "Selecione uma categoria de despesa.");
    const existing = await tx.query.monthlyBudgets.findFirst({ where: and(eq(monthlyBudgets.categoryId, values.categoryId), eq(monthlyBudgets.competenceMonth, values.competenceMonth)) });
    invariant(!category.isArchived || existing, "ARCHIVED_CATEGORY", "Categorias arquivadas não aceitam novos limites.");
    await tx.insert(monthlyBudgets).values(values).onConflictDoUpdate({
      target: [monthlyBudgets.categoryId, monthlyBudgets.competenceMonthHash],
      set: { amountCents: values.amountCents, updatedAt: currentTimestamp() },
    });
  });
}

export async function removeBudget(input: Omit<BudgetInput, "amountCents">, database?: AppDb) {
  const values = keySchema.parse(input);
  const db = database ?? await getFinanceDatabase();
  await db.delete(monthlyBudgets).where(and(eq(monthlyBudgets.categoryId, values.categoryId), eq(monthlyBudgets.competenceMonth, values.competenceMonth)));
}

export async function copyPreviousBudgets(month: string, database?: AppDb) {
  monthSchema.parse(month);
  const previous = buildRecentMonths(2, month)[1];
  const db = database ?? await getFinanceDatabase();
  return db.transaction(async (tx) => {
    const categoryRows = await tx.query.categories.findMany({ where: eq(categories.isArchived, false) });
    const eligible = new Set(categoryRows.filter((item) => expenseGroups.has(item.group)).map((item) => item.id));
    const limits = await tx.query.monthlyBudgets.findMany({ where: eq(monthlyBudgets.competenceMonth, previous) });
    let copied = 0;
    for (const limit of limits) {
      if (!eligible.has(limit.categoryId)) continue;
      const inserted = await tx.insert(monthlyBudgets).values({ categoryId: limit.categoryId, competenceMonth: month, amountCents: limit.amountCents }).onConflictDoNothing().returning();
      copied += inserted.length;
    }
    return copied;
  });
}

export async function getBudgetOverview(month: string, database?: AppDb): Promise<BudgetOverview> {
  monthSchema.parse(month);
  const db = database ?? await getFinanceDatabase();
  const [categories, limits, records] = await Promise.all([
    listCategories({ includeArchived: true }, db),
    db.query.monthlyBudgets.findMany({ where: eq(monthlyBudgets.competenceMonth, month) }),
    readDashboardRecords([month], db),
  ]);
  const ledger = new Map(records.activeTransactions.map((item) => [item.id, item]));
  const expenses = records.expenses.map((expense) => {
    const transaction = ledger.get(expense.id);
    return { id: expense.id, categoryId: expense.category?.id ?? null,
      categoryName: expense.category?.name ?? "Sem categoria", accountName: expense.account?.name ?? "Conta indisponível",
      amountCents: expense.amountCents, date: expense.expenseDate, description: expense.description,
      pending: transaction?.status === "pending",
      origin: transaction ? transaction.recurringTemplateId ? "Recorrência gerada" : "Lançamento" : "Parcela / ajuste de cartão",
    };
  });
  const rows = aggregateBudgets(categories, limits, expenses);
  return { month, categories: categories.filter((item) => !item.isArchived && expenseGroups.has(item.group)), rows,
    committedCents: rows.reduce((sum, row) => sum + row.committedCents, 0) };
}
