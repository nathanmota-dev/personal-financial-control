import {
updateInvestmentSettingsAction
} from "@/app/actions/finance";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsOnUpdateRateContext } from "@/lib/interfaces/component-actions/investment-portfolio-settings-on-update-rate";
import { parseRate } from "@/lib/utils/components/investment-portfolio-settings";
import { toast } from "sonner";

export async function InvestmentPortfolioSettingsOnUpdateRate({ rate, router }: InvestmentPortfolioSettingsOnUpdateRateContext) {
    try {
      await updateInvestmentSettingsAction({
        expectedMonthlyRateBps: parseRate(rate),
      });
      toast.success("Taxa esperada atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }
