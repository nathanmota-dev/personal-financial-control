import type {
MutationAction
} from "@/components/finance/goals/goals-types";

export interface GoalsViewEndMutationContext {
  mutationInFlightRef: import("react").RefObject<boolean>;
  setSubmittingAction: import("react").Dispatch<import("react").SetStateAction<MutationAction | null>>;
}
