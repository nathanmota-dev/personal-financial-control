import type { TransactionDialogConfirmReductionContext } from "@/lib/interfaces/component-actions/transaction-dialog-confirm-reduction";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";

export async function TransactionDialogConfirmReduction({ pendingPayload, persistTransaction, showError }: TransactionDialogConfirmReductionContext, selections: InvestmentReductionSelection[]) {
    if (!pendingPayload) {
      return;
    }

    try {
      await persistTransaction(pendingPayload, selections);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o lançamento.",
      );
    }
  }
