import {
emptyGoalForm
} from "@/components/finance/goals/goals-utils";
import type { GoalsViewOpenCreateGoalContext } from "@/lib/interfaces/component-actions/goals-view-open-create-goal";

export function GoalsViewOpenCreateGoal({ setGoalForm, setGoalDialog }: GoalsViewOpenCreateGoalContext) {
    setGoalForm(emptyGoalForm());
    setGoalDialog({ mode: "create" });
  }
