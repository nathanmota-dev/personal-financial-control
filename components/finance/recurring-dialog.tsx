"use client";

import { RecurringDialogHandleOpenChange } from "@/lib/utils/component-actions/recurring-dialog-handle-open-change";
import { RecurringDialogHandleTypeChange } from "@/lib/utils/component-actions/recurring-dialog-handle-type-change";
import { RecurringDialogOnSubmit } from "@/lib/utils/component-actions/recurring-dialog-on-submit";
import { RecurringDialogResetFormState } from "@/lib/utils/component-actions/recurring-dialog-reset-form-state";
import { compatibleCategories,defaultAccountId,defaultCategoryId } from "@/lib/utils/components/recurring-dialog";
import { useRouter } from "next/navigation";
import { useId,useState,useTransition } from "react";
import { RecurringDialogDialog7 } from "./recurring-dialog-recurring-dialog-dialog7";

import type {
RecurringDialogProps,
RecurringTemplateRow,
} from "@/lib/interfaces/recurring";

export function RecurringDialog({
  accounts,
  categories,
  month,
  template,
  trigger,
}: RecurringDialogProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState(template?.startMonth ?? month);
  const [endMonth, setEndMonth] = useState<string | undefined>(
    template?.endMonth ?? undefined,
  );
  const [selectedType, setSelectedType] = useState<
    RecurringTemplateRow["type"]
  >(template?.type ?? "expense");
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    defaultAccountId(
      accounts,
      template?.type ?? "expense",
      template?.accountId,
    ),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    defaultCategoryId(
      categories,
      template?.type ?? "expense",
      template?.categoryId,
    ),
  );
  const hasSetup = accounts.length > 0 && categories.length > 0;

  function resetFormState() {
    return RecurringDialogResetFormState({ template, setSelectedType, setSelectedAccountId, accounts, setSelectedCategoryId, categories, setStartMonth, month, setEndMonth, setFormError });
  }

  function handleOpenChange(nextOpen: boolean) {
    return RecurringDialogHandleOpenChange({ setOpen, resetFormState }, nextOpen);
  }

  function handleTypeChange(value: string) {
    return RecurringDialogHandleTypeChange({ setSelectedType, setSelectedAccountId, accounts, selectedAccountId, setSelectedCategoryId, categories, selectedCategoryId }, value);
  }

  async function onSubmit(formData: FormData) {
    return RecurringDialogOnSubmit({ setFormError, template, setOpen, router }, formData);
  }

  const filteredCategories = compatibleCategories(categories, selectedType);
  const filteredAccounts =
    selectedType === "investment_contribution"
      ? accounts.filter(
          (account) =>
            account.type === "checking" ||
            account.type === "savings" ||
            account.type === "cash",
        )
      : accounts;

  return (
    <RecurringDialogDialog7 open={open} handleOpenChange={handleOpenChange} trigger={trigger} template={template} hasSetup={hasSetup} startTransition={startTransition} onSubmit={onSubmit} formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} filteredCategories={filteredCategories} startMonth={startMonth} setStartMonth={setStartMonth} endMonth={endMonth} setEndMonth={setEndMonth} formError={formError} isPending={isPending} />
  );
}
