import {
configureInvestmentPortfolioAction
} from "@/app/actions/finance";
import {
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsOnConfigureContext } from "@/lib/interfaces/component-actions/investment-portfolio-settings-on-configure";
import { parseRate } from "@/lib/utils/components/investment-portfolio-settings";
import { toast } from "sonner";

export async function InvestmentPortfolioSettingsOnConfigure({ initialBalance, rate, initialDate, router }: InvestmentPortfolioSettingsOnConfigureContext) {
    try {
      await configureInvestmentPortfolioAction({
        checkpointBalanceCents: moneyInputToCents(initialBalance),
        expectedMonthlyRateBps: parseRate(rate),
        checkpointDate: initialDate,
      });
      toast.success("Carteira configurada.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }
