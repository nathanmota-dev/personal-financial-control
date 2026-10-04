import type {
ContributionDialogState,
ContributionFormState,
MutationAction
} from "@/components/finance/goals/goals-types";

export interface GoalsViewSubmitContributionContext {
  contributionDialog: ContributionDialogState;
  beginMutation: (action: MutationAction) => boolean;
  contributionForm: ContributionFormState;
  setContributionDialog: import("react").Dispatch<import("react").SetStateAction<ContributionDialogState>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
