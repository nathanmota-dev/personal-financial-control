import type {
GoalCard
} from "@/components/finance/goals/goals-types";
import {
goalToForm
} from "@/components/finance/goals/goals-utils";
import type { GoalsViewOpenEditGoalContext } from "@/lib/interfaces/component-actions/goals-view-open-edit-goal";

export function GoalsViewOpenEditGoal({ setGoalForm, setGoalDialog }: GoalsViewOpenEditGoalContext, goal: GoalCard) {
    setGoalForm(goalToForm(goal));
    setGoalDialog({ mode: "edit", goal });
  }
