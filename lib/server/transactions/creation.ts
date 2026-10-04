import {
transactionFundingLinks,
transactions
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp
} from "@/lib/server/finance";
import {
applyInvestmentReductionInExistingTransaction
} from "@/lib/server/investment-reconciliation";
import { isEffectiveInvestmentWithdrawal } from "./mutations";
import { TransactionDbTransaction,TransactionValues,automaticWithdrawalDescription,findInvestmentFundingCategory,investmentCheckpointFlag,sourceSelectionsFromInput,validateTransactionDependencies } from "./validation";

export async function insertTransactionRecord(
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
    importFingerprint?: string;
    isIncludedInInvestmentCheckpoint: boolean;
  }
) {
  const [created] = await database
    .insert(transactions)
    .values({
      ...values,
      notes: values.notes ?? null,
      recurringTemplateId: values.recurringTemplateId ?? null,
      importFingerprint: values.importFingerprint ?? null,
      updatedAt: currentTimestamp(),
    })
    .returning();

  invariant(created, "TRANSACTION_CREATE_FAILED", "Transaction could not be created.", 500);
  return created;
}

export async function applyReductionIfEffective(
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

export async function createSingleTransactionInTransaction(
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
    importFingerprint: values.importFingerprint,
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

export async function createInvestmentFundedExpenseInTransaction(
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
