
import type { AppDb } from "@/lib/db";
import {
transactions
} from "@/lib/db/schema";
import type { ProjectionEvent } from "@/lib/interfaces/projected-balance";
import type {
ProjectedBalanceAccountRow,
ProjectedBalanceTransactionRow
} from "@/lib/interfaces/projected-balance-server";
import { and,gte,inArray,lte } from "drizzle-orm";


export function mapTransactionToEvent(
  transaction: ProjectedBalanceTransactionRow
): ProjectionEvent | null {
  if (transaction.account?.type === "credit") {
    return null;
  }

  if (transaction.type === "income") {
    return {
      id: transaction.id,
      source: "transaction",
      type: "income",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      ...(transaction.categoryId ? { categoryId: transaction.categoryId } : {}),
      metadata: {
        status: transaction.status,
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  if (transaction.type === "investment_contribution") {
    return {
      id: transaction.id,
      source: "investment",
      type: "investment",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: -transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      ...(transaction.categoryId ? { categoryId: transaction.categoryId } : {}),
      metadata: {
        status: transaction.status,
        direction: "contribution",
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  if (transaction.type === "investment_withdrawal") {
    return {
      id: transaction.id,
      source: "investment",
      type: "investment",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      ...(transaction.categoryId ? { categoryId: transaction.categoryId } : {}),
      metadata: {
        status: transaction.status,
        direction: "withdrawal",
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  return {
    id: transaction.id,
    source: "transaction",
    type: "expense",
    description: transaction.description,
    amountCents: transaction.amountCents,
    netImpactCents: -transaction.amountCents,
    date: transaction.transactionDate,
    accountId: transaction.accountId,
    ...(transaction.categoryId ? { categoryId: transaction.categoryId } : {}),
    metadata: {
      status: transaction.status,
      competenceMonth: transaction.competenceMonth,
      accountName: transaction.account?.name ?? null,
      categoryName: transaction.category?.name ?? null,
    },
  };
}

export async function listTransactionEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[],
  includeInvestments: boolean
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return [];
  }

  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.accountId, ids),
      inArray(transactions.status, ["pending", "posted"]),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ),
    with: {
      account: true,
      category: true,
    },
  });

  return rows
    .filter(
      (row) =>
        includeInvestments ||
        (row.type !== "investment_contribution" && row.type !== "investment_withdrawal")
    )
    .map((row) => mapTransactionToEvent(row))
    .filter((event): event is ProjectionEvent => Boolean(event));
}

export { recurringOccurrences as listExistingRecurringOccurrences } from "@/lib/server/recurring-occurrences";
