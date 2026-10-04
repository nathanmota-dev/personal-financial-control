import type { RecurringDialogResetFormStateContext } from "@/lib/interfaces/component-actions/recurring-dialog-reset-form-state";
import { defaultAccountId,defaultCategoryId } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogResetFormState({ template, setSelectedType, setSelectedAccountId, accounts, setSelectedCategoryId, categories, setStartMonth, month, setEndMonth, setFormError }: RecurringDialogResetFormStateContext) {
    const type = template?.type ?? "expense";
    setSelectedType(type);
    setSelectedAccountId(defaultAccountId(accounts, type, template?.accountId));
    setSelectedCategoryId(
      defaultCategoryId(categories, type, template?.categoryId),
    );
    setStartMonth(template?.startMonth ?? month);
    setEndMonth(template?.endMonth ?? undefined);
    setFormError(null);
  }
