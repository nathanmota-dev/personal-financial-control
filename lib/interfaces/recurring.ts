import type { ReactNode } from "react";

import type {
  AccountType,
  CategoryGroup,
  RecurringStatus,
  RecurringTransactionType,
} from "@/lib/db/schema";

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
  templates: RecurringTemplateRow[];
};

export type RecurringDialogProps = {
  accounts: RecurringAccountOption[];
  categories: RecurringCategoryOption[];
  month: string;
  template?: RecurringTemplateRow;
  trigger?: ReactNode;
};

export type RecurringActionButtonProps = {
  id: string;
};

export type EndRecurringButtonProps = RecurringActionButtonProps & {
  month: string;
};

export type RecurringCalendarEvent = {
  id: string;
  date: Date;
  description: string;
  amountCents: number;
  type: RecurringTransactionType;
  accountName: string;
  categoryName: string;
  isGenerated: boolean;
};

export type RecurringCalendarProps = {
  month: string;
  templates: RecurringTemplateRow[];
};

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
