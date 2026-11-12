import type { InvestmentOverview } from "@/lib/interfaces/investment-operations";

export type DashboardInvestmentsItem = {
  id: string;
  label: string;
  amountCents: number;
  /** Which side of the split bar the item belongs to. */
  group: "reserve" | "portfolio";
};

export type DashboardInvestmentsData = {
  totalCents: number;
  reserveCents: number;
  portfolioCents: number;
  /** Integer percentages of the total; both are 0 when there is nothing invested. */
  reservePercent: number;
  portfolioPercent: number;
  resultCents: number;
  items: DashboardInvestmentsItem[];
};

export type DashboardInvestmentsProps = { overview: InvestmentOverview; href?: string };

export type DashboardInvestmentsSplitProps = Pick<DashboardInvestmentsData, "reserveCents" | "portfolioCents" | "reservePercent" | "portfolioPercent">;

export type DashboardInvestmentsItemsProps = { items: DashboardInvestmentsItem[] };
