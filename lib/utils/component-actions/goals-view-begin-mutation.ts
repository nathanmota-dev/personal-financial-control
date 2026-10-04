import type {
MutationAction
} from "@/components/finance/goals/goals-types";
import type { GoalsViewBeginMutationContext } from "@/lib/interfaces/component-actions/goals-view-begin-mutation";

export function GoalsViewBeginMutation({ mutationInFlightRef, setSubmittingAction }: GoalsViewBeginMutationContext, action: MutationAction) {
    if (mutationInFlightRef.current) {
      return false;
    }

    mutationInFlightRef.current = true;
    setSubmittingAction(action);
    return true;
  }
