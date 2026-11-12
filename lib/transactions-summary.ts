import type { CategorySpendingItem } from "@/lib/interfaces/recurring";
import type { TransactionRow, TransactionTotals, TransactionsFlowSegment } from "@/lib/interfaces/transactions";

const SEGMENTS: { key: keyof TransactionTotals; label: string; colorClassName: string }[] = [
  { key: "income", label: "Receitas", colorClassName: "bg-success" },
  { key: "expense", label: "Despesas", colorClassName: "bg-chart-2" },
  { key: "investment", label: "Aportes", colorClassName: "bg-chart-1" },
  { key: "withdrawal", label: "Resgates", colorClassName: "bg-chart-3" },
];

export function buildTransactionsFlow(totals: TransactionTotals): TransactionsFlowSegment[] {
  const movement = SEGMENTS.reduce((sum, segment) => sum + totals[segment.key], 0);
  return SEGMENTS.map((segment) => ({
    ...segment,
    amountCents: totals[segment.key],
    width: movement > 0 ? (totals[segment.key] / movement) * 100 : 0,
  }));
}

/** Expense totals by category, in the shape the dashboard category bars read. */
export function buildTransactionsSpending(transactions: TransactionRow[]): CategorySpendingItem[] {
  const totals = new Map<string, CategorySpendingItem>();
  for (const item of transactions) {
    if (item.type !== "expense" || item.status === "cancelled") continue;
    const categoryId = item.category?.id ?? "uncategorized";
    const current = totals.get(categoryId) ?? { categoryId, categoryName: item.category?.name ?? "Sem categoria", amountCents: 0 };
    current.amountCents += item.amountCents;
    totals.set(categoryId, current);
  }
  return [...totals.values()];
}
