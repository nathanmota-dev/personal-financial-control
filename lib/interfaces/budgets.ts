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
export type BudgetFormProps = { month: string; categories: BudgetCategory[]; limit?: BudgetLimit };

export type BudgetMonthProps = { month: string };
export type BudgetsViewProps = { overview: BudgetOverview };
export type BudgetKey = Omit<BudgetInput, "amountCents">;
