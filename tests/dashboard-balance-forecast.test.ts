import { describe, expect, it } from "vitest";
import { buildDashboardBalanceForecast } from "@/lib/dashboard-balance-forecast";
import type { DashboardTotals } from "@/lib/interfaces/dashboard";

function totals(overrides: Partial<DashboardTotals>): DashboardTotals {
  return {
    incomeCents: 0, fixedExpenseCents: 0, variableExpenseCents: 0, uncategorizedExpenseCents: 0,
    investmentContributionCents: 0, investmentWithdrawalCents: 0, netInvestmentFlowCents: 0, netResultCents: 0,
    ...overrides,
  };
}

describe("dashboard balance forecast", () => {
  it("splits the income into fixed, variable, investments and free balance", () => {
    const data = buildDashboardBalanceForecast(totals({ incomeCents: 10000, fixedExpenseCents: 3000, variableExpenseCents: 2000, uncategorizedExpenseCents: 500, netInvestmentFlowCents: 1000, netResultCents: 3500 }));
    expect(data.freePercent).toBe(35);
    expect(data.segments.map((s) => [s.key, s.amountCents, s.percent, s.width])).toEqual([
      ["fixed", 3000, 30, 30], ["variable", 2500, 25, 25], ["investments", 1000, 10, 10], ["free", 3500, 35, 35],
    ]);
  });

  it("has no percentages or bar without income", () => {
    const data = buildDashboardBalanceForecast(totals({}));
    expect(data.freePercent).toBeNull();
    expect(data.segments.every((s) => s.percent === null && s.width === 0)).toBe(true);
  });

  it("scales the bar when spending passes the income and keeps negative values out of it", () => {
    const data = buildDashboardBalanceForecast(totals({ incomeCents: 1000, fixedExpenseCents: 1500, variableExpenseCents: 500, netInvestmentFlowCents: -200, netResultCents: -1000 }));
    expect(data.freeCents).toBe(-1000);
    const widths = data.segments.map((s) => s.width);
    expect(widths).toEqual([75, 25, 0, 0]);
    expect(data.segments[3].percent).toBe(-100);
  });
});
