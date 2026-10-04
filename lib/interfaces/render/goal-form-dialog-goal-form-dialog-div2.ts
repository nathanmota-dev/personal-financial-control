
export interface GoalFormDialogDiv2Props {
  form: import("@/components/finance/goals/goals-types").GoalFormState;
  setForm: import("react").Dispatch<import("react").SetStateAction<import("@/components/finance/goals/goals-types").GoalFormState>>;
  categories: ("other" | "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency")[];
  statuses: ("active" | "paused" | "completed" | "archived")[];
  isCreate: boolean;
}
