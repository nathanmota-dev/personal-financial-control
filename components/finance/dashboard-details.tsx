import { DashboardBills } from "@/components/finance/dashboard-bills";
import { DashboardHousing } from "@/components/finance/dashboard-housing";
import { DashboardCards } from "@/components/finance/dashboard-cards";
import { DashboardBalances } from "@/components/finance/dashboard-balances";
import { DashboardPortfolio } from "@/components/finance/dashboard-portfolio";
import type { DashboardDetailsProps } from "@/lib/interfaces/dashboard";

export function DashboardDetails({ dashboard, cards, bills, housing, month, investmentOverview }: DashboardDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,390fr)_minmax(0,704fr)]">
      <div className="grid content-start gap-6">
        {/* Cards keep their original width (329/390); the bills panel uses the whole, wider column. */}
        <div className="min-w-0 xl:w-[calc(329/390*100%)]">
          <DashboardCards cards={cards} month={month} />
        </div>
        <DashboardBills data={bills} />
        <DashboardHousing data={housing} />
      </div>
      <div className="grid content-start gap-6">
        <DashboardBalances accounts={dashboard.accountBalances} />
        <DashboardPortfolio investmentOverview={investmentOverview} />
      </div>
    </div>
  );
}
