import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";
import type {
TransactionMutationPayload
} from "@/lib/interfaces/transactions";

export interface TransactionDialogConfirmReductionContext {
  pendingPayload: TransactionMutationPayload | null;
  persistTransaction: (payload: TransactionMutationPayload, sourceSelections?: InvestmentReductionSelection[]) => Promise<void>;
  showError: (message: string) => void;
}
