import type { ReportMode } from "@/lib/interfaces/reports";

export type ExpenseGroupKey = "fixed" | "variable" | "unclassified";
export type ExpenseGroupItem = {
  id: string;
  description: string;
  amountCents: number;
  expenseDate: string;
  competenceMonth: string;
  categoryId: string | null;
  categoryName: string;
  accountName: string;
  source: "transaction" | "installment";
  isRecurring: boolean;
};
export type ExpenseGroupTotals = {
  fixedCents: number;
  variableCents: number;
  unclassifiedCents: number;
  totalCents: number;
  fixedShare: number | null;
  variableShare: number | null;
  unclassifiedShare: number | null;
};
export type ExpenseGroupMonth = { month: string } & Pick<ExpenseGroupTotals, "fixedCents" | "variableCents" | "unclassifiedCents">;
export type ExpenseGroupsReport = {
  totals: ExpenseGroupTotals;
  groups: Record<ExpenseGroupKey, ExpenseGroupItem[]>;
  series: ExpenseGroupMonth[];
  recurringInVariableCount: number;
};
export type ExpenseGroupCategory = { id: string | null; name: string; count: number; amountCents: number; share: number | null };
export type ExpenseGroupsViewProps = { report: ExpenseGroupsReport; mode: ReportMode };
export type ExpenseGroupTableProps = { title: string; items: ExpenseGroupItem[]; totalCents: number; groupByCategory: boolean };
export type ExpenseGroupCardsProps = { totals: ExpenseGroupTotals };
export type ExpenseGroupChartProps = ExpenseGroupCardsProps & { series: ExpenseGroupMonth[]; mode: ReportMode };
export type ExpenseGroupMobileProps = { item: ExpenseGroupItem };
export type ExpenseGroupCategoriesProps = { items: ExpenseGroupItem[]; totalCents: number };
export type ExpenseGroupsWarningProps = { count: number };
