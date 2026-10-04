import {
createInvestmentPurposeAction,
updateInvestmentPurposeAction
} from "@/app/actions/finance";
import {
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewSubmitPurposeContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-submit-purpose";
import { toast } from "sonner";

export async function InvestmentPortfolioViewSubmitPurpose({ beginMutation, purposeForm, purposeDialog, setPurposeDialog, router, endMutation }: InvestmentPortfolioViewSubmitPurposeContext) {
    if (!beginMutation("purpose")) {
      return;
    }

    try {
      const payload = {
        name: purposeForm.name,
        targetAmountCents: purposeForm.targetAmount.trim()
          ? moneyInputToCents(purposeForm.targetAmount)
          : null,
        color: purposeForm.color,
        notes: purposeForm.notes || null,
      };

      if (purposeDialog?.mode === "edit" && purposeDialog.purpose) {
        await updateInvestmentPurposeAction({
          id: purposeDialog.purpose.id,
          ...payload,
        });
        toast.success("Caixinha atualizada.");
      } else {
        await createInvestmentPurposeAction(payload);
        toast.success("Caixinha criada.");
      }

      setPurposeDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }
