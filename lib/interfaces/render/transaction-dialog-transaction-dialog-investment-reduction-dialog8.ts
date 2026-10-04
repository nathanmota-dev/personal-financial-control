
export interface TransactionDialogInvestmentReductionDialog8Props {
  isReductionOpen: boolean;
  transaction: import("@/lib/interfaces/transactions").TransactionRow | undefined;
  reductionAmountCents: number;
  previousSelections: import("@/lib/interfaces/investment-reconciliation").InvestmentReductionSelection[];
  reductionSources: import("@/lib/interfaces/investment-reconciliation").InvestmentReductionSource[];
  isPending: boolean;
  setIsReductionOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  clearReductionState: () => void;
  startTransition: import("react").TransitionStartFunction;
  confirmReduction: (selections: import("@/lib/interfaces/investment-reconciliation").InvestmentReductionSelection[]) => Promise<void>;
}
