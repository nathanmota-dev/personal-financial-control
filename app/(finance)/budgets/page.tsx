import { BudgetsView } from "@/components/finance/budgets/budgets-view";
import { requirePageSession } from "@/lib/auth/server";
import { isValidMonth } from "@/lib/finance-ui";
import type { BudgetsPageProps } from "@/lib/interfaces/budgets";
import { getBudgetOverview } from "@/lib/server/budgets";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  await requirePageSession();
  const params = await searchParams;
  const month = typeof params.month === "string" && isValidMonth(params.month) ? params.month : getFinanceDefaultMonth();
  return <BudgetsView overview={await getBudgetOverview(month)} />;
}
