import type { InvestmentPortfolioViewOpenCreateHoldingContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-create-holding";
import { emptyHoldingForm } from "@/lib/utils/components/investment-portfolio-view";

export function InvestmentPortfolioViewOpenCreateHolding({ setHoldingForm, dashboard, setHoldingDialog }: InvestmentPortfolioViewOpenCreateHoldingContext) {
    setHoldingForm(emptyHoldingForm(dashboard));
    setHoldingDialog({ mode: "create" });
  }
