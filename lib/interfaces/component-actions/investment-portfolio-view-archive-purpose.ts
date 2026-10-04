import type {
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export interface InvestmentPortfolioViewArchivePurposeContext {
  beginMutation: (action: PortfolioMutationAction) => boolean;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
