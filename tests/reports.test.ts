import { describe, expect, it } from "vitest";
import { buildReport, reportMetrics } from "@/lib/report-aggregation";
import { parseReportPeriod, reportHref, reportYearMonths, shiftReportPeriod } from "@/lib/report-periods";
import type { ReportRecords } from "@/lib/interfaces/reports";

function records(income = 500000): ReportRecords {
  const base = { competenceMonth: "2024-02", status: "posted", category: null, account: null };
  return {
    activeTransactions: [
      { ...base, id: "income", type: "income", amountCents: income, description: "Salary" },
      { ...base, id: "contribution", type: "investment_contribution", amountCents: 100000, description: "Save" },
      { ...base, id: "withdrawal", type: "investment_withdrawal", amountCents: 20000, description: "Withdraw" },
      { ...base, id: "expense", type: "expense", status: "pending", amountCents: 300000, description: "Rent" },
    ],
    expenses: [{ id: "expense", amountCents: 300000, competenceMonth: "2024-02", description: "Rent", expenseDate: "2024-02-29", category: null, account: null }],
    installments: [],
  } as unknown as ReportRecords;
}

describe("reports", () => {
  it("calculates the acceptance example, pending amounts and origin entries", () => {
    const report = buildReport({ mode: "monthly", period: "2024-02" }, "2024-02-29", records());
    expect(report.totals).toMatchObject({ operatingResultCents: 200000, savingsRate: 40, netInvestmentFlowCents: 80000, netResultCents: 120000 });
    expect(report.pending).toEqual({ count: 1, amountCents: 300000 });
    expect(report.entries).toHaveLength(4);
    expect(report.categories.find((row) => row.type === "expense")).toMatchObject({ name: "Sem categoria", amountCents: 300000 });
    expect(report.partial).toBe(true);
    expect(report.previousPeriod).toBe("2024-01");
    expect(report.comparison).toEqual({ differenceCents: 200000, percentage: null, hasHistory: false });
  });
  it.each([0, -100])("marks savings on income %s as inapplicable", (income) => {
    expect(buildReport({ mode: "monthly", period: "2024-02" }, "2024-03-01", records(income)).totals.savingsRate).toBeNull();
  });
  it("sums annual totals and calculates rates over the totals rather than averaging rates", () => {
    const data = records();
    data.activeTransactions.push({ ...data.activeTransactions[0], id: "march", competenceMonth: "2024-03", amountCents: 100000 });
    const annual = buildReport({ mode: "annual", period: "2024" }, "2024-03-10", data);
    expect(annual.months).toHaveLength(3);
    expect(annual.series).toHaveLength(3);
    expect(annual.averageDivisor).toBe(3);
    expect(annual.averageIncomeCents).toBe(200000);
    expect(annual.totals.savingsRate).toBe(50);
    expect(annual.totals.incomeCents).toBe(annual.series.reduce((sum, month) => sum + month.metrics.incomeCents, 0));
    expect(buildReport({ mode: "annual", period: "2024" }, "2025-01-01", data).series).toHaveLength(12);
  });
  it.each([0, -100, 100])("keeps absolute comparison and guards previous result %s", (previousIncome) => {
    const data = records();
    data.activeTransactions.push({ ...data.activeTransactions[0], id: "previous", competenceMonth: "2024-01", amountCents: previousIncome });
    const report = buildReport({ mode: "monthly", period: "2024-02" }, "2024-03-01", data);
    expect(report.comparison.hasHistory).toBe(true);
    expect(report.comparison.differenceCents).toBe(200000 - previousIncome);
    expect(report.comparison.percentage).toBe(previousIncome > 0 ? 199900 : null);
    expect(report.categories.find((row) => row.type === "income")?.previousCents).toBe(previousIncome);
  });
  it("handles an empty future year without a zero divisor or invented history", () => {
    const report = buildReport({ mode: "annual", period: "2027" }, "2026-07-16", { activeTransactions: [], expenses: [], installments: [] });
    expect(report.future).toBe(true);
    expect(report.averageIncomeCents).toBeNull();
    expect(report.totals.incomeCents).toBe(0);
    expect(report.categories).toEqual([]);
    expect(reportMetrics(report.totals).savingsRate).toBeNull();
  });
  it("validates URL filters and deterministic year boundaries", () => {
    expect(parseReportPeriod({}, "2026-07")).toEqual({ mode: "monthly", period: "2026-07" });
    expect(parseReportPeriod({ mode: "annual" }, "2026-07")).toEqual({ mode: "annual", period: "2026" });
    for (const params of [{ mode: "bad" }, { period: "2026-13" }, { period: ["2026-01", "2026-02"] }, { period: "0001-01" }, { mode: "annual", period: "9999" }]) expect(parseReportPeriod(params, "2026-07")).toBeNull();
    expect(shiftReportPeriod("monthly", "2024-01", -1)).toBe("2023-12");
    expect(shiftReportPeriod("monthly", "2023-12", 1)).toBe("2024-01");
    expect(shiftReportPeriod("annual", "2024", -1)).toBe("2023");
    expect(reportYearMonths("2023", "2024-02-29")).toHaveLength(12);
    expect(reportYearMonths("2024", "2024-02-29")).toEqual(["2024-01", "2024-02"]);
    expect(reportHref("monthly", "2024-02")).toBe("/reports?mode=monthly&period=2024-02");
  });
});
