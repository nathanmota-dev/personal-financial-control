import type {
PortfolioMutationAction,
PurposeDialogState,
PurposeFormState
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewSubmitPurposeContext {
  beginMutation: (action: PortfolioMutationAction) => boolean;
  purposeForm: PurposeFormState;
  purposeDialog: PurposeDialogState;
  setPurposeDialog: import("react").Dispatch<import("react").SetStateAction<PurposeDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
