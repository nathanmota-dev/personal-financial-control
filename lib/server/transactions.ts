import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";

const transactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  type: z.enum(["income", "expense", "investment_contribution"]),
  status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
  competenceMonth: z.string(),
  description: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  recurringTemplateId: z.string().uuid().optional(),
});

const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
});

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

async function validateTransactionDependencies(
  input: z.infer<typeof transactionSchema>,
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
      "Income transactions require an income category."
    );
  }

  if (input.type === "expense") {
    invariant(
      category.group === "fixed_expense" || category.group === "variable_expense",
      "CATEGORY_TYPE_MISMATCH",
      "Expense transactions require a fixed or variable expense category."
    );
  }

  if (input.type === "investment_contribution") {
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment contribution transactions require an investment category."
    );
  }
}

export async function createTransaction(
  input: z.input<typeof transactionSchema>,
  database?: AppDb
) {
  const db = resolveDb(database);
  const values = transactionSchema.parse(input);
  values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
  values.transactionDate = normalizeDate(values.transactionDate);

  await validateTransactionDependencies(values, db);

  const [transaction] = await db
    .insert(transactions)
    .values({
      ...values,
      isIncludedInInvestmentBalance: values.type !== "investment_contribution",
      updatedAt: currentTimestamp(),
    })
    .returning();

  return serializeTimestamps(transaction);
}

export async function listTransactions(
  filters: {
    competenceMonth?: string;
    accountId?: string;
    categoryId?: string;
    status?: "pending" | "posted" | "cancelled";
  } = {},
  database?: AppDb
) {
  const db = resolveDb(database);
  const where = and(
    filters.competenceMonth
      ? eq(transactions.competenceMonth, normalizeCompetenceMonth(filters.competenceMonth))
      : undefined,
    filters.accountId ? eq(transactions.accountId, filters.accountId) : undefined,
    filters.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
    filters.status ? eq(transactions.status, filters.status) : undefined
  );

  const rows = await db.query.transactions.findMany({
    where,
    with: {
      category: true,
      account: true,
    },
    orderBy: (table, { desc: orderDesc }) => [
      orderDesc(table.transactionDate),
      orderDesc(table.createdAt),
    ],
  });

  return rows.map((row) => ({
    ...serializeTimestamps(row),
    account: row.account ? serializeTimestamps(row.account) : null,
    category: row.category ? serializeTimestamps(row.category) : null,
  }));
}

export async function getTransactionById(id: string, database?: AppDb) {
  const db = resolveDb(database);
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  invariant(transaction, "TRANSACTION_NOT_FOUND", "Transaction does not exist.", 404);

  return transaction;
}

export async function updateTransaction(
  input: z.input<typeof updateTransactionSchema>,
  database?: AppDb
) {
  const db = resolveDb(database);
  const { id, ...rawValues } = updateTransactionSchema.parse(input);
  const existing = await getTransactionById(id, db);

  const values = {
    ...existing,
    ...rawValues,
    notes: rawValues.notes ?? existing.notes ?? undefined,
    recurringTemplateId:
      rawValues.recurringTemplateId ?? existing.recurringTemplateId ?? undefined,
  };
  values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
  values.transactionDate = normalizeDate(values.transactionDate);

  await validateTransactionDependencies(values, db);

  const isIncludedInInvestmentBalance =
    values.type === "investment_contribution"
      ? existing.type === "investment_contribution"
        ? existing.isIncludedInInvestmentBalance
        : false
      : true;

  const [transaction] = await db
    .update(transactions)
    .set({
      ...rawValues,
      competenceMonth: values.competenceMonth,
      transactionDate: values.transactionDate,
      isIncludedInInvestmentBalance,
      updatedAt: currentTimestamp(),
    })
    .where(eq(transactions.id, id))
    .returning();

  return serializeTimestamps(transaction);
}

export async function deleteTransaction(id: string, database?: AppDb) {
  const db = resolveDb(database);
  await getTransactionById(id, db);
  await db.delete(transactions).where(eq(transactions.id, id));
}
