import type { TransactionDialogShowErrorContext } from "@/lib/interfaces/component-actions/transaction-dialog-show-error";
import { toast } from "sonner";

export function TransactionDialogShowError({ setFormError }: TransactionDialogShowErrorContext, message: string) {
    setFormError(message);
    toast.error(message);
  }
