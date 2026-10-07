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
import {
accountValue,
categoryValue,
compatibleCategories,
filterTransactionAccounts,
investmentType
} from "@/lib/utils/components/transaction-dialog";
import { useEffect, useRef } from "react";

export function useTransactionDialog({
  accounts,
  categories,
  month,
  transaction,
  afterCategorization,
  command,
}: TransactionDialogProps) {
const { setSelectedType, setSelectedAccountId, setSelectedCategoryId, setTransactionDate, setCompetenceMonth, setFundingSource, setFormError, setOpen, fundingSource, selectedAccountId, selectedCategoryId, setReductionSources, setReductionAmountCents, setPreviousSelections, setPendingPayload, setIsReductionOpen, router, pendingPayload, selectedType, open, startTransition, formId, transactionDate, competenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources } = useTransactionDialogState({ transaction, accounts, categories, month });
const handledCommandId = useRef<string | null>(null);

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

useEffect(() => {
  if (
    !command ||
    (command.action !== "new-income" && command.action !== "new-expense") ||
    handledCommandId.current === command.id
  ) {
    return;
  }

  handledCommandId.current = command.id;
  const nextType = command.action === "new-income" ? "income" : "expense";
  setSelectedType(nextType);
  setSelectedAccountId(accountValue(accounts, nextType));
  setSelectedCategoryId(categoryValue(categories, nextType));
  setTransactionDate(`${month}-01`);
  setCompetenceMonth(month);
  setFundingSource("account");
  setFormError(null);
  setOpen(true);
}, [
  accounts,
  categories,
  command,
  month,
  setCompetenceMonth,
  setFormError,
  setFundingSource,
  setOpen,
  setSelectedAccountId,
  setSelectedCategoryId,
  setSelectedType,
  setTransactionDate,
]);

const filteredCategories = compatibleCategories(categories, selectedType);

const filteredAccounts = filterTransactionAccounts(accounts, selectedType);

const categoryRequired = investmentType(selectedType);

const isExpense = selectedType === "expense";

const isManualExpense = isExpense && !transaction?.recurringTemplateId;

const isInvestmentExpense =
    isManualExpense && fundingSource === "investments";
return { open, handleOpenChange, startTransition, onSubmit, formId, selectedType, handleTypeChange, isManualExpense, fundingSource, setFundingSource, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories, transactionDate, setTransactionDate, competenceMonth, setCompetenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources, setIsReductionOpen, clearReductionState, confirmReduction };
}
