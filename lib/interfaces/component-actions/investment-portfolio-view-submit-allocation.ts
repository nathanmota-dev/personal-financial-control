import type {
AllocationDialogState,
AllocationFormState,
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewSubmitAllocationContext {
  beginMutation: (action: PortfolioMutationAction) => boolean;
  allocationForm: AllocationFormState;
  setAllocationDialog: import("react").Dispatch<import("react").SetStateAction<AllocationDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
