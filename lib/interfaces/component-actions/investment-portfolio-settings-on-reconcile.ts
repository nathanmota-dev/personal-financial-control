import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";

export interface InvestmentPortfolioSettingsOnReconcileContext {
  projection: import("@/lib/interfaces/investments").InvestmentProjection | null;
  reconciledBalance: string;
  setReductionSources: import("react").Dispatch<import("react").SetStateAction<InvestmentReductionSource[]>>;
  setPendingReconciliation: import("react").Dispatch<import("react").SetStateAction<{ checkpointBalanceCents: number; checkpointDate: string; amountCents: number; } | null>>;
  reconciledDate: string;
  setIsReconcileOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  setIsReductionOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  saveReconciliation: (input: { checkpointBalanceCents: number; checkpointDate: string; sourceSelections?: InvestmentReductionSelection[]; }) => Promise<void>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
}
