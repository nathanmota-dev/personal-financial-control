import {
createTransactionAction,
updateTransactionAction
} from "@/app/actions/finance";
import type { TransactionDialogPersistTransactionContext } from "@/lib/interfaces/component-actions/transaction-dialog-persist-transaction";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";
import type {
TransactionMutationPayload
} from "@/lib/interfaces/transactions";
import { transactionSaveDestination } from "@/lib/transaction-navigation";
import { toast } from "sonner";

export async function TransactionDialogPersistTransaction({ transaction, showError, clearReductionState, setOpen, router, afterCategorization }: TransactionDialogPersistTransactionContext, payload: TransactionMutationPayload, sourceSelections?: InvestmentReductionSelection[]) {
    const nextPayload = sourceSelections
      ? { ...payload, sourceSelections }
      : payload;
    const result = transaction
      ? await updateTransactionAction({ id: transaction.id, ...nextPayload })
      : await createTransactionAction(nextPayload);

    if (!result.ok) {
      showError(result.error.message);
      return;
    }

    toast.success(
      transaction ? "Lançamento atualizado." : "Lançamento criado.",
    );
    clearReductionState();
    setOpen(false);
    const destination = transactionSaveDestination({
      transaction,
      payload,
      afterCategorization,
    });
    if (destination) {
      router.replace(destination);
    } else {
      router.refresh();
    }
  }
