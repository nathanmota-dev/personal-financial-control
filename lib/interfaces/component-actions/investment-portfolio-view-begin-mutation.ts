import type {
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewBeginMutationContext {
  mutationInFlightRef: import("react").RefObject<boolean>;
  setSubmittingAction: import("react").Dispatch<import("react").SetStateAction<PortfolioMutationAction | null>>;
}
