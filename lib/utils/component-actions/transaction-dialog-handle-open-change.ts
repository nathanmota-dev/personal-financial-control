import type { TransactionDialogHandleOpenChangeContext } from "@/lib/interfaces/component-actions/transaction-dialog-handle-open-change";

export function TransactionDialogHandleOpenChange({ setOpen, resetFormState }: TransactionDialogHandleOpenChangeContext, nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetFormState();
    }
  }
