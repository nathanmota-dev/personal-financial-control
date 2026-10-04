import {
upsertInvestmentPurposeAllocationAction
} from "@/app/actions/finance";
import {
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewSubmitAllocationContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-submit-allocation";
import { toast } from "sonner";

export async function InvestmentPortfolioViewSubmitAllocation({ beginMutation, allocationForm, setAllocationDialog, router, endMutation }: InvestmentPortfolioViewSubmitAllocationContext) {
    if (!beginMutation("allocation")) {
      return;
    }

    try {
      const amountCents = moneyInputToCents(allocationForm.amount);

      if (amountCents <= 0) {
        toast.error("Informe um valor alocado maior que zero.");
        return;
      }

      await upsertInvestmentPurposeAllocationAction({
        holdingId: allocationForm.holdingId,
        purposeId: allocationForm.purposeId,
        amountCents,
        allocatedOn: allocationForm.allocatedOn,
        notes: allocationForm.notes || null,
      });
      toast.success("Alocação salva.");
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }
