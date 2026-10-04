import type {
AllocationDialogState,
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewDeleteAllocationContext {
  allocationDialog: AllocationDialogState;
  beginMutation: (action: PortfolioMutationAction) => boolean;
  setAllocationDialog: import("react").Dispatch<import("react").SetStateAction<AllocationDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
