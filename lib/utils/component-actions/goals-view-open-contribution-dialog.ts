import type {
GoalCard
} from "@/components/finance/goals/goals-types";
import {
buildIsoDate
} from "@/components/finance/goals/goals-utils";
import type { GoalsViewOpenContributionDialogContext } from "@/lib/interfaces/component-actions/goals-view-open-contribution-dialog";

export function GoalsViewOpenContributionDialog({ setContributionForm, dashboard, setContributionDialog }: GoalsViewOpenContributionDialogContext, goal: GoalCard) {
    setContributionForm((state) => ({
      ...state,
      amount: "",
      transactionDate: buildIsoDate(),
      notes: "",
      accountId: state.accountId || dashboard.options.sourceAccounts[0]?.id || "",
      categoryId:
        state.categoryId || dashboard.options.investmentCategories[0]?.id || "",
    }));
    setContributionDialog({ goal });
  }
