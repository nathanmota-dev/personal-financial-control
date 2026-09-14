import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { investmentReductionSelectionSchema } from "@/lib/server/investment-reconciliation";
import {
  applyInvestmentReductionInExistingTransaction,
  reverseInvestmentReductionForTransaction,
} from "@/lib/server/investment-reconciliation";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";

const transactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum([
    "income",
    "expense",
    "investment_contribution",
    "investment_withdrawal",
  ]),
  status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
  competenceMonth: z.string(),
  description: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  recurringTemplateId: z.string().uuid().optional(),
  sourceSelections: z.array(investmentReductionSelectionSchema).optional(),
  sources: z.array(investmentReductionSelectionSchema).optional(),
});

const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
});

async function resolveDb(database?: TransactionDb) {
  return database ?? getFinanceDatabase();
}

export type TransactionDb = AppDb | Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type TransactionDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

async function validateTransactionDependencies(
  input: z.infer<typeof transactionSchema>,
  database: TransactionDb
) {
  const categoryId = input.categoryId;
  const [account, category] = await Promise.all([
    database.query.accounts.findFirst({ where: (table, { eq }) => eq(table.id, input.accountId) }),
    categoryId
      ? database.query.categories.findFirst({ where: (table, { eq }) => eq(table.id, categoryId) })
      : Promise.resolve(null),
  ]);

  invariant(account, "ACCOUNT_NOT_FOUND", "Account does not exist.", 404);

  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
  if (!input.categoryId) {
    invariant(
      input.type !== "investment_contribution" && input.type !== "investment_withdrawal",
      "CATEGORY_REQUIRED",
      "Investment movements require a category."
    );
    return;
  }

  invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);
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

  if (
    input.type === "investment_contribution" ||
    input.type === "investment_withdrawal"
  ) {
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment movements require an investment category."
    );
    invariant(
      account.type === "checking" || account.type === "savings" || account.type === "cash",
      "INVALID_INVESTMENT_ACCOUNT",
      "Investment movements require a checking, savings, or cash account."
    );
  }
}

export async function createTransaction(
  input: z.input<typeof transactionSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = transactionSchema.parse(input);
  values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
  values.transactionDate = normalizeDate(values.transactionDate);

  return db.transaction(async (transactionDb) => {
    await validateTransactionDependencies(values, transactionDb);
    const isInvestmentMovement = isInvestmentMovementType(values.type);
    const portfolio = isInvestmentMovement
      ? await transactionDb.query.investmentPortfolio.findFirst()
      : null;
    const isIncludedInInvestmentCheckpoint = isInvestmentMovement
      ? Boolean(portfolio && values.transactionDate <= portfolio.checkpointDate)
      : true;
    const {
      sourceSelections,
      sources,
      ...transactionValues
    } = values;

    const [created] = await transactionDb
      .insert(transactions)
      .values({
        ...transactionValues,
        categoryId: values.categoryId ?? null,
        isIncludedInInvestmentCheckpoint,
        updatedAt: currentTimestamp(),
      })
      .returning();
    invariant(created, "TRANSACTION_CREATE_FAILED", "Transaction could not be created.", 500);

    if (
      isEffectiveInvestmentWithdrawal({
        ...values,
        isIncludedInInvestmentCheckpoint,
      })
    ) {
      await applyInvestmentReductionInExistingTransaction(transactionDb, {
        amountCents: values.amountCents,
        eventType: "withdrawal",
        transactionId: created.id,
        occurredOn: values.transactionDate,
        sourceSelections: sourceSelections ?? sources,
      });
    }

    return serializeTimestamps(created);
  });
}

