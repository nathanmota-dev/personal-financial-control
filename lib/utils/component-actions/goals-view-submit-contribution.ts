import {
apiRequest
} from "@/components/finance/goals/goals-utils";
import { moneyInputToCents } from "@/lib/finance-ui";
import type { GoalsViewSubmitContributionContext } from "@/lib/interfaces/component-actions/goals-view-submit-contribution";
import { toast } from "sonner";

export async function GoalsViewSubmitContribution({ contributionDialog, beginMutation, contributionForm, setContributionDialog, router, endMutation }: GoalsViewSubmitContributionContext) {
    if (!contributionDialog) {
      return;
    }

    if (!beginMutation("contribution")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${contributionDialog.goal.id}/contributions`,
        {
          method: "POST",
          body: JSON.stringify({
            accountId: contributionForm.accountId,
            categoryId: contributionForm.categoryId,
            amountCents: moneyInputToCents(contributionForm.amount),
            transactionDate: contributionForm.transactionDate,
            notes: contributionForm.notes || null,
          }),
        },
        "Não foi possível registrar o aporte."
      );
      toast.success("Aporte registrado na meta.");
      setContributionDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao registrar aporte."
      );
    } finally {
      endMutation();
    }
  }
