import { DashboardExpenses } from "@/components/finance/dashboard-expenses";
import { DashboardBalances } from "@/components/finance/dashboard-balances";
import { DashboardPortfolio } from "@/components/finance/dashboard-portfolio";
import type { DashboardDetailsProps } from "@/lib/interfaces/dashboard";

export function DashboardDetails({ dashboard, expenses, investmentOverview }: DashboardDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
      <DashboardExpenses expenses={expenses} />
      <div className="grid content-start gap-6">
        <DashboardBalances accounts={dashboard.accountBalances} />
        <DashboardPortfolio investmentOverview={investmentOverview} />
      </div>
    </div>
  );
}
