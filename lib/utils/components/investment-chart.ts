import { formatMonthLabel } from "@/lib/finance-ui";

/** Shared geometry of the investment history charts, following the dashboard's line charts. */
export const INVESTMENT_CHART_MARGIN = { top: 30, right: 29, bottom: 8, left: 0 };

export const investmentMonthAxisProps = {
  dataKey: "month",
  axisLine: false,
  tickLine: false,
  tickMargin: 16,
  fontSize: 10,
  stroke: "var(--content-subtle)",
  minTickGap: 20,
  tickFormatter: (value: unknown) => formatMonthLabel(String(value)),
};

export const investmentValueAxisProps = {
  axisLine: false,
  tickLine: false,
  tickCount: 5,
  fontSize: 10,
  stroke: "var(--content-subtle)",
};
