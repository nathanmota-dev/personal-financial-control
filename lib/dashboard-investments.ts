import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { DashboardInvestmentsData } from "@/lib/interfaces/dashboard-investments";
import type { InvestmentOverview } from "@/lib/interfaces/investment-operations";

export const DASHBOARD_INVESTMENTS_VISIBLE_ITEMS = 6;

/** Reserve + long-term portfolio of the investments overview, shaped for the dashboard card. */
export function buildDashboardInvestments(overview: InvestmentOverview): DashboardInvestmentsData {
  const reserveCents = overview.reserve.amountCents;
  const portfolioCents = overview.portfolioCents;
  const totalCents = reserveCents + portfolioCents;
  const reservePercent = totalCents > 0 ? Math.round((reserveCents / totalCents) * 100) : 0;
  const items: DashboardInvestmentsData["items"] = [
    { id: "reserve", label: "Reserva de emergência", amountCents: reserveCents, group: "reserve" as const },
    ...[...overview.distribution]
      .sort((left, right) => right.amountCents - left.amountCents)
      .map((entry) => ({ id: entry.assetClass, label: investmentAssetClassLabels[entry.assetClass], amountCents: entry.amountCents, group: "portfolio" as const })),
  ].filter((item) => item.amountCents > 0);
  return {
    totalCents,
    reserveCents,
    portfolioCents,
    reservePercent,
    portfolioPercent: totalCents > 0 ? 100 - reservePercent : 0,
    resultCents: overview.resultCents,
    items,
  };
}
