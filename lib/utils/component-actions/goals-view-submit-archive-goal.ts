import {
apiRequest
} from "@/components/finance/goals/goals-utils";
import type { GoalsViewSubmitArchiveGoalContext } from "@/lib/interfaces/component-actions/goals-view-submit-archive-goal";
import { toast } from "sonner";

export async function GoalsViewSubmitArchiveGoal({ archiveGoal, beginMutation, setArchiveGoal, router, endMutation }: GoalsViewSubmitArchiveGoalContext) {
    if (!archiveGoal) {
      return;
    }

    if (!beginMutation("archive")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${archiveGoal.id}`,
        {
          method: "DELETE",
        },
        "Não foi possível arquivar a meta."
      );
      toast.success("Meta arquivada.");
      setArchiveGoal(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao arquivar meta.");
    } finally {
      endMutation();
    }
  }
