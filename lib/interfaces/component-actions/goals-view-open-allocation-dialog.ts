import type {
AllocationDialogState,
AllocationFormState
} from "@/components/finance/goals/goals-types";

export interface GoalsViewOpenAllocationDialogContext {
  setAllocationForm: import("react").Dispatch<import("react").SetStateAction<AllocationFormState>>;
  setAllocationDialog: import("react").Dispatch<import("react").SetStateAction<AllocationDialogState>>;
}
