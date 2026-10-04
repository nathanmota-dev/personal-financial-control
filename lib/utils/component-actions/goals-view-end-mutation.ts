import type { GoalsViewEndMutationContext } from "@/lib/interfaces/component-actions/goals-view-end-mutation";

export function GoalsViewEndMutation({ mutationInFlightRef, setSubmittingAction }: GoalsViewEndMutationContext) {
    mutationInFlightRef.current = false;
    setSubmittingAction(null);
  }
