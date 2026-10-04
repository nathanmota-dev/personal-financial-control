import {
reconcileInvestmentBalanceAction
} from "@/app/actions/finance";
import type { InvestmentPortfolioSettingsSaveReconciliationContext } from "@/lib/interfaces/component-actions/investment-portfolio-settings-save-reconciliation";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";

export async function InvestmentPortfolioSettingsSaveReconciliation({  }: InvestmentPortfolioSettingsSaveReconciliationContext, input: {
    checkpointBalanceCents: number;
    checkpointDate: string;
    sourceSelections?: InvestmentReductionSelection[];
  }) {
    await reconcileInvestmentBalanceAction(input);
  }
