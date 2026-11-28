import type { ReactNode } from "react";

import type {
AccountType,
CategoryGroup,
RecurringStatus,
RecurringTransactionType,
} from "@/lib/db/schema";
import type { RecurringLinkCandidate, RecurringMonthOccurrence, RecurringOccurrenceEntry, RecurringOccurrencesData } from "@/lib/interfaces/recurring-occurrences";

export type RecurringTab = "recurring" | "category" | "calendar";

export type RecurringAccountOption = {
  id: string;
  name: string;
  type: AccountType;
};

export type RecurringCategoryOption = {
  id: string;
  name: string;
  group: CategoryGroup;
};

export type RecurringTemplateRow = {
  id: string;
  accountId: string;
  categoryId: string;
  type: RecurringTransactionType;
  status: RecurringStatus;
  amountCents: number;
  dayOfMonth: number;
  startMonth: string;
  endMonth?: string | null;
  lastGeneratedMonth?: string | null;
  description: string;
  account: { id: string; name: string } | null;
  category: { id: string; name: string; group: CategoryGroup } | null;
};

export type CategorySpendingItem = {
  categoryId: string;
  categoryName: string;
  amountCents: number;
};

export type RecurringViewProps = {
  accounts: RecurringAccountOption[];
  categories: RecurringCategoryOption[];
  categorySpending: CategorySpendingItem[];
  month: string;
  occurrences: RecurringOccurrencesData;
  templates: RecurringTemplateRow[];
};

export type RecurringDialogProps = {
  accounts: RecurringAccountOption[];
  categories: RecurringCategoryOption[];
  month: string;
  template?: RecurringTemplateRow;
  trigger?: ReactNode;
};

export type RecurringDeleteMode = "keep_history" | "delete_history";

export type RecurringActionButtonProps = {
  id: string;
};

export type RecurringDeleteDialogProps = RecurringActionButtonProps;

export type RecurringCalendarEvent = {
  id: string;
  date: Date;
  description: string;
  amountCents: number;
  type: RecurringTransactionType;
  accountName: string;
  categoryName: string;
  isRecorded: boolean;
};

export type RecurringCalendarProps = Pick<RecurringViewProps, "month" | "occurrences" | "templates">;

export type RecurringCalendarEventItemProps = {
  event: RecurringCalendarEvent;
};

export type RecurringMonthPickerProps = {
  id: string;
  name: string;
  month?: string;
  placeholder: string;
  clearable?: boolean;
  onMonthChange: (month: string | undefined) => void;
  className?: string;
};

export type RecurringCardProps = Pick<RecurringViewProps, "accounts" | "categories" | "month" | "occurrences"> & {
  template: RecurringTemplateRow;
};

export type RecurringSummaryProps = Pick<RecurringViewProps, "month" | "occurrences" | "templates">;

export type RecurringAgendaProps = Pick<RecurringViewProps, "month" | "occurrences" | "templates">;

export type RecurringHeaderMonthPickerProps = Pick<RecurringViewProps, "month">;

export type RecurringMonthSummary = {
  expenseCents: number;
  incomeCents: number;
  investmentCents: number;
  /** What really happened in the month: the generated or linked amounts, which may differ from the rule. */
  recordedExpenseCents: number;
  /** The rules' own amounts of the expenses already recorded, to measure progress against the plan. */
  recordedPlannedExpenseCents: number;
  pendingExpenseCents: number;
  freeCents: number;
  scheduledCount: number;
  recordedCount: number;
  pausedCount: number;
};

export type RecurringGroupProps = Pick<RecurringViewProps, "accounts" | "categories" | "month" | "occurrences"> & {
  title: string;
  description: string;
  templates: RecurringTemplateRow[];
};

export type RecurringOccurrenceStatusProps = {
  template: RecurringTemplateRow;
  month: string;
  isRecorded: boolean;
  occurrence?: RecurringMonthOccurrence;
};

export type RecurringLinkDialogProps = {
  template: RecurringTemplateRow;
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type RecurringLinkCandidateRowProps = {
  candidate: RecurringLinkCandidate;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type RecurringGeneratedEntriesProps = {
  entries: RecurringOccurrenceEntry[];
};
