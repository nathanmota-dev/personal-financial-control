import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  categories,
  transactionFundingLinks,
  transactions,
} from "@/lib/db/schema";
import type {
  TransactionFundingLink,
  TransactionFundingSource,
} from "@/lib/interfaces/transaction-funding";
import { investmentReductionSelectionSchema } from "@/lib/server/investment-reconciliation";
import {
  applyInvestmentReductionInExistingTransaction,
  getInvestmentReductionSources,
  reverseInvestmentReductionForTransaction,
} from "@/lib/server/investment-reconciliation";
import { invariant } from "@/lib/server/errors";
import {
  currentTimestamp,
  normalizeCompetenceMonth,
  normalizeDate,
  serializeTimestamps,
} from "@/lib/server/finance";
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
  fundingSource: z.enum(["account", "investments"]).optional(),
  sourceSelections: z.array(investmentReductionSelectionSchema).optional(),
  sources: z.array(investmentReductionSelectionSchema).optional(),
});

const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
});

type TransactionValues = z.infer<typeof transactionSchema>;
type TransactionDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type TransactionLinkRow = typeof transactionFundingLinks.$inferSelect;

async function resolveDb(database?: TransactionDb) {
  return database ?? getFinanceDatabase();
}

export type TransactionDb = AppDb | TransactionDbTransaction;

function sourceSelectionsFromInput(input: {
  sourceSelections?: TransactionValues["sourceSelections"];
  sources?: TransactionValues["sources"];
}) {
  return input.sourceSelections ?? input.sources;
}

function isLiquidAccountType(type: string) {
  return type === "checking" || type === "savings" || type === "cash";
}

function isInvestmentMovementType(type: TransactionValues["type"]) {
  return type === "investment_contribution" || type === "investment_withdrawal";
}

function automaticWithdrawalDescription(description: string) {
  return `Resgate automático: ${description}`;
}

async function findInvestmentFundingCategory(database: TransactionDb) {
  const category = await database.query.categories.findFirst({
    where: and(
      eq(categories.name, "Investimentos"),
      eq(categories.group, "investment"),
      eq(categories.isArchived, false)
    ),
  });

  invariant(
    category,
    "INVESTMENT_FUNDING_CATEGORY_NOT_FOUND",
    'Crie ou reative a categoria de investimento "Investimentos" antes de pagar uma despesa com investimentos.'
  );

  return category;
}

async function validateTransactionDependencies(
  input: TransactionValues,
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
  if (input.type === "expense" && input.fundingSource === "investments") {
    invariant(
      isLiquidAccountType(account.type),
      "INVALID_FUNDING_ACCOUNT",
      "Despesas pagas com investimentos exigem uma conta corrente, poupança ou dinheiro."
    );
  }
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

  if (isInvestmentMovementType(input.type)) {
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment movements require an investment category."
    );
    invariant(
      isLiquidAccountType(account.type),
      "INVALID_INVESTMENT_ACCOUNT",
      "Investment movements require a checking, savings, or cash account."
    );
  }
}

function shouldCreateInvestmentFundedExpense(values: TransactionValues) {
  const fundingSource = values.fundingSource ?? "account";

  invariant(
    fundingSource === "account" || values.type === "expense",
    "INVALID_FUNDING_SOURCE",
    "A origem Investimentos só pode ser usada em despesas manuais."
  );
  invariant(
    fundingSource !== "investments" || !values.recurringTemplateId,
    "INVALID_FUNDING_SOURCE",
    "Recorrências continuam sendo financiadas pela conta configurada."
  );

  return values.type === "expense" && fundingSource === "investments";
}

async function investmentCheckpointFlag(
  database: TransactionDb,
  type: TransactionValues["type"],
  transactionDate: string
) {
  if (!isInvestmentMovementType(type)) {
    return true;
  }

  const portfolio = await database.query.investmentPortfolio.findFirst();
  return Boolean(portfolio && transactionDate <= portfolio.checkpointDate);
}

async function insertTransactionRecord(
  database: TransactionDbTransaction,
  values: {
    accountId: string;
    categoryId: string | null;
    type: TransactionValues["type"];
    status: TransactionValues["status"];
    amountCents: number;
    transactionDate: string;
    competenceMonth: string;
    description: string;
    notes?: string;
    recurringTemplateId?: string;
    isIncludedInInvestmentCheckpoint: boolean;
  }
) {
  const [created] = await database
    .insert(transactions)
    .values({
      ...values,
      notes: values.notes ?? null,
      recurringTemplateId: values.recurringTemplateId ?? null,
      updatedAt: currentTimestamp(),
    })
    .returning();

  invariant(created, "TRANSACTION_CREATE_FAILED", "Transaction could not be created.", 500);
  return created;
}

async function applyReductionIfEffective(
  database: TransactionDbTransaction,
  values: TransactionValues,
  transactionId: string,
  isIncludedInInvestmentCheckpoint: boolean
) {
  if (
    !isEffectiveInvestmentWithdrawal({
      ...values,
      isIncludedInInvestmentCheckpoint,
    })
  ) {
    return;
  }

  await applyInvestmentReductionInExistingTransaction(database, {
    amountCents: values.amountCents,
    eventType: "withdrawal",
    transactionId,
    occurredOn: values.transactionDate,
    sourceSelections: sourceSelectionsFromInput(values),
  });
}

async function createSingleTransactionInTransaction(
  database: TransactionDbTransaction,
  values: TransactionValues
) {
  await validateTransactionDependencies(values, database);
  const isIncludedInInvestmentCheckpoint = await investmentCheckpointFlag(
    database,
    values.type,
    values.transactionDate
  );
  const created = await insertTransactionRecord(database, {
    accountId: values.accountId,
    categoryId: values.categoryId ?? null,
    type: values.type,
    status: values.status,
    amountCents: values.amountCents,
    transactionDate: values.transactionDate,
    competenceMonth: values.competenceMonth,
    description: values.description,
    notes: values.notes,
    recurringTemplateId: values.recurringTemplateId,
    isIncludedInInvestmentCheckpoint,
  });

  await applyReductionIfEffective(
    database,
    values,
    created.id,
    isIncludedInInvestmentCheckpoint
  );

  return created;
}

async function createInvestmentFundedExpenseInTransaction(
  database: TransactionDbTransaction,
  values: TransactionValues
) {
  await validateTransactionDependencies(values, database);
  const investmentCategory = await findInvestmentFundingCategory(database);
  const withdrawalValues: TransactionValues = {
    ...values,
    categoryId: investmentCategory.id,
    type: "investment_withdrawal",
    description: automaticWithdrawalDescription(values.description),
    fundingSource: undefined,
    sourceSelections: values.sourceSelections,
    sources: values.sources,
  };
  await validateTransactionDependencies(withdrawalValues, database);

  const isIncludedInInvestmentCheckpoint = await investmentCheckpointFlag(
    database,
    withdrawalValues.type,
    withdrawalValues.transactionDate
  );
  const expense = await insertTransactionRecord(database, {
    accountId: values.accountId,
    categoryId: values.categoryId ?? null,
    type: "expense",
    status: values.status,
    amountCents: values.amountCents,
    transactionDate: values.transactionDate,
    competenceMonth: values.competenceMonth,
    description: values.description,
    notes: values.notes,
    recurringTemplateId: values.recurringTemplateId,
    isIncludedInInvestmentCheckpoint: true,
  });
  const withdrawal = await insertTransactionRecord(database, {
    accountId: withdrawalValues.accountId,
    categoryId: withdrawalValues.categoryId ?? null,
    type: withdrawalValues.type,
    status: withdrawalValues.status,
    amountCents: withdrawalValues.amountCents,
    transactionDate: withdrawalValues.transactionDate,
    competenceMonth: withdrawalValues.competenceMonth,
    description: withdrawalValues.description,
    notes: withdrawalValues.notes,
    isIncludedInInvestmentCheckpoint,
  });

  const [link] = await database
    .insert(transactionFundingLinks)
    .values({
      expenseTransactionId: expense.id,
      withdrawalTransactionId: withdrawal.id,
      type: "investment_funded_expense",
      updatedAt: currentTimestamp(),
    })
    .returning();
  invariant(link, "TRANSACTION_FUNDING_LINK_FAILED", "Não foi possível vincular a despesa ao resgate automático.", 500);

  await applyReductionIfEffective(
    database,
    withdrawalValues,
    withdrawal.id,
    isIncludedInInvestmentCheckpoint
  );

  return expense;
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
    const created = shouldCreateInvestmentFundedExpense(values)
      ? await createInvestmentFundedExpenseInTransaction(transactionDb, values)
      : await createSingleTransactionInTransaction(transactionDb, values);

    return serializeTimestamps(created);
  });
}

function fundingLinkForTransaction(
  link: TransactionLinkRow | undefined,
  transactionId: string
) {
  if (!link) {
    return null;
  }

  return {
    link,
    isExpense: link.expenseTransactionId === transactionId,
    isWithdrawal: link.withdrawalTransactionId === transactionId,
  };
}

function serializeFundingLink(link: TransactionLinkRow): TransactionFundingLink {
  return {
    id: link.id,
    expenseTransactionId: link.expenseTransactionId,
    withdrawalTransactionId: link.withdrawalTransactionId,
    type: link.type,
  };
}

async function getFundingLinkForTransaction(
  transactionId: string,
  database: TransactionDb
) {
  return database.query.transactionFundingLinks.findFirst({
    where: or(
      eq(transactionFundingLinks.expenseTransactionId, transactionId),
      eq(transactionFundingLinks.withdrawalTransactionId, transactionId)
    ),
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

  const [rows, fundingLinks] = await Promise.all([
    db.query.transactions.findMany({
      where,
      with: {
        category: true,
        account: true,
      },
      orderBy: (table, { desc: orderDesc }) => [
        orderDesc(table.transactionDate),
        orderDesc(table.createdAt),
      ],
    }),
    db.query.transactionFundingLinks.findMany(),
  ]);
  const linksByTransactionId = new Map<string, TransactionLinkRow>();

  for (const link of fundingLinks) {
    linksByTransactionId.set(link.expenseTransactionId, link);
    linksByTransactionId.set(link.withdrawalTransactionId, link);
  }

  return rows.map((row) => {
    const link = linksByTransactionId.get(row.id);
    const relation = fundingLinkForTransaction(link, row.id);

    return {
      ...serializeTimestamps(row),
      fundingSource: relation ? ("investments" as const) : ("account" as const),
      fundingLink: relation ? serializeFundingLink(relation.link) : null,
      isGeneratedByFunding: relation?.isWithdrawal ?? false,
      account: row.account ? serializeTimestamps(row.account) : null,
      category: row.category ? serializeTimestamps(row.category) : null,
    };
  });
}

export async function getTransactionById(id: string, database?: TransactionDb) {
  const db = await resolveDb(database);
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  invariant(transaction, "TRANSACTION_NOT_FOUND", "Transaction does not exist.", 404);

  return transaction;
}

function resolvedTransactionValues(
  existing: typeof transactions.$inferSelect,
  rawValues: Omit<z.infer<typeof updateTransactionSchema>, "id">,
  fundingSource: TransactionFundingSource
): TransactionValues {
  return {
    accountId: rawValues.accountId ?? existing.accountId,
    categoryId:
      rawValues.categoryId === undefined ? existing.categoryId : rawValues.categoryId,
    type: rawValues.type ?? existing.type,
    status: rawValues.status ?? existing.status,
    amountCents: rawValues.amountCents ?? existing.amountCents,
    transactionDate: rawValues.transactionDate ?? existing.transactionDate,
    competenceMonth: rawValues.competenceMonth ?? existing.competenceMonth,
    description: rawValues.description ?? existing.description,
    notes: rawValues.notes === undefined ? existing.notes ?? undefined : rawValues.notes,
    recurringTemplateId:
      rawValues.recurringTemplateId === undefined
        ? existing.recurringTemplateId ?? undefined
        : rawValues.recurringTemplateId,
    fundingSource,
    sourceSelections: rawValues.sourceSelections,
    sources: rawValues.sources,
  };
}

async function previousSelectionsForTransaction(
  transactionId: string,
  database: TransactionDbTransaction
) {
  const result = await getInvestmentReductionSources(database, { transactionId });
  return result.previousSelections;
}

function selectionTotal(selections: Array<{ amountCents: number }>) {
  return selections.reduce((total, selection) => total + selection.amountCents, 0);
}

async function deleteFundingPairInTransaction(
  link: TransactionLinkRow,
  database: TransactionDbTransaction,
  withdrawal?: typeof transactions.$inferSelect
) {
  const pairedWithdrawal = withdrawal ?? (await getTransactionById(link.withdrawalTransactionId, database));
  if (isEffectiveInvestmentWithdrawal(pairedWithdrawal)) {
    await reverseInvestmentReductionForTransaction(pairedWithdrawal.id, database);
  }

  await database.delete(transactionFundingLinks).where(eq(transactionFundingLinks.id, link.id));
  await database.delete(transactions).where(eq(transactions.id, pairedWithdrawal.id));
}

async function updateSingleTransactionInTransaction(
  id: string,
  existing: typeof transactions.$inferSelect,
  values: TransactionValues,
  database: TransactionDbTransaction
) {
  const isIncludedInInvestmentCheckpoint = await investmentCheckpointFlag(
    database,
    values.type,
    values.transactionDate
  );

  await validateTransactionDependencies(values, database);
  if (isEffectiveInvestmentWithdrawal(existing)) {
    await reverseInvestmentReductionForTransaction(id, database);
  }

  const [updated] = await database
    .update(transactions)
    .set({
      accountId: values.accountId,
      categoryId: values.categoryId ?? null,
      type: values.type,
      status: values.status,
      amountCents: values.amountCents,
      transactionDate: values.transactionDate,
      competenceMonth: values.competenceMonth,
      description: values.description,
      notes: values.notes ?? null,
      recurringTemplateId: values.recurringTemplateId ?? null,
      isIncludedInInvestmentCheckpoint,
      updatedAt: currentTimestamp(),
    })
    .where(eq(transactions.id, id))
    .returning();
  invariant(updated, "TRANSACTION_UPDATE_FAILED", "Transaction could not be updated.", 500);

  await applyReductionIfEffective(
    database,
    values,
    updated.id,
    isIncludedInInvestmentCheckpoint
  );

  return updated;
}

async function updateInvestmentFundedExpenseInTransaction(
  id: string,
  existingLink: TransactionLinkRow,
  rawValues: Omit<z.infer<typeof updateTransactionSchema>, "id">,
  values: TransactionValues,
  database: TransactionDbTransaction
) {
  const existingWithdrawal = await getTransactionById(
    existingLink.withdrawalTransactionId,
    database
  );
  const requestedSelections = sourceSelectionsFromInput(rawValues);
  const previousSelections = requestedSelections
    ? []
    : await previousSelectionsForTransaction(existingWithdrawal.id, database);

  await validateTransactionDependencies(values, database);
  const investmentCategory = await findInvestmentFundingCategory(database);
  const withdrawalValues: TransactionValues = {
    ...values,
    categoryId: investmentCategory.id,
    type: "investment_withdrawal",
    description: automaticWithdrawalDescription(values.description),
    fundingSource: undefined,
  };
  await validateTransactionDependencies(withdrawalValues, database);

  if (isEffectiveInvestmentWithdrawal(existingWithdrawal)) {
    await reverseInvestmentReductionForTransaction(existingWithdrawal.id, database);
  }

  const isIncludedInInvestmentCheckpoint = await investmentCheckpointFlag(
    database,
    withdrawalValues.type,
    withdrawalValues.transactionDate
  );
  const selections =
    requestedSelections ??
    (selectionTotal(previousSelections) === withdrawalValues.amountCents
      ? previousSelections
      : undefined);

  const [updatedExpense] = await database
    .update(transactions)
    .set({
      accountId: values.accountId,
      categoryId: values.categoryId ?? null,
      type: "expense",
      status: values.status,
      amountCents: values.amountCents,
      transactionDate: values.transactionDate,
      competenceMonth: values.competenceMonth,
      description: values.description,
      notes: values.notes ?? null,
      recurringTemplateId: values.recurringTemplateId ?? null,
      isIncludedInInvestmentCheckpoint: true,
      updatedAt: currentTimestamp(),
    })
    .where(eq(transactions.id, id))
    .returning();
  invariant(updatedExpense, "TRANSACTION_UPDATE_FAILED", "Transaction could not be updated.", 500);

  const [updatedWithdrawal] = await database
    .update(transactions)
    .set({
      accountId: values.accountId,
      categoryId: investmentCategory.id,
      type: "investment_withdrawal",
      status: values.status,
      amountCents: values.amountCents,
      transactionDate: values.transactionDate,
      competenceMonth: values.competenceMonth,
      description: withdrawalValues.description,
      notes: values.notes ?? null,
      recurringTemplateId: null,
      isIncludedInInvestmentCheckpoint,
      updatedAt: currentTimestamp(),
    })
    .where(eq(transactions.id, existingWithdrawal.id))
    .returning();
  invariant(updatedWithdrawal, "TRANSACTION_UPDATE_FAILED", "Transaction could not be updated.", 500);

  await applyReductionIfEffective(
    database,
    { ...withdrawalValues, sourceSelections: selections, sources: undefined },
    updatedWithdrawal.id,
    isIncludedInInvestmentCheckpoint
  );

  return updatedExpense;
}

export async function updateTransaction(
  input: z.input<typeof updateTransactionSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const parsedInput = updateTransactionSchema.parse(input);
  const { id, ...rawValues } = parsedInput;

  return db.transaction(async (transactionDb) => {
    const existing = await getTransactionById(id, transactionDb);
    const existingLink = await getFundingLinkForTransaction(id, transactionDb);
    const linkRelation = fundingLinkForTransaction(existingLink, id);

    invariant(
      !linkRelation?.isWithdrawal,
      "MANAGED_TRANSACTION",
      "Este resgate automático é gerenciado pela despesa vinculada. Edite a despesa para alterá-lo."
    );

    const targetType = rawValues.type ?? existing.type;
    const targetFundingSource: TransactionFundingSource =
      rawValues.fundingSource ??
      (targetType === "expense" && linkRelation?.isExpense ? "investments" : "account");
    const values = resolvedTransactionValues(existing, rawValues, targetFundingSource);
    values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
    values.transactionDate = normalizeDate(values.transactionDate);

    const shouldKeepFundingPair = shouldCreateInvestmentFundedExpense(values);

    if (linkRelation?.isExpense && !shouldKeepFundingPair) {
      invariant(existingLink, "TRANSACTION_FUNDING_LINK_NOT_FOUND", "O vínculo da despesa não existe mais.", 500);
      await deleteFundingPairInTransaction(existingLink, transactionDb);
      const updated = await updateSingleTransactionInTransaction(id, existing, values, transactionDb);
      return serializeTimestamps(updated);
    }

    if (shouldKeepFundingPair) {
      if (linkRelation?.isExpense) {
        invariant(existingLink, "TRANSACTION_FUNDING_LINK_NOT_FOUND", "O vínculo da despesa não existe mais.", 500);
        const updated = await updateInvestmentFundedExpenseInTransaction(
          id,
          existingLink,
          rawValues,
          values,
          transactionDb
        );
        return serializeTimestamps(updated);
      }

      await validateTransactionDependencies(values, transactionDb);
      const investmentCategory = await findInvestmentFundingCategory(transactionDb);
      const isIncludedInInvestmentCheckpoint = await investmentCheckpointFlag(
        transactionDb,
        "investment_withdrawal",
        values.transactionDate
      );
      const updatedExpense = await updateSingleTransactionInTransaction(
        id,
        existing,
        values,
        transactionDb
      );
      const withdrawalValues: TransactionValues = {
        ...values,
        categoryId: investmentCategory.id,
        type: "investment_withdrawal",
        description: automaticWithdrawalDescription(values.description),
        fundingSource: undefined,
      };
      await validateTransactionDependencies(withdrawalValues, transactionDb);
      const withdrawal = await insertTransactionRecord(transactionDb, {
        accountId: values.accountId,
        categoryId: investmentCategory.id,
        type: "investment_withdrawal",
        status: values.status,
        amountCents: values.amountCents,
        transactionDate: values.transactionDate,
        competenceMonth: values.competenceMonth,
        description: withdrawalValues.description,
        notes: values.notes,
        isIncludedInInvestmentCheckpoint,
      });
      const [link] = await transactionDb
        .insert(transactionFundingLinks)
        .values({
          expenseTransactionId: updatedExpense.id,
          withdrawalTransactionId: withdrawal.id,
          type: "investment_funded_expense",
          updatedAt: currentTimestamp(),
        })
        .returning();
      invariant(link, "TRANSACTION_FUNDING_LINK_FAILED", "Não foi possível vincular a despesa ao resgate automático.", 500);
      await applyReductionIfEffective(
        transactionDb,
        {
          ...withdrawalValues,
          sourceSelections: sourceSelectionsFromInput(rawValues),
          sources: undefined,
        },
        withdrawal.id,
        isIncludedInInvestmentCheckpoint
      );

      return serializeTimestamps(updatedExpense);
    }

    const updated = await updateSingleTransactionInTransaction(id, existing, values, transactionDb);
    return serializeTimestamps(updated);
  });
}

function isEffectiveInvestmentWithdrawal(
  value: {
    type: TransactionValues["type"];
    status: TransactionValues["status"];
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
  const link = await getFundingLinkForTransaction(id, database);
  const relation = fundingLinkForTransaction(link, id);

  invariant(
    !relation?.isWithdrawal,
    "MANAGED_TRANSACTION",
    "Este resgate automático é gerenciado pela despesa vinculada. Exclua a despesa para removê-lo."
  );

  if (relation?.isExpense) {
    invariant(link, "TRANSACTION_FUNDING_LINK_NOT_FOUND", "O vínculo da despesa não existe mais.", 500);
    await deleteFundingPairInTransaction(link, database);
  } else if (isEffectiveInvestmentWithdrawal(existing)) {
    await reverseInvestmentReductionForTransaction(id, database);
  }

  await database.delete(transactions).where(eq(transactions.id, id));
}
