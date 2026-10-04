import type {
GoalCard
} from "@/components/finance/goals/goals-types";
import {
buildIsoDate
} from "@/components/finance/goals/goals-utils";
import type { GoalsViewOpenAllocationDialogContext } from "@/lib/interfaces/component-actions/goals-view-open-allocation-dialog";

export function GoalsViewOpenAllocationDialog({ setAllocationForm, setAllocationDialog }: GoalsViewOpenAllocationDialogContext, goal: GoalCard, type: "manual_allocation" | "manual_release") {
    setAllocationForm({
      amount: "",
      occurredOn: buildIsoDate(),
      notes: "",
    });
    setAllocationDialog({ goal, type });
  }