export async function listTransactions(
  filters: {
    competenceMonth?: string;
    accountId?: string;
    categoryId?: string;
    uncategorized?: boolean;
    status?: "pending" | "posted" | "cancelled";
  } = {},
  database?: AppDb
) {
  const db = await resolveDb(database);
  const where = and(
    filters.competenceMonth
      ? eq(transactions.competenceMonth, normalizeCompetenceMonth(filters.competenceMonth))
      : undefined,
    filters.accountId ? eq(transactions.accountId, filters.accountId) : undefined,
    filters.uncategorized
      ? isNull(transactions.categoryId)
      : filters.categoryId
        ? eq(transactions.categoryId, filters.categoryId)
        : undefined,
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

export async function getTransactionById(id: string, database?: TransactionDb) {
  const db = await resolveDb(database);
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
  const db = await resolveDb(database);
  const { id, ...rawValues } = updateTransactionSchema.parse(input);

  return db.transaction(async (transactionDb) => {
    const existing = await getTransactionById(id, transactionDb);
    const {
      categoryId: requestedCategoryId,
      notes: requestedNotes,
      recurringTemplateId: requestedRecurringTemplateId,
      sourceSelections,
      sources,
      ...transactionValues
    } = rawValues;
    const values = {
      ...existing,
      ...transactionValues,
      categoryId:
        requestedCategoryId === undefined ? existing.categoryId : requestedCategoryId,
      notes: requestedNotes === undefined ? existing.notes ?? undefined : requestedNotes,
      recurringTemplateId:
        requestedRecurringTemplateId === undefined
          ? existing.recurringTemplateId ?? undefined
          : requestedRecurringTemplateId,
    };
    values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
    values.transactionDate = normalizeDate(values.transactionDate);

    const isInvestmentMovement = isInvestmentMovementType(values.type);
    const portfolio = isInvestmentMovement
      ? await transactionDb.query.investmentPortfolio.findFirst()
      : null;
    const isIncludedInInvestmentCheckpoint = isInvestmentMovement
      ? Boolean(portfolio && values.transactionDate <= portfolio.checkpointDate)
      : true;

    if (isEffectiveInvestmentWithdrawal(existing)) {
      await reverseInvestmentReductionForTransaction(id, transactionDb);
    }

    await validateTransactionDependencies(values, transactionDb);
    const [updated] = await transactionDb
      .update(transactions)
      .set({
        ...transactionValues,
        categoryId: values.categoryId ?? null,
        notes: values.notes,
        recurringTemplateId: values.recurringTemplateId,
        competenceMonth: values.competenceMonth,
        transactionDate: values.transactionDate,
        isIncludedInInvestmentCheckpoint,
        updatedAt: currentTimestamp(),
      })
      .where(eq(transactions.id, id))
      .returning();
    invariant(updated, "TRANSACTION_UPDATE_FAILED", "Transaction could not be updated.", 500);

    if (
      isEffectiveInvestmentWithdrawal({
        ...values,
        isIncludedInInvestmentCheckpoint,
      })
    ) {
      await applyInvestmentReductionInExistingTransaction(transactionDb, {
        amountCents: values.amountCents,
        eventType: "withdrawal",
        transactionId: updated.id,
        occurredOn: values.transactionDate,
        sourceSelections: sourceSelections ?? sources,
      });
    }

    return serializeTimestamps(updated);
  });
}

function isInvestmentMovementType(
  type: "income" | "expense" | "investment_contribution" | "investment_withdrawal"
) {
  return type === "investment_contribution" || type === "investment_withdrawal";
}

function isEffectiveInvestmentWithdrawal(
  value: {
    type: "income" | "expense" | "investment_contribution" | "investment_withdrawal";
    status: "pending" | "posted" | "cancelled";
    transactionDate: string;
    isIncludedInInvestmentCheckpoint?: boolean;
  }
) {
  return (
    value.type === "investment_withdrawal" &&
    value.status === "posted" &&
    value.transactionDate <= getFinanceToday() &&
    value.isIncludedInInvestmentCheckpoint !== true
  );
}

export async function deleteTransaction(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  await db.transaction((transactionDb) => deleteTransactionInTransaction(id, transactionDb));
}

export async function deleteTransactionInTransaction(
  id: string,
  database: TransactionDbTransaction
) {
  const existing = await getTransactionById(id, database);
  if (isEffectiveInvestmentWithdrawal(existing)) {
    await reverseInvestmentReductionForTransaction(id, database);
  }
  await database.delete(transactions).where(eq(transactions.id, id));
}
