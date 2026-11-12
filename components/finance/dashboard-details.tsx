import { DashboardBalanceForecast } from "@/components/finance/dashboard-balance-forecast";
import { DashboardBills } from "@/components/finance/dashboard-bills";
import { DashboardCards } from "@/components/finance/dashboard-cards";
import { DashboardHousing } from "@/components/finance/dashboard-housing";
import { DashboardInvestments } from "@/components/finance/dashboard-investments";
import type { DashboardDetailsProps } from "@/lib/interfaces/dashboard";

export function DashboardDetails({ dashboard, cards, bills, housing, month, investmentOverview }: DashboardDetailsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      {/* Forecast absorbs any width change; bills and housing keep their column size. */}
      <div className="grid grid-rows-[auto_1fr] gap-6">
        <DashboardBalanceForecast totals={dashboard.totals} />
        {/* Cards keep their original width (329 of the 1094 grid units); investments fill the rest. */}
        <div className="grid gap-6 xl:grid-cols-[calc(329/704*100%)_minmax(0,1fr)]">
          <div className="grid min-w-0">
            <DashboardCards cards={cards} month={month} />
          </div>
          <div className="grid min-w-0">
            <DashboardInvestments overview={investmentOverview} href="/investments" />
          </div>
        </div>
      </div>
      {/* Both columns share the row height; bills and housing split it 50/50, and a taller bills list stretches the cards row. */}
      <div className="grid grid-rows-[1fr_1fr] gap-6">
        <DashboardBills data={bills} />
        <DashboardHousing data={housing} href="/housing" />
      </div>
    </div>
  );
}
