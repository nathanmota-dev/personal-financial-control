import type { InvestmentPortfolioViewOpenCreatePurposeContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-create-purpose";
import { emptyPurposeForm } from "@/lib/utils/components/investment-portfolio-view";

export function InvestmentPortfolioViewOpenCreatePurpose({ setPurposeForm, setPurposeDialog }: InvestmentPortfolioViewOpenCreatePurposeContext) {
    setPurposeForm(emptyPurposeForm());
    setPurposeDialog({ mode: "create" });
  }
