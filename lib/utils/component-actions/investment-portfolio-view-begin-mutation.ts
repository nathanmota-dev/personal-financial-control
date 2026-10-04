import type { InvestmentPortfolioViewBeginMutationContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-begin-mutation";
import type {
PortfolioMutationAction
} from "@/lib/interfaces/investment-portfolio";

export function InvestmentPortfolioViewBeginMutation({ mutationInFlightRef, setSubmittingAction }: InvestmentPortfolioViewBeginMutationContext, action: PortfolioMutationAction) {
    if (mutationInFlightRef.current) {
      return false;
    }

    mutationInFlightRef.current = true;
    setSubmittingAction(action);
    return true;
  }
