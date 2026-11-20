import { describe, expect, it } from "vitest";

import type { PredictabilityBudgetItem, PredictabilityExpense } from "@/lib/interfaces/predictability";
import {
  allocateExpenses,
  calculatePredictability,
  listCycleDates,
  resolveCycle,
  splitAllowance,
} from "@/lib/predictability";
import { buildPredictabilityCalendarWeeks } from "@/lib/predictability-calendar";

// Pay day on the 1st of a 30-day month keeps the user's example: R$ 1.500 => R$ 50 per day.
const cycle = resolveCycle(1, "2026-11-15");
const budget: PredictabilityBudgetItem[] = [
  { id: "salary", kind: "income", description: "Salário", date: "2026-11-01", amountCents: 500000 },
  { id: "rent", kind: "fixed", description: "Aluguel", date: "2026-11-10", amountCents: 150000 },
  { id: "groceries", kind: "fixed", description: "Mercado", date: "2026-11-05", amountCents: 70000 },
  { id: "invest", kind: "fixed", description: "Investimento", date: "2026-11-05", amountCents: 50000 },
  { id: "card", kind: "credit_card", description: "Fatura", date: "2026-11-10", amountCents: 80000 },
];

function expense(day: number, amountCents: number, id = `expense-${day}-${amountCents}`): PredictabilityExpense {
  return { id, date: `2026-11-${String(day).padStart(2, "0")}`, description: id, amountCents };
}

function run(expenses: PredictabilityExpense[], today = "2026-11-01") {
  return calculatePredictability({ today, cycle, budgetItems: budget, expenses });
}

function statuses(result: ReturnType<typeof run>) {
  return result.days.map((day) => day.status);
}

describe("predictability cycle", () => {
  it("runs from the pay day to the eve of the next one", () => {
    expect(resolveCycle(5, "2026-11-20")).toMatchObject({
      start: "2026-11-05",
      end: "2026-12-04",
      dayCount: 30,
      previousStart: "2026-10-05",
      nextStart: "2026-12-05",
    });
    expect(resolveCycle(5, "2026-11-03")).toMatchObject({ start: "2026-10-05", end: "2026-11-04", dayCount: 31 });
  });

  it("adapts to short months and to the 31st", () => {
    expect(resolveCycle(31, "2027-02-28")).toMatchObject({ start: "2027-02-28", end: "2027-03-30", dayCount: 31 });
    expect(resolveCycle(31, "2027-03-30")).toMatchObject({ start: "2027-02-28", end: "2027-03-30" });
    expect(resolveCycle(30, "2027-02-10")).toMatchObject({ start: "2027-01-30", end: "2027-02-27", dayCount: 29 });
  });

  it("falls back to the calendar month without a recurring income", () => {
    expect(resolveCycle(null, "2027-02-10")).toMatchObject({
      start: "2027-02-01",
      end: "2027-02-28",
      dayCount: 28,
      anchorDay: null,
      previousStart: "2027-01-01",
      nextStart: "2027-03-01",
    });
    expect(listCycleDates({ start: "2026-11-02", end: "2026-11-01" })).toEqual([]);
  });
});

describe("predictability allowance", () => {
  it("splits whole cents and keeps the exact sum", () => {
    const allowance = splitAllowance(100001, 30);
    expect(allowance.reduce((total, value) => total + value, 0)).toBe(100001);
    expect(allowance[0]).toBe(3334);
    expect(allowance[29]).toBe(3333);
    expect(splitAllowance(-100, 3)).toEqual([0, 0, 0]);
    expect(splitAllowance(100, 0)).toEqual([]);
  });

  it("divides what is left after income, fixed bills and the card invoice", () => {
    const result = run([]);
    expect(result.summary).toMatchObject({
      incomeCents: 500000,
      fixedCents: 270000,
      creditCardCents: 80000,
      budgetCents: 150000,
      dailyAllowanceCents: 5000,
      remainingCents: 150000,
      availableTodayCents: 5000,
      overflowCents: 0,
      freeDays: 30,
      consumedDays: 0,
      alerts: [],
    });
    expect(result.days).toHaveLength(30);
    expect(result.days[0]).toMatchObject({ isToday: true, isPast: false, status: "free" });
  });
});

