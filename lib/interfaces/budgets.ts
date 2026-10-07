import type { ReactNode } from "react";
export type BudgetInput = { categoryId: string; competenceMonth: string; amountCents: number };
export type BudgetExpense = {
  id: string; categoryId: string | null; categoryName: string; accountName: string;
  amountCents: number; date: string; description: string;
  pending: boolean; origin: string;
};
export type BudgetCategory = { id: string; name: string; isArchived: boolean; group: string };
export type BudgetLimit = BudgetInput & { id: string };
export type BudgetRow = {
  categoryId: string | null; categoryName: string; archived: boolean;
  limit: BudgetLimit | null; postedCents: number; pendingCents: number;
  committedCents: number; remainingCents: number | null; percent: number | null;
  state: "below" | "warning" | "reached" | null; expenses: BudgetExpense[];
};
export type BudgetOverview = { month: string; categories: BudgetCategory[]; rows: BudgetRow[]; committedCents: number };
export type BudgetsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export type BudgetRowProps = { row: BudgetRow; month: string };
export type BudgetMetricValue = [label: string, value: ReactNode];
export type BudgetFormProps = { month: string; categories: BudgetCategory[]; limit?: BudgetLimit; onSaved?: () => void };

export type BudgetMonthProps = { month: string };
export type BudgetsViewProps = { overview: BudgetOverview };
export type BudgetKey = Omit<BudgetInput, "amountCents">;

export type BudgetDialogProps = BudgetFormProps & { trigger?: ReactNode };
export type BudgetExpensesProps = { row: BudgetRow };
export type BudgetSectionProps = { title: string; description: string; rows: BudgetRow[]; month: string; columns?: 1 | 2 };
