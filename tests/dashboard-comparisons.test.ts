import { describe, expect, it } from "vitest";
import { compareDashboardMetric, buildDashboardChartSummary } from "@/lib/dashboard-comparisons";
import { aggregateDashboardMonth } from "@/lib/dashboard-aggregation";
import { buildDashboardCategoryDistribution } from "@/lib/dashboard-categories";

describe("dashboard comparisons", () => {
  it.each([
    [12000, 10000, "higher", "up", "positive", 20],
    [8000, 10000, "higher", "down", "negative", -20],
    [12000, 10000, "lower", "up", "negative", 20],
    [8000, 10000, "lower", "down", "positive", -20],
    [12000, 10000, "neutral", "up", "neutral", 20],
    [8000, 10000, "neutral", "down", "neutral", -20],
    [10000, 10000, "higher", "stable", "neutral", 0],
    [100, 0, "higher", "up", "positive", null],
    [-5000, -10000, "higher", "up", "positive", null],
    [-10000, 10000, "higher", "down", "negative", null],
  ] as const)("compares %s against %s preferring %s", (current, previous, preference, direction, tone, percentage) => {
    expect(compareDashboardMetric(current, previous, true, preference)).toMatchObject({ differenceCents: current - previous, direction, tone, percentage });
  });
  it("distinguishes no history from a zero baseline and avoids rounding changes to 0%", () => {
    expect(compareDashboardMetric(100, 0, false)).toMatchObject({ valueLabel: "—", tone: "neutral", description: "Sem movimentações no mês anterior" });
    expect(compareDashboardMetric(100, 0, true).description).toContain("1,00");
    expect(compareDashboardMetric(100001, 100000, true).description).toContain("menos de 0,1%");
    expect(compareDashboardMetric(99999, 100000, true).valueLabel).toBe("−menos de 0,1%");
    expect(compareDashboardMetric(10000, 10000, true).description).toContain("Sem variação");
  });
  it("averages all displayed months and labels accumulated zero neutrally", () => {
    const empty = aggregateDashboardMonth("2026-01", [], []);
    const months = [empty, { ...empty, totals: { ...empty.totals, incomeCents: 600, netResultCents: 600 } }];
    expect(buildDashboardChartSummary(months, compareDashboardMetric(600, 0, false))).toMatchObject({ averageIncomeCents: 300, accumulatedCents: 600, resultLabel: "positivo" });
    expect(buildDashboardChartSummary([], compareDashboardMetric(0, 0, false))).toMatchObject({ averageIncomeCents: 0, resultLabel: "neutro" });
    expect(buildDashboardChartSummary([{ ...empty, totals: { ...empty.totals, netResultCents: -100 } }], compareDashboardMetric(-100, 0, true)).resultLabel).toBe("negativo");
  });
});

describe("category distribution", () => {
  it("excludes credits and zero categories from percentages but reconciles the net total", () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({ categoryId: String(index), categoryName: `Category ${index}`, amountCents: 100 }));
    const credit = { categoryId: "credit", categoryName: "Refunds", amountCents: -200 };
    const result = buildDashboardCategoryDistribution([...rows, credit, { ...credit, categoryId: "zero", amountCents: 0 }]);
    expect(result).toMatchObject({ positiveTotalCents: 600, netTotalCents: 400, credits: [credit] });
    expect(result.chart).toHaveLength(5);
    expect(result.chart[4]).toMatchObject({ categoryName: "Outras", amountCents: 200 });
    expect(buildDashboardCategoryDistribution([credit]).chart).toEqual([]);
    expect(buildDashboardCategoryDistribution([]).netTotalCents).toBe(0);
  });
});
