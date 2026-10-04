import type { InvestmentPortfolioViewEndMutationContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-end-mutation";

export function InvestmentPortfolioViewEndMutation({ mutationInFlightRef, setSubmittingAction }: InvestmentPortfolioViewEndMutationContext) {
    mutationInFlightRef.current = false;
    setSubmittingAction(null);
  }
