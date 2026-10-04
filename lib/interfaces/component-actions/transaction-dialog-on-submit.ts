import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import type {
TransactionMutationPayload,
TransactionRow
} from "@/lib/interfaces/transactions";

export interface TransactionDialogOnSubmitContext {
  setFormError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
  showError: (message: string) => void;
  transaction: TransactionRow | undefined;
  setReductionSources: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSource[]>>;
  setReductionAmountCents: import("react").Dispatch<import("react").SetStateAction<number>>;
  setPreviousSelections: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSelection[]>>;
  setPendingPayload: import("react").Dispatch<import("react").SetStateAction<TransactionMutationPayload | null>>;
  setIsReductionOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  persistTransaction: (payload: TransactionMutationPayload, sourceSelections?: InvestmentReductionSelection[]) => Promise<void>;
}
