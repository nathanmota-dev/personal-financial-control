import {
transactionFundingLinks,
transactions
} from "@/lib/db/schema";
import type {
TransactionFundingSource
} from "@/lib/interfaces/transaction-funding";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp
} from "@/lib/server/finance";
import {
getInvestmentReductionSources,
reverseInvestmentReductionForTransaction
} from "@/lib/server/investment-reconciliation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { applyReductionIfEffective } from "./creation";
import { isEffectiveInvestmentWithdrawal } from "./mutations";
import { getTransactionById } from "./queries";
import { TransactionDbTransaction,TransactionLinkRow,TransactionValues,investmentCheckpointFlag,updateTransactionSchema,validateTransactionDependencies } from "./validation";

export function resolvedTransactionValues(
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
    importFingerprint: existing.importFingerprint ?? undefined,
    fundingSource,
    sourceSelections: rawValues.sourceSelections,
    sources: rawValues.sources,
  };
}

export async function previousSelectionsForTransaction(
  transactionId: string,
  database: TransactionDbTransaction
) {
  const result = await getInvestmentReductionSources(database, { transactionId });
  return result.previousSelections;
}

export function selectionTotal(selections: Array<{ amountCents: number }>) {
  return selections.reduce((total, selection) => total + selection.amountCents, 0);
}

export async function deleteFundingPairInTransaction(
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

export async function updateSingleTransactionInTransaction(
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
