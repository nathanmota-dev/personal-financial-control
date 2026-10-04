import type {
GoalDialogState,
GoalFormState
} from "@/components/finance/goals/goals-types";

export interface GoalsViewOpenCreateGoalContext {
  setGoalForm: import("react").Dispatch<import("react").SetStateAction<GoalFormState>>;
  setGoalDialog: import("react").Dispatch<import("react").SetStateAction<GoalDialogState>>;
}
