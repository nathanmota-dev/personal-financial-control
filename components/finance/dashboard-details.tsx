import { DashboardCards } from "@/components/finance/dashboard-cards";
import { DashboardBalances } from "@/components/finance/dashboard-balances";
import { DashboardPortfolio } from "@/components/finance/dashboard-portfolio";
import type { DashboardDetailsProps } from "@/lib/interfaces/dashboard";

export function DashboardDetails({ dashboard, cards, month, investmentOverview }: DashboardDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,329fr)_minmax(0,765fr)]">
      <DashboardCards cards={cards} month={month} />
      <div className="grid content-start gap-6">
        <DashboardBalances accounts={dashboard.accountBalances} />
        <DashboardPortfolio investmentOverview={investmentOverview} />
      </div>
    </div>
  );
}
