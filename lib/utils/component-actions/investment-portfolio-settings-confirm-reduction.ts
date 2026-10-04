import {
extractErrorMessage
} from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsConfirmReductionContext } from "@/lib/interfaces/component-actions/investment-portfolio-settings-confirm-reduction";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";
import { toast } from "sonner";

export async function InvestmentPortfolioSettingsConfirmReduction({ pendingReconciliation, saveReconciliation, setIsReductionOpen, setPendingReconciliation, setReductionSources, router }: InvestmentPortfolioSettingsConfirmReductionContext, selections: InvestmentReductionSelection[]) {
    if (!pendingReconciliation) {
      return;
    }

    try {
      await saveReconciliation({
        checkpointBalanceCents: pendingReconciliation.checkpointBalanceCents,
        checkpointDate: pendingReconciliation.checkpointDate,
        sourceSelections: selections,
      });
      toast.success("Saldo conferido e fontes da redução atualizadas.");
      setIsReductionOpen(false);
      setPendingReconciliation(null);
      setReductionSources([]);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }
