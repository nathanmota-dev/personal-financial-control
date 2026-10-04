import {
getInvestmentReductionSourcesAction
} from "@/app/actions/finance";
import {
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsOnReconcileContext } from "@/lib/interfaces/component-actions/investment-portfolio-settings-on-reconcile";
import { toast } from "sonner";

export async function InvestmentPortfolioSettingsOnReconcile({ projection, reconciledBalance, setReductionSources, setPendingReconciliation, reconciledDate, setIsReconcileOpen, setIsReductionOpen, saveReconciliation, router }: InvestmentPortfolioSettingsOnReconcileContext) {
    if (!projection) {
      return;
    }

    try {
      const checkpointBalanceCents = moneyInputToCents(reconciledBalance);

      if (checkpointBalanceCents < projection.currentBalanceCents) {
        const amountCents = projection.currentBalanceCents - checkpointBalanceCents;
        const sourceResult = await getInvestmentReductionSourcesAction();
        setReductionSources(sourceResult.sources);
        setPendingReconciliation({
          checkpointBalanceCents,
          checkpointDate: reconciledDate,
          amountCents,
        });
        setIsReconcileOpen(false);
        setIsReductionOpen(true);
        return;
      }

      await saveReconciliation({ checkpointBalanceCents, checkpointDate: reconciledDate });
      toast.success("Saldo real conferido e novo checkpoint criado.");
      setIsReconcileOpen(false);
      setPendingReconciliation(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }
