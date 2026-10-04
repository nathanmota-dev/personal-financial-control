import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
transactionFundingLinks,
transactions
} from "@/lib/db/schema";
import type {
TransactionFundingLink
} from "@/lib/interfaces/transaction-funding";
import { invariant } from "@/lib/server/errors";
import {
normalizeCompetenceMonth,
normalizeDate,
serializeTimestamps
} from "@/lib/server/finance";
import { and,eq,isNull,or } from "drizzle-orm";
import { z } from "zod";
import { createInvestmentFundedExpenseInTransaction,createSingleTransactionInTransaction } from "./creation";
import { resolveDb,shouldCreateInvestmentFundedExpense,TransactionDb,TransactionLinkRow,transactionSchema } from "./validation";

export async function createTransaction(
  input: z.input<typeof transactionSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = transactionSchema.parse(input);
  values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);
  values.transactionDate = normalizeDate(values.transactionDate);

  if (values.importFingerprint) {
    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.importFingerprint, values.importFingerprint),
    });
    if (existing) {
      const samePayload =
        existing.accountId === values.accountId &&
        existing.categoryId === (values.categoryId ?? null) &&
        existing.type === values.type &&
        existing.status === values.status &&
        existing.amountCents === values.amountCents &&
        existing.transactionDate === values.transactionDate &&
        existing.competenceMonth === values.competenceMonth &&
        existing.description === values.description &&
        existing.notes === (values.notes ?? null);
      invariant(
        samePayload,
        "IDEMPOTENCY_KEY_CONFLICT",
        "The idempotency key is already associated with a different transaction payload."
      );
      return serializeTimestamps(existing);
    }
  }

  return db.transaction(async (transactionDb) => {
    const created = shouldCreateInvestmentFundedExpense(values)
      ? await createInvestmentFundedExpenseInTransaction(transactionDb, values)
      : await createSingleTransactionInTransaction(transactionDb, values);

    return serializeTimestamps(created);
  });
}

export async function createIdempotentTransaction(
  input: z.input<typeof transactionSchema> & { importFingerprint: string },
  database?: AppDb
) {
  const db = database ?? await getFinanceDatabase();
  const existing = await db.query.transactions.findFirst({
    where: eq(transactions.importFingerprint, input.importFingerprint),
  });
  const transaction = await createTransaction(input, db);

  return { transaction, created: !existing };
}

export function fundingLinkForTransaction(
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

export function serializeFundingLink(link: TransactionLinkRow): TransactionFundingLink {
  return {
    id: link.id,
    expenseTransactionId: link.expenseTransactionId,
    withdrawalTransactionId: link.withdrawalTransactionId,
    type: link.type,
  };
}

export async function getFundingLinkForTransaction(
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
