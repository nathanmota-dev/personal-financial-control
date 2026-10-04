import {
apiRequest
} from "@/components/finance/goals/goals-utils";
import { moneyInputToCents } from "@/lib/finance-ui";
import type { GoalsViewSubmitAllocationContext } from "@/lib/interfaces/component-actions/goals-view-submit-allocation";
import { toast } from "sonner";

export async function GoalsViewSubmitAllocation({ allocationDialog, beginMutation, allocationForm, setAllocationDialog, router, endMutation }: GoalsViewSubmitAllocationContext) {
    if (!allocationDialog) {
      return;
    }

    if (!beginMutation("allocation")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${allocationDialog.goal.id}/allocations`,
        {
          method: "POST",
          body: JSON.stringify({
            type: allocationDialog.type,
            amountCents: moneyInputToCents(allocationForm.amount),
            occurredOn: allocationForm.occurredOn,
            notes: allocationForm.notes || null,
          }),
        },
        "Não foi possível atualizar a alocação."
      );
      toast.success(
        allocationDialog.type === "manual_release"
          ? "Saldo liberado."
          : "Saldo alocado."
      );
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar alocação."
      );
    } finally {
      endMutation();
    }
  }
