
export interface ContributionDialogDialogContent1Props {
  state: import("@/components/finance/goals/goals-types").ContributionDialogState;
  sourceAccounts: { id: string; name: string; }[];
  investmentCategories: { id: string; name: string; }[];
  onSubmit: () => void;
  form: import("@/components/finance/goals/goals-types").ContributionFormState;
  setForm: import("react").Dispatch<import("react").SetStateAction<import("@/components/finance/goals/goals-types").ContributionFormState>>;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  canSubmit: number | "";
}
