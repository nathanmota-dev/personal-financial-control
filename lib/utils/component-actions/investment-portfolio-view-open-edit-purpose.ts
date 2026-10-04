import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewOpenEditPurposeContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-edit-purpose";
import type {
InvestmentPurposeCard
} from "@/lib/interfaces/investment-portfolio";

export function InvestmentPortfolioViewOpenEditPurpose({ setPurposeForm, setPurposeDialog }: InvestmentPortfolioViewOpenEditPurposeContext, purpose: InvestmentPurposeCard) {
    setPurposeForm({
      name: purpose.name,
      targetAmount: purpose.targetAmountCents
        ? centsToMoneyInput(purpose.targetAmountCents)
        : "",
      color: purpose.color,
      notes: purpose.notes ?? "",
    });
    setPurposeDialog({ mode: "edit", purpose });
  }
