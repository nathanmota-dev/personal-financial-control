import {
createInvestmentHoldingAction,
updateInvestmentHoldingAction
} from "@/app/actions/finance";
import {
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewSubmitHoldingContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-submit-holding";
import { toast } from "sonner";

export async function InvestmentPortfolioViewSubmitHolding({ beginMutation, holdingForm, holdingDialog, setHoldingDialog, router, endMutation }: InvestmentPortfolioViewSubmitHoldingContext) {
    if (!beginMutation("holding")) {
      return;
    }

    try {
      const payload = {
        name: holdingForm.name,
        ticker: holdingForm.ticker || null,
        institutionName: holdingForm.institutionName || null,
        assetClass: holdingForm.assetClass,
        instrumentType: holdingForm.instrumentType,
        currentValueCents: moneyInputToCents(holdingForm.currentValue),
        valueAsOf: holdingForm.valueAsOf,
        notes: holdingForm.notes || null,
      };

      if (holdingDialog?.mode === "edit" && holdingDialog.holding) {
        await updateInvestmentHoldingAction({
          id: holdingDialog.holding.id,
          ...payload,
        });
        toast.success("Ativo atualizado.");
      } else {
        await createInvestmentHoldingAction(payload);
        toast.success("Ativo cadastrado.");
      }

      setHoldingDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }
