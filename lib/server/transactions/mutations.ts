import type { AppDb } from "@/lib/db";
import {
transactions
} from "@/lib/db/schema";
import type {
TransactionFundingSource
} from "@/lib/interfaces/transaction-funding";
import { invariant } from "@/lib/server/errors";
import {
normalizeCompetenceMonth,
normalizeDate,
serializeTimestamps
} from "@/lib/server/finance";
import {
reverseInvestmentReductionForTransaction
} from "@/lib/server/investment-reconciliation";
import { getFinanceToday } from "@/lib/server/runtime";
import { convertExpenseToInvestmentFunding } from "@/lib/server/stages/convert-expense-to-investment-funding";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fundingLinkForTransaction,getFundingLinkForTransaction,getTransactionById } from "./queries";
import { updateInvestmentFundedExpenseInTransaction } from "./update-funded";
import { deleteFundingPairInTransaction,resolvedTransactionValues,updateSingleTransactionInTransaction } from "./update-single";
import { resolveDb,shouldCreateInvestmentFundedExpense,TransactionDbTransaction,TransactionValues,updateTransactionSchema } from "./validation";

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

      const { updatedExpense } = await convertExpenseToInvestmentFunding({ values, transactionDb, id, existing, rawValues });

      return serializeTimestamps(updatedExpense);
    }

    const updated = await updateSingleTransactionInTransaction(id, existing, values, transactionDb);
    return serializeTimestamps(updated);
  });
}

export function isEffectiveInvestmentWithdrawal(
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
