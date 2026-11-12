import type { DashboardTotals } from "@/lib/interfaces/dashboard";

export type DashboardBalanceForecastKey = "fixed" | "variable" | "investments" | "free";

export type DashboardBalanceForecastSegment = {
  key: DashboardBalanceForecastKey;
  label: string;
  /** Signed amount shown in the legend. */
  amountCents: number;
  /** Share of the income, in percent (null without income). */
  percent: number | null;
  /** Width of the bar segment, 0–100. */
  width: number;
  /** Tailwind background class of the bar segment and legend dot. */
  colorClassName: string;
};

export type DashboardBalanceForecastData = {
  incomeCents: number;
  freeCents: number;
  /** Free balance as a percent of the income (null without income). */
  freePercent: number | null;
  segments: DashboardBalanceForecastSegment[];
};

export type DashboardBalanceForecastProps = { totals: DashboardTotals };

export type DashboardBalanceForecastBarProps = { segments: DashboardBalanceForecastSegment[] };

export type DashboardBalanceForecastLegendProps = {
  incomeCents: number;
  segments: DashboardBalanceForecastSegment[];
};
