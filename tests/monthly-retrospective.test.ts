import { describe, expect, it } from "vitest";
import { buildMonthlyRetrospective, monthlyCategoryInsights } from "@/lib/monthly-retrospective";
import { buildReport } from "@/lib/report-aggregation";
import type { ReportResult } from "@/lib/interfaces/reports";

function report(): ReportResult {
  const result = buildReport({ mode: "monthly", period: "2026-06" }, "2026-07-16", { activeTransactions: [], expenses: [], installments: [] });
  result.comparison.hasHistory = true;
  return result;
}
function category(id: string, current: number, previous: number, type = "expense") {
  return { id: `${type}:${id}`, name: id === "food" ? "Alimentação" : id, type, amountCents: current, previousCents: previous };
}

describe("monthly retrospective", () => {
  it("explains the 500 to 700 acceptance example without duplicating categories", () => {
    const data = report();
    data.categories = [category("food", 70000, 50000)];
    expect(monthlyCategoryInsights(data)).toEqual([{ id: "expense:food", category: "Alimentação", currentCents: 70000, previousCents: 50000, differenceCents: 20000, percentage: 40, kind: "increase" }]);
  });
  it("requires both inclusive thresholds and ignores other movement types", () => {
    const data = report();
    data.categories = [category("small", 15000, 10000), category("ratio", 120000, 100000), category("low-ratio", 110000, 100000), category("income", 70000, 50000, "income"), category("boundary", 60000, 50000)];
    expect(monthlyCategoryInsights(data).map((row) => row.id)).toEqual(["expense:ratio", "expense:boundary"]);
  });
  it("orders by absolute impact and identifier, caps at three, and handles decreases", () => {
    const data = report();
    data.categories = [category("z", 70000, 50000), category("b", 70000, 50000), category("a", 30000, 50000), category("largest", 90000, 50000)];
    const first = monthlyCategoryInsights(data);
    expect(first.map((row) => row.id)).toEqual(["expense:largest", "expense:a", "expense:b"]);
    expect(first[1]).toMatchObject({ kind: "decrease", percentage: -40 });
    data.categories.reverse();
    expect(monthlyCategoryInsights(data)).toEqual(first);
  });
  it("uses no percentages for zero or negative bases, including new credits", () => {
    const data = report();
    data.categories = [category("new", 20000, 0), category("negative", 10000, -10000), category("credit", -15000, 0), category("gone", 0, 20000)];
    const rows = monthlyCategoryInsights(data);
    expect(rows.find((row) => row.id === "expense:new")).toMatchObject({ kind: "new", percentage: null });
    expect(rows.find((row) => row.id === "expense:negative")).toMatchObject({ kind: "absolute", percentage: null });
    data.categories = [category("credit", -15000, 0)];
    expect(monthlyCategoryInsights(data)[0]).toMatchObject({ kind: "absolute", differenceCents: -15000, percentage: null });
  });
  it.each(["partial", "future", "history"])("avoids conclusive changes for %s", (state) => {
    const data = report();
    data.categories = [category("food", 70000, 50000)];
    if (state === "history") data.comparison.hasHistory = false;
    else data[state as "partial" | "future"] = true;
    expect(monthlyCategoryInsights(data)).toEqual([]);
  });
  it("does not invent largest spending or a savings percentage for an empty or credits-only month", () => {
    const data = report();
    expect(buildMonthlyRetrospective(data, [])).toMatchObject({ largestExpense: null, largestCategory: null, totals: { savingsRate: null } });
    data.categories = [category("credit", -10000, 0)];
    data.entries = [{ id: "credit", amountCents: -10000, type: "expense" } as ReportResult["entries"][number]];
    expect(buildMonthlyRetrospective(data, [])).toMatchObject({ largestExpense: null, largestCategory: null });
  });
  it("selects only positive expenses and net positive categories with stable ties", () => {
    const data = report();
    data.entries = [
      { id: "z", amountCents: 10000, type: "expense" },
      { id: "a", amountCents: 10000, type: "expense", source: "installment" },
      { id: "income", amountCents: 90000, type: "income" },
    ] as ReportResult["entries"];
    data.categories = [category("z", 10000, 0), category("a", 10000, 0), category("income", 90000, 0, "income")];
    const summary = buildMonthlyRetrospective(data, []);
    expect(summary.largestExpense).toMatchObject({ id: "a", source: "installment", amountCents: 10000 });
    expect(summary.largestCategory?.id).toBe("expense:a");
  });
});
