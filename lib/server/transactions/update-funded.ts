import {
transactions
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp
} from "@/lib/server/finance";
import {
reverseInvestmentReductionForTransaction
} from "@/lib/server/investment-reconciliation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { applyReductionIfEffective } from "./creation";
import { isEffectiveInvestmentWithdrawal } from "./mutations";
import { getTransactionById } from "./queries";
import { previousSelectionsForTransaction,selectionTotal } from "./update-single";
import { TransactionDbTransaction,TransactionLinkRow,TransactionValues,automaticWithdrawalDescription,findInvestmentFundingCategory,investmentCheckpointFlag,sourceSelectionsFromInput,updateTransactionSchema,validateTransactionDependencies } from "./validation";

export async function updateInvestmentFundedExpenseInTransaction(
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
