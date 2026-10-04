import type {
AllocationDialogState,
AllocationFormState,
MutationAction
} from "@/components/finance/goals/goals-types";

export interface GoalsViewSubmitAllocationContext {
  allocationDialog: AllocationDialogState;
  beginMutation: (action: MutationAction) => boolean;
  allocationForm: AllocationFormState;
  setAllocationDialog: import("react").Dispatch<import("react").SetStateAction<AllocationDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
