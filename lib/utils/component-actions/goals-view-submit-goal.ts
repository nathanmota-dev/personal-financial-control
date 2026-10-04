import {
apiRequest,
buildIsoDate
} from "@/components/finance/goals/goals-utils";
import { moneyInputToCents } from "@/lib/finance-ui";
import type { GoalsViewSubmitGoalContext } from "@/lib/interfaces/component-actions/goals-view-submit-goal";
import { toast } from "sonner";

export async function GoalsViewSubmitGoal({ beginMutation, goalForm, goalDialog, setGoalDialog, router, endMutation }: GoalsViewSubmitGoalContext) {
    if (!beginMutation("goal")) {
      return;
    }

    const payload = {
      name: goalForm.name,
      category: goalForm.category,
      targetAmountCents: moneyInputToCents(goalForm.targetAmount),
      targetDate: goalForm.targetDate || null,
      plannedMonthlyContributionCents: goalForm.plannedMonthlyContribution
        ? moneyInputToCents(goalForm.plannedMonthlyContribution)
        : 0,
      priority: Number(goalForm.priority || 0),
      status: goalForm.status,
      color: goalForm.color,
      notes: goalForm.notes || null,
      ...(goalDialog?.mode === "create"
        ? {
            initialAllocationCents: goalForm.initialAllocation
              ? moneyInputToCents(goalForm.initialAllocation)
              : 0,
            initialAllocationDate: buildIsoDate(),
          }
        : {}),
    };

    try {
      if (goalDialog?.mode === "edit" && goalDialog.goal) {
        await apiRequest(
          `/api/goals/${goalDialog.goal.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
          "Não foi possível atualizar a meta."
        );
        toast.success("Meta atualizada.");
      } else {
        await apiRequest(
          "/api/goals",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          "Não foi possível criar a meta."
        );
        toast.success("Meta criada.");
      }

      setGoalDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar meta.");
    } finally {
      endMutation();
    }
  }
