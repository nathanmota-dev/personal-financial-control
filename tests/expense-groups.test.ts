import { describe, expect, it } from "vitest";
import { aggregateDashboardMonth } from "@/lib/dashboard-aggregation";
import { buildExpenseGroupsReport, classifyExpenseGroup, summarizeExpenseGroupCategories } from "@/lib/expense-groups";
import { formatExpenseShare } from "@/lib/expense-groups-presentation";
import { expenseGroupRecords } from "@/tests/helpers/expense-groups";

describe("expense groups", () => {
  it.each([["fixed_expense", "fixed"], ["variable_expense", "variable"], ["income", "unclassified"], ["investment", "unclassified"], [undefined, "unclassified"]] as const)("classifies %s as %s", (group, expected) => {
    expect(classifyExpenseGroup(group)).toBe(expected);
  });
  it("reconciles cents, shares, card invoice months and recurring warnings with the dashboard", () => {
    const records = expenseGroupRecords();
    const report = buildExpenseGroupsReport(records, ["2026-06"]);
    const dashboard = aggregateDashboardMonth("2026-06", records.activeTransactions, records.expenses);
    expect(report.totals).toEqual({ fixedCents: 320000, variableCents: 180000, unclassifiedCents: 0, totalCents: 500000, fixedShare: 0.64, variableShare: 0.36, unclassifiedShare: 0 });
    expect(report.totals.fixedCents).toBe(dashboard.totals.fixedExpenseCents);
    expect(report.totals.variableCents).toBe(dashboard.totals.variableExpenseCents);
    expect(report.totals.unclassifiedCents).toBe(dashboard.totals.uncategorizedExpenseCents);
    expect(report.groups.variable.map((item) => item.id)).toEqual(["food", "card", "refund"]);
    expect(report.groups.variable[1]).toMatchObject({ source: "installment", isRecurring: false, expenseDate: "2026-05-20", competenceMonth: "2026-06", accountName: "Cartão" });
    expect(report.groups.fixed[0].isRecurring).toBe(true);
    expect(report.groups.variable[0].isRecurring).toBe(true);
    expect(report.recurringInVariableCount).toBe(1);
    expect(formatExpenseShare(report.totals.fixedShare)).toBe("64,0%");
    expect(records.expenses).toHaveLength(5);
  });
  it("preserves missing and other-group categories, fallbacks and stable amount/date/id ordering", () => {
    const records = expenseGroupRecords();
    records.expenses = [
      { ...records.expenses[0], id: "c", amountCents: 100, category: null, account: null },
      { ...records.expenses[0], id: "b", amountCents: 100, category: null, expenseDate: "2026-06-01" },
      { ...records.expenses[0], id: "a", amountCents: 100, category: null, expenseDate: "2026-06-01" },
      { ...records.expenses[0], id: "income-category", amountCents: 200, category: { ...records.expenses[0].category!, group: "income" } },
    ];
    const report = buildExpenseGroupsReport(records, ["2026-06"]);
    expect(report.groups.unclassified.map((item) => item.id)).toEqual(["income-category", "a", "b", "c"]);
    expect(report.groups.unclassified[3]).toMatchObject({ categoryId: null, categoryName: "Sem categoria", accountName: "Conta ausente", source: "transaction", isRecurring: false });
    expect(report.totals.unclassifiedShare).toBe(1);
  });
  it.each([0, -100])("returns null shares for a total of %s without dropping credits", (amountCents) => {
    const records = expenseGroupRecords();
    records.expenses = [{ ...records.expenses[0], amountCents }];
    const report = buildExpenseGroupsReport(records, ["2026-06"]);
    expect(report.totals).toMatchObject({ totalCents: amountCents, fixedShare: null, variableShare: null, unclassifiedShare: null });
    expect(report.groups.fixed).toHaveLength(1);
    expect(formatExpenseShare(report.totals.fixedShare)).toBe("—");
  });
  it("returns one sorted series point per requested month, including empty months", () => {
    const report = buildExpenseGroupsReport(expenseGroupRecords(), ["2026-07", "2026-05", "2026-06", "2026-06"]);
    expect(report.series).toEqual([
      { month: "2026-05", fixedCents: 0, variableCents: 0, unclassifiedCents: 0 },
      { month: "2026-06", fixedCents: 320000, variableCents: 180000, unclassifiedCents: 0 },
      { month: "2026-07", fixedCents: 0, variableCents: 0, unclassifiedCents: 999999 },
    ]);
    expect(buildExpenseGroupsReport(expenseGroupRecords(), []).totals.totalCents).toBe(0);
  });
  it("summarizes annual categories with occurrences and signed shares over group totals", () => {
    const report = buildExpenseGroupsReport(expenseGroupRecords(), ["2026-06"]);
    expect(summarizeExpenseGroupCategories(report.groups.variable, 180000)).toEqual([{ id: "food", name: "Alimentação", count: 3, amountCents: 180000, share: 1 }]);
    const uncategorized = { ...report.groups.variable[0], categoryId: null, categoryName: "Sem categoria" };
    expect(summarizeExpenseGroupCategories([uncategorized], 0)[0].share).toBeNull();
    expect(summarizeExpenseGroupCategories([uncategorized, { ...uncategorized, categoryId: "a" }], 300000).map((item) => item.id)).toEqual([null, "a"]);
  });
});
