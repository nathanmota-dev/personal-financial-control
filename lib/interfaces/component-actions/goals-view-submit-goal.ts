import type {
GoalDialogState,
GoalFormState,
MutationAction
} from "@/components/finance/goals/goals-types";

export interface GoalsViewSubmitGoalContext {
  beginMutation: (action: MutationAction) => boolean;
  goalForm: GoalFormState;
  goalDialog: GoalDialogState;
  setGoalDialog: import("react").Dispatch<import("react").SetStateAction<GoalDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
