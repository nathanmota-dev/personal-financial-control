import type { InvestmentPortfolioViewOpenExistingAllocationContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-existing-allocation";
import type {
InvestmentHoldingAllocation
} from "@/lib/interfaces/investment-portfolio";

export function InvestmentPortfolioViewOpenExistingAllocation({ dashboard, openAllocationDialog }: InvestmentPortfolioViewOpenExistingAllocationContext, allocation: InvestmentHoldingAllocation) {
    const holding = dashboard.holdings.find((item) => item.id === allocation.holdingId);
    const purpose = dashboard.purposes.find((item) => item.id === allocation.purposeId);

    if (holding && purpose) {
      openAllocationDialog(holding, purpose);
    }
  }
