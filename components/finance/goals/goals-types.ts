import type {
  ComponentProps,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";

import type { Input } from "@/components/ui/input";
import type { getGoalsDashboard } from "@/lib/server/goals";

export type GoalsDashboard = Awaited<ReturnType<typeof getGoalsDashboard>>;
export type GoalCard = GoalsDashboard["goals"][number];
export type GoalCategory = GoalsDashboard["options"]["goalCategories"][number];
export type GoalStatus = GoalsDashboard["options"]["goalStatuses"][number];
export type AllocationType = GoalsDashboard["options"]["allocationTypes"][number];
export type MutationAction = "goal" | "allocation" | "contribution" | "archive";

export type GoalFormState = {
  name: string;
  category: GoalCategory;
  targetAmount: string;
  targetDate: string;
  plannedMonthlyContribution: string;
  priority: string;
  status: GoalStatus;
  color: string;
  notes: string;
  initialAllocation: string;
};

export type GoalDialogState = {
  mode: "create" | "edit";
  goal?: GoalCard;
} | null;

export type AllocationDialogState = {
  goal: GoalCard;
  type: "manual_allocation" | "manual_release";
} | null;

export type ContributionDialogState = {
  goal: GoalCard;
} | null;

export type AllocationFormState = {
  amount: string;
  occurredOn: string;
  notes: string;
};

export type ContributionFormState = {
  amount: string;
  transactionDate: string;
  accountId: string;
  categoryId: string;
  notes: string;
};

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        message: string;
      };
    };

export type SummaryTone = "cyan" | "sky" | "teal" | "amber" | "violet" | "rose";

export type SummaryCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone: SummaryTone;
};

export type GoalCardItemProps = {
  goal: GoalCard;
  onAllocate: () => void;
  onRelease: () => void;
  onContribute: () => void;
  onEdit: () => void;
  onArchive: () => void;
  canContribute: boolean;
};

export type GoalArchiveCardProps = {
  goal: GoalCard;
};

export type GoalMetricProps = {
  label: string;
  value: string;
};

export type IconButtonProps = {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

export type AllocationBreakdownCardProps = {
  dashboard: GoalsDashboard;
};

export type MonthlyEvolutionCardProps = {
  dashboard: GoalsDashboard;
};

export type RecentAllocationsCardProps = {
  dashboard: GoalsDashboard;
};

export type GoalFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  form: GoalFormState;
  setForm: Dispatch<SetStateAction<GoalFormState>>;
  categories: GoalCategory[];
  statuses: GoalStatus[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type AllocationDialogProps = {
  state: AllocationDialogState;
  form: AllocationFormState;
  setForm: Dispatch<SetStateAction<AllocationFormState>>;
  freeReserveCents: number;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type ContributionDialogProps = {
  state: ContributionDialogState;
  form: ContributionFormState;
  setForm: Dispatch<SetStateAction<ContributionFormState>>;
  sourceAccounts: GoalsDashboard["options"]["sourceAccounts"];
  investmentCategories: GoalsDashboard["options"]["investmentCategories"];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type ArchiveDialogProps = {
  goal: GoalCard | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

export type LabeledInputProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
};
