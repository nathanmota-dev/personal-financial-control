import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewOpenEditHoldingContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-edit-holding";
import type {
InvestmentHoldingCard
} from "@/lib/interfaces/investment-portfolio";

export function InvestmentPortfolioViewOpenEditHolding({ setHoldingForm, setHoldingDialog }: InvestmentPortfolioViewOpenEditHoldingContext, holding: InvestmentHoldingCard) {
    setHoldingForm({
      name: holding.name,
      ticker: holding.ticker ?? "",
      institutionName: holding.institutionName ?? "",
      assetClass: holding.assetClass,
      instrumentType: holding.instrumentType,
      currentValue: centsToMoneyInput(holding.currentValueCents),
      valueAsOf: holding.valueAsOf,
      notes: holding.notes ?? "",
    });
    setHoldingDialog({ mode: "edit", holding });
  }
