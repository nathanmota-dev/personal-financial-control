import type { DashboardTotals } from "@/lib/interfaces/dashboard";
import type { ReportMetrics, ReportResult } from "@/lib/interfaces/reports";
import { reportMetrics } from "@/lib/report-aggregation";

const totalKeys = [
  "incomeCents",
  "fixedExpenseCents",
  "variableExpenseCents",
  "uncategorizedExpenseCents",
  "investmentContributionCents",
  "investmentWithdrawalCents",
  "netInvestmentFlowCents",
  "netResultCents",
] as const satisfies readonly (keyof DashboardTotals)[];

/** Period totals rebuilt from the monthly series, with the savings rate taken over the totals. */
export function summarizeReportSeries(series: ReportResult["series"]): ReportMetrics {
  const totals = Object.fromEntries(totalKeys.map((key) => [key, 0])) as DashboardTotals;
  for (const { metrics } of series) for (const key of totalKeys) totals[key] += metrics[key];
  return reportMetrics(totals);
}
