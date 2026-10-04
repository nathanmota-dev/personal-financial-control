"use client";
import { useTransactionDialogState } from "@/hooks/finance/use-transaction-dialog-state";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";
import type {
TransactionDialogProps,
TransactionMutationPayload
} from "@/lib/interfaces/transactions";
import { TransactionDialogClearReductionState } from "@/lib/utils/component-actions/transaction-dialog-clear-reduction-state";
import { TransactionDialogConfirmReduction } from "@/lib/utils/component-actions/transaction-dialog-confirm-reduction";
import { TransactionDialogHandleOpenChange } from "@/lib/utils/component-actions/transaction-dialog-handle-open-change";
import { TransactionDialogHandleTypeChange } from "@/lib/utils/component-actions/transaction-dialog-handle-type-change";
import { TransactionDialogOnSubmit } from "@/lib/utils/component-actions/transaction-dialog-on-submit";
import { TransactionDialogPersistTransaction } from "@/lib/utils/component-actions/transaction-dialog-persist-transaction";
import { TransactionDialogResetFormState } from "@/lib/utils/component-actions/transaction-dialog-reset-form-state";
import { TransactionDialogShowError } from "@/lib/utils/component-actions/transaction-dialog-show-error";
import { compatibleCategories,investmentType } from "@/lib/utils/components/transaction-dialog";

export function useTransactionDialog({
  accounts,
  categories,
  month,
  transaction,
  afterCategorization,
}: TransactionDialogProps) {
const { setSelectedType, setSelectedAccountId, setSelectedCategoryId, setTransactionDate, setCompetenceMonth, setFundingSource, setFormError, setOpen, fundingSource, selectedAccountId, selectedCategoryId, setReductionSources, setReductionAmountCents, setPreviousSelections, setPendingPayload, setIsReductionOpen, router, pendingPayload, selectedType, open, startTransition, formId, transactionDate, competenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources } = useTransactionDialogState({ transaction, accounts, categories, month });

function resetFormState() {
    return TransactionDialogResetFormState({ transaction, setSelectedType, setSelectedAccountId, accounts, setSelectedCategoryId, categories, setTransactionDate, month, setCompetenceMonth, setFundingSource, setFormError });
  }

function handleOpenChange(nextOpen: boolean) {
    return TransactionDialogHandleOpenChange({ setOpen, resetFormState }, nextOpen);
  }

function handleTypeChange(value: string) {
    return TransactionDialogHandleTypeChange({ setSelectedType, setFundingSource, fundingSource, setSelectedAccountId, accounts, selectedAccountId, selectedCategoryId, setSelectedCategoryId, categories }, value);
  }

async function onSubmit(formData: FormData) {
    return TransactionDialogOnSubmit({ setFormError, showError, transaction, setReductionSources, setReductionAmountCents, setPreviousSelections, setPendingPayload, setIsReductionOpen, persistTransaction }, formData);
  }

function showError(message: string) {
    return TransactionDialogShowError({ setFormError }, message);
  }

async function persistTransaction(
    payload: TransactionMutationPayload,
    sourceSelections?: InvestmentReductionSelection[],
  ) {
    return TransactionDialogPersistTransaction({ transaction, showError, clearReductionState, setOpen, router, afterCategorization }, payload, sourceSelections);
  }

async function confirmReduction(selections: InvestmentReductionSelection[]) {
    return TransactionDialogConfirmReduction({ pendingPayload, persistTransaction, showError }, selections);
  }

function clearReductionState() {
    return TransactionDialogClearReductionState({ setIsReductionOpen, setPendingPayload, setReductionSources, setPreviousSelections });
  }

const filteredCategories = compatibleCategories(categories, selectedType);

const filteredAccounts =
    selectedType === "expense" || investmentType(selectedType)
      ? accounts.filter(
          (account) =>
            account.type === "checking" ||
            account.type === "savings" ||
            account.type === "cash",
        )
      : accounts;

const categoryRequired = investmentType(selectedType);

const isExpense = selectedType === "expense";

const isManualExpense = isExpense && !transaction?.recurringTemplateId;

const isInvestmentExpense =
    isManualExpense && fundingSource === "investments";
return { open, handleOpenChange, startTransition, onSubmit, formId, selectedType, handleTypeChange, isManualExpense, fundingSource, setFundingSource, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories, transactionDate, setTransactionDate, competenceMonth, setCompetenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources, setIsReductionOpen, clearReductionState, confirmReduction };
}
