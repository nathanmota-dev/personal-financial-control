import { describe, expect, it } from "vitest";

import type { DashboardTotals } from "@/lib/interfaces/dashboard";
import { reportMetrics } from "@/lib/report-aggregation";
import { summarizeReportSeries } from "@/lib/report-overview";

function month(month: string, totals: Partial<DashboardTotals>) {
  const metrics = reportMetrics({
    incomeCents: 0,
    fixedExpenseCents: 0,
    variableExpenseCents: 0,
    uncategorizedExpenseCents: 0,
    investmentContributionCents: 0,
    investmentWithdrawalCents: 0,
    netInvestmentFlowCents: 0,
    netResultCents: 0,
    ...totals,
  });
  return { month, metrics, hasMovements: true };
}

describe("report overview", () => {
  it("adds the monthly series and computes the savings rate over the totals", () => {
    const totals = summarizeReportSeries([
      month("2026-01", { incomeCents: 100000, fixedExpenseCents: 50000, netInvestmentFlowCents: 10000, netResultCents: 40000 }),
      month("2026-02", { incomeCents: 300000, variableExpenseCents: 100000, uncategorizedExpenseCents: 50000, netResultCents: 150000 }),
    ]);

    expect(totals).toMatchObject({
      incomeCents: 400000,
      expenseCents: 200000,
      operatingResultCents: 200000,
      netInvestmentFlowCents: 10000,
      netResultCents: 190000,
      savingsRate: 50,
    });
  });

  it("has no savings rate without positive income", () => {
    expect(summarizeReportSeries([]).savingsRate).toBeNull();
  });
});
