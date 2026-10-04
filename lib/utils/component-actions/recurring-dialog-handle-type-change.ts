import type { RecurringDialogHandleTypeChangeContext } from "@/lib/interfaces/component-actions/recurring-dialog-handle-type-change";
import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";
import { defaultAccountId,defaultCategoryId } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogHandleTypeChange({ setSelectedType, setSelectedAccountId, accounts, selectedAccountId, setSelectedCategoryId, categories, selectedCategoryId }: RecurringDialogHandleTypeChangeContext, value: string) {
    const nextType = value as RecurringTemplateRow["type"];
    setSelectedType(nextType);
    setSelectedAccountId(
      defaultAccountId(accounts, nextType, selectedAccountId),
    );
    setSelectedCategoryId(
      defaultCategoryId(categories, nextType, selectedCategoryId),
    );
  }
