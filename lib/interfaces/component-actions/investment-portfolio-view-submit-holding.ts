import type {
HoldingDialogState,
HoldingFormState,
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewSubmitHoldingContext {
  beginMutation: (action: PortfolioMutationAction) => boolean;
  holdingForm: HoldingFormState;
  holdingDialog: HoldingDialogState;
  setHoldingDialog: import("react").Dispatch<import("react").SetStateAction<HoldingDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
