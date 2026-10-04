import {
deleteInvestmentPurposeAllocationAction
} from "@/app/actions/finance";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewDeleteAllocationContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-delete-allocation";
import { toast } from "sonner";

export async function InvestmentPortfolioViewDeleteAllocation({ allocationDialog, beginMutation, setAllocationDialog, router, endMutation }: InvestmentPortfolioViewDeleteAllocationContext) {
    if (!allocationDialog?.existingAllocation || !beginMutation("delete-allocation")) {
      return;
    }

    try {
      await deleteInvestmentPurposeAllocationAction(
        allocationDialog.existingAllocation.id
      );
      toast.success("Alocação removida.");
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }
