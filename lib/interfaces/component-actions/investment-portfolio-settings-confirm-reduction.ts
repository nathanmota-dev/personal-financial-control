import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";

export interface InvestmentPortfolioSettingsConfirmReductionContext {
  pendingReconciliation: { checkpointBalanceCents: number; checkpointDate: string; amountCents: number; } | null;
  saveReconciliation: (input: { checkpointBalanceCents: number; checkpointDate: string; sourceSelections?: InvestmentReductionSelection[]; }) => Promise<void>;
  setIsReductionOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  setPendingReconciliation: import("react").Dispatch<import("react").SetStateAction<{ checkpointBalanceCents: number; checkpointDate: string; amountCents: number; } | null>>;
  setReductionSources: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSource[]>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
}
