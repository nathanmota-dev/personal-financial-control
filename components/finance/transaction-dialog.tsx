"use client";

import { useTransactionDialog } from "@/hooks/finance/use-transaction-dialog";
import { TransactionDialogDialog7 } from "./transaction-dialog-transaction-dialog-dialog7";
import { TransactionDialogInvestmentReductionDialog8 } from "./transaction-dialog-transaction-dialog-investment-reduction-dialog8";

import type {
TransactionDialogProps
} from "@/lib/interfaces/transactions";

export function TransactionDialog({
  accounts,
  categories,
  month,
  transaction,
  trigger,
  afterCategorization,
  command,
}: TransactionDialogProps) {
  const { open, handleOpenChange, startTransition, onSubmit, formId, selectedType, handleTypeChange, isManualExpense, fundingSource, setFundingSource, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories, transactionDate, setTransactionDate, competenceMonth, setCompetenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources, setIsReductionOpen, clearReductionState, confirmReduction } = useTransactionDialog({ accounts, categories, month, transaction, trigger, afterCategorization, command });

  return (
    <>
      <TransactionDialogDialog7  open={open} handleOpenChange={handleOpenChange} trigger={trigger} transaction={transaction} accounts={accounts} startTransition={startTransition} onSubmit={onSubmit} formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} isManualExpense={isManualExpense} fundingSource={fundingSource} setFundingSource={setFundingSource} isInvestmentExpense={isInvestmentExpense} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categoryRequired={categoryRequired} filteredCategories={filteredCategories} transactionDate={transactionDate} setTransactionDate={setTransactionDate} competenceMonth={competenceMonth} setCompetenceMonth={setCompetenceMonth} formError={formError} isPending={isPending} />
      <TransactionDialogInvestmentReductionDialog8 key={`transaction-reduction-${isReductionOpen}-${transaction?.id ?? "new"}-${reductionAmountCents}-${previousSelections.map((selection) => `${selection.sourceId}:${selection.amountCents}`).join("|")}`} isReductionOpen={isReductionOpen} transaction={transaction} reductionAmountCents={reductionAmountCents} previousSelections={previousSelections} reductionSources={reductionSources} isPending={isPending} setIsReductionOpen={setIsReductionOpen} clearReductionState={clearReductionState} startTransition={startTransition} confirmReduction={confirmReduction} />
    </>
  );
}
