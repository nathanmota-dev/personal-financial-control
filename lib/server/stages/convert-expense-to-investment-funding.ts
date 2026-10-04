import {
transactionFundingLinks
} from "@/lib/db/schema";
import type { ConvertExpenseToInvestmentFundingContext } from "@/lib/interfaces/stages/convert-expense-to-investment-funding";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp
} from "@/lib/server/finance";
import { applyReductionIfEffective,insertTransactionRecord } from "@/lib/server/transactions/creation";
import { updateSingleTransactionInTransaction } from "@/lib/server/transactions/update-single";
import { automaticWithdrawalDescription,findInvestmentFundingCategory,investmentCheckpointFlag,sourceSelectionsFromInput,TransactionValues,validateTransactionDependencies } from "@/lib/server/transactions/validation";

export async function convertExpenseToInvestmentFunding({ values, transactionDb, id, existing, rawValues }: ConvertExpenseToInvestmentFundingContext) {
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
return { updatedExpense };
}
