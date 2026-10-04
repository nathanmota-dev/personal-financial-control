import type {
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewArchiveHoldingContext {
  beginMutation: (action: PortfolioMutationAction) => boolean;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