describe("predictability consumption", () => {
  it("turns the purchase day and the next five red for R$ 300", () => {
    const result = run([expense(1, 30000, "tenis")]);
    expect(statuses(result).slice(0, 7)).toEqual(["consumed", "consumed", "consumed", "consumed", "consumed", "consumed", "free"]);
    expect(result.days[5].allocations).toEqual([
      { transactionId: "tenis", description: "tenis", transactionDate: "2026-11-01", cents: 5000 },
    ]);
    expect(result.days[0]).toMatchObject({ spentCents: 30000, consumedCents: 5000, remainingCents: 0 });
    expect(result.summary.remainingCents).toBe(120000);
  });

  it("leaves the remainder on the seventh day for R$ 320", () => {
    const result = run([expense(1, 32000)]);
    expect(result.days[6]).toMatchObject({ status: "partial", remainingCents: 3000, consumedCents: 2000 });
    expect(result.summary.consumedDays).toBe(6);
  });

  it("keeps saved days green when the purchase comes later", () => {
    const result = run([expense(4, 30000)], "2026-11-04");
    expect(statuses(result).slice(0, 10)).toEqual([
      "free", "free", "free", "consumed", "consumed", "consumed", "consumed", "consumed", "consumed", "free",
    ]);
    expect(result.days[0].isPast).toBe(true);
    expect(result.summary.remainingCents).toBe(120000);
    expect(result.summary.freeDays).toBe(21);
  });

  it("borrows the earlier unspent days and then overflows the cycle", () => {
    const result = run([expense(1, 30000), expense(10, 150000, "big")]);
    expect(statuses(result).every((status) => status === "consumed")).toBe(true);
    expect(result.summary).toMatchObject({ remainingCents: 0, overflowCents: 30000, spentCents: 180000 });
    expect(result.summary.alerts).toEqual([{ code: "CYCLE_OVERFLOW", amountCents: 30000 }]);
    expect(result.days[6].allocations).toEqual([
      { transactionId: "big", description: "big", transactionDate: "2026-11-10", cents: 5000 },
    ]);
  });

  it("processes back-dated entries in date order", () => {
    const later = run([expense(10, 5000, "later"), expense(9, 10000, "earlier")]);
    expect(later.days[8].allocations[0].transactionId).toBe("earlier");
    expect(later.days[9].allocations.map((item) => item.transactionId)).toEqual(["earlier"]);
    expect(later.days[10].allocations.map((item) => item.transactionId)).toEqual(["later"]);
  });

  it("returns refunds to the overflow first and then to the latest consumed days", () => {
    const refunded = run([expense(1, 30000, "tenis"), expense(2, -10000, "refund")]);
    expect(refunded.days[4]).toMatchObject({ status: "free", remainingCents: 5000 });
    expect(refunded.days[5].allocations.at(-1)).toMatchObject({ transactionId: "refund", cents: -5000 });
    expect(refunded.summary.remainingCents).toBe(130000);

    const overflowRefund = run([expense(1, 160000), expense(3, -15000)]);
    expect(overflowRefund.summary.overflowCents).toBe(0);
    expect(overflowRefund.summary.remainingCents).toBe(5000);
  });

  it("ignores zero amounts and dates outside the cycle", () => {
    const allocation = allocateExpenses(["2026-11-01"], [5000], [
      { id: "zero", date: "2026-11-01", description: "zero", amountCents: 0 },
      { id: "outside", date: "2026-12-01", description: "outside", amountCents: 9000 },
    ]);
    expect(allocation).toEqual({ remainingCents: [5000], allocations: [[]], overflowCents: 0 });
  });
});

describe("predictability alerts", () => {
  it("flags fixed bills above income and missing income", () => {
    const tight = calculatePredictability({
      today: "2026-11-01",
      cycle,
      budgetItems: [budget[0], { ...budget[1], amountCents: 600000 }],
      expenses: [],
    });
    expect(tight.summary.alerts).toEqual([{ code: "FIXED_EXCEED_INCOME", amountCents: 100000 }]);
    expect(tight.days.every((day) => day.status === "consumed" && day.allowanceCents === 0)).toBe(true);

    const noIncome = calculatePredictability({
      today: "2027-01-10",
      cycle: resolveCycle(null, "2026-11-15"),
      budgetItems: [],
      expenses: [],
    });
    expect(noIncome.summary.alerts).toEqual([{ code: "NO_RECURRING_INCOME" }]);
    expect(noIncome.summary.availableTodayCents).toBeNull();
    expect(noIncome.summary.dailyAllowanceCents).toBe(0);
  });
});

describe("predictability calendar", () => {
  it("pads the cycle into Sunday-first weeks", () => {
    const result = calculatePredictability({ today: "2026-11-05", cycle: resolveCycle(5, "2026-11-05"), budgetItems: budget, expenses: [] });
    const weeks = buildPredictabilityCalendarWeeks(result.days);
    // 2026-11-05 is a Thursday: four empty cells before it.
    expect(weeks[0].cells.slice(0, 5).map((cell) => cell.day?.date ?? null)).toEqual([null, null, null, null, "2026-11-05"]);
    expect(weeks.every((week) => week.cells.length === 7)).toBe(true);
    expect(weeks.flatMap((week) => week.cells).filter((cell) => cell.day)).toHaveLength(30);
    expect(weeks[0].key).toBe("2026-11-05");
    expect(buildPredictabilityCalendarWeeks([])).toEqual([]);
  });
});
