import type { TransactionDialogClearReductionStateContext } from "@/lib/interfaces/component-actions/transaction-dialog-clear-reduction-state";

export function TransactionDialogClearReductionState({ setIsReductionOpen, setPendingPayload, setReductionSources, setPreviousSelections }: TransactionDialogClearReductionStateContext) {
    setIsReductionOpen(false);
    setPendingPayload(null);
    setReductionSources([]);
    setPreviousSelections([]);
  }
