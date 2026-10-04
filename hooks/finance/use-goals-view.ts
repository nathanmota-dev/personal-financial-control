"use client";
import type {
AllocationDialogState,
AllocationFormState,
ContributionDialogState,
ContributionFormState,
GoalCard,
GoalDialogState,
GoalFormState,
GoalsDashboard,
MutationAction,
} from "@/components/finance/goals/goals-types";
import {
buildIsoDate,
emptyGoalForm
} from "@/components/finance/goals/goals-utils";
import { GoalsViewBeginMutation } from "@/lib/utils/component-actions/goals-view-begin-mutation";
import { GoalsViewEndMutation } from "@/lib/utils/component-actions/goals-view-end-mutation";
import { GoalsViewOpenAllocationDialog } from "@/lib/utils/component-actions/goals-view-open-allocation-dialog";
import { GoalsViewOpenContributionDialog } from "@/lib/utils/component-actions/goals-view-open-contribution-dialog";
import { GoalsViewOpenCreateGoal } from "@/lib/utils/component-actions/goals-view-open-create-goal";
import { GoalsViewOpenEditGoal } from "@/lib/utils/component-actions/goals-view-open-edit-goal";
import { GoalsViewSubmitAllocation } from "@/lib/utils/component-actions/goals-view-submit-allocation";
import { GoalsViewSubmitArchiveGoal } from "@/lib/utils/component-actions/goals-view-submit-archive-goal";
import { GoalsViewSubmitContribution } from "@/lib/utils/component-actions/goals-view-submit-contribution";
import { GoalsViewSubmitGoal } from "@/lib/utils/component-actions/goals-view-submit-goal";
import { useRouter } from "next/navigation";
import { useRef,useState,useTransition } from "react";

export function useGoalsView({ dashboard }: { dashboard: GoalsDashboard }) {
const router = useRouter();

const [isPending, startTransition] = useTransition();

const mutationInFlightRef = useRef(false);

const [submittingAction, setSubmittingAction] = useState<MutationAction | null>(
    null
  );

const [goalDialog, setGoalDialog] = useState<GoalDialogState>(null);

const [goalForm, setGoalForm] = useState<GoalFormState>(() => emptyGoalForm());

const [allocationDialog, setAllocationDialog] =
    useState<AllocationDialogState>(null);

const [allocationForm, setAllocationForm] = useState<AllocationFormState>({
    amount: "",
    occurredOn: buildIsoDate(),
    notes: "",
  });

const [contributionDialog, setContributionDialog] =
    useState<ContributionDialogState>(null);

const [contributionForm, setContributionForm] = useState<ContributionFormState>({
    amount: "",
    transactionDate: buildIsoDate(),
    accountId: dashboard.options.sourceAccounts[0]?.id ?? "",
    categoryId: dashboard.options.investmentCategories[0]?.id ?? "",
    notes: "",
  });

const [archiveGoal, setArchiveGoal] = useState<GoalCard | null>(null);

const canCreateContribution = Boolean(
    dashboard.options.sourceAccounts.length &&
      dashboard.options.investmentCategories.length
  );

const isMutating = isPending || submittingAction !== null;

function beginMutation(action: MutationAction) {
    return GoalsViewBeginMutation({ mutationInFlightRef, setSubmittingAction }, action);
  }

function endMutation() {
    return GoalsViewEndMutation({ mutationInFlightRef, setSubmittingAction });
  }

function openCreateGoal() {
    return GoalsViewOpenCreateGoal({ setGoalForm, setGoalDialog });
  }

function openEditGoal(goal: GoalCard) {
    return GoalsViewOpenEditGoal({ setGoalForm, setGoalDialog }, goal);
  }

function openAllocationDialog(
    goal: GoalCard,
    type: "manual_allocation" | "manual_release"
  ) {
    return GoalsViewOpenAllocationDialog({ setAllocationForm, setAllocationDialog }, goal, type);
  }

function openContributionDialog(goal: GoalCard) {
    return GoalsViewOpenContributionDialog({ setContributionForm, dashboard, setContributionDialog }, goal);
  }

async function submitGoal() {
    return GoalsViewSubmitGoal({ beginMutation, goalForm, goalDialog, setGoalDialog, router, endMutation });
  }

async function submitAllocation() {
    return GoalsViewSubmitAllocation({ allocationDialog, beginMutation, allocationForm, setAllocationDialog, router, endMutation });
  }

async function submitContribution() {
    return GoalsViewSubmitContribution({ contributionDialog, beginMutation, contributionForm, setContributionDialog, router, endMutation });
  }

async function submitArchiveGoal() {
    return GoalsViewSubmitArchiveGoal({ archiveGoal, beginMutation, setArchiveGoal, router, endMutation });
  }
return { isMutating, openCreateGoal, openAllocationDialog, openContributionDialog, openEditGoal, setArchiveGoal, canCreateContribution, goalDialog, goalForm, setGoalForm, setGoalDialog, startTransition, submitGoal, allocationDialog, allocationForm, setAllocationForm, setAllocationDialog, submitAllocation, contributionDialog, contributionForm, setContributionForm, setContributionDialog, submitContribution, archiveGoal, submitArchiveGoal };
}
