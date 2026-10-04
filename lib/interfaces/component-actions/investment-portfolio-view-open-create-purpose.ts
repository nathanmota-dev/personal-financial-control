import type {
PurposeDialogState,
PurposeFormState
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewOpenCreatePurposeContext {
  setPurposeForm: import("react").Dispatch<import("react").SetStateAction<PurposeFormState>>;
  setPurposeDialog: import("react").Dispatch<import("react").SetStateAction<PurposeDialogState>>;
}
