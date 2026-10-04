import type {
HoldingDialogState,
HoldingFormState
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewOpenEditHoldingContext {
  setHoldingForm: import("react").Dispatch<import("react").SetStateAction<HoldingFormState>>;
  setHoldingDialog: import("react").Dispatch<import("react").SetStateAction<HoldingDialogState>>;
}
