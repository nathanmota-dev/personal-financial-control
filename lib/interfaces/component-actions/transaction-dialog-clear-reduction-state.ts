import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import type {
TransactionMutationPayload
} from "@/lib/interfaces/transactions";

export interface TransactionDialogClearReductionStateContext {
  setIsReductionOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  setPendingPayload: import("react").Dispatch<import("react").SetStateAction<TransactionMutationPayload | null>>;
  setReductionSources: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSource[]>>;
  setPreviousSelections: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSelection[]>>;
}
