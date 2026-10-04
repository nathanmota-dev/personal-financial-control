import type { RecurringDialogHandleOpenChangeContext } from "@/lib/interfaces/component-actions/recurring-dialog-handle-open-change";

export function RecurringDialogHandleOpenChange({ setOpen, resetFormState }: RecurringDialogHandleOpenChangeContext, nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetFormState();
    }
  }
