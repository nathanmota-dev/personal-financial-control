import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewUpdateAllocationSelectionContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-update-allocation-selection";

export function InvestmentPortfolioViewUpdateAllocationSelection({ dashboard, setAllocationForm, setAllocationAvailableCents }: InvestmentPortfolioViewUpdateAllocationSelectionContext, value: string) {
    const holding = dashboard.holdings.find((item) => item.id === value);
    if (!holding) {
      setAllocationForm((current) => ({ ...current, holdingId: value, amount: "" }));
      setAllocationAvailableCents(0);
      return;
    }

    const allocatedCents = holding.allocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0
    );
    const availableCents = Math.max(holding.currentValueCents - allocatedCents, 0);
    setAllocationForm((current) => ({
      ...current,
      holdingId: value,
      amount: availableCents > 0 ? centsToMoneyInput(availableCents) : "",
    }));
    setAllocationAvailableCents(availableCents);
  }
