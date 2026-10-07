import { describe, expect, it } from "vitest";
import { buildDailyExpenseMap } from "@/lib/daily-expenses";
import type { DailyExpenseEntry } from "@/lib/interfaces/daily-expenses";

function entry(overrides: Partial<DailyExpenseEntry> = {}): DailyExpenseEntry {
  return {
    id: "expense-1",
    date: "2026-07-05",
    description: "Mercado",
    amountCents: 20000,
    direction: "expense",
    source: "transaction",
    category: "Alimentação",
    account: "Principal",
    sourceHref: "/transactions?month=2026-07",
    ...overrides,
  };
}

describe("daily expense map", () => {
  it.each([
    ["2026-02", 28],
    ["2024-02", 29],
    ["2026-04", 30],
    ["2026-01", 31],
    ["2026-12", 31],
  ])("builds every day of %s without local-time shifts", (period, count) => {
    const map = buildDailyExpenseMap(period, [entry({ date: `${period}-${String(count).padStart(2, "0")}` })]);
    expect(map.days).toHaveLength(count);
    expect(map.days[0].date).toBe(`${period}-01`);
    expect(map.days.at(-1)?.date).toBe(`${period}-${count}`);
    expect(map.days.at(-1)?.entries).toHaveLength(1);
    expect(map.calendar.length % 7).toBe(0);
    expect(map.calendar.filter(Boolean)).toHaveLength(count);
  });

  it("separates credits from positive-spend intensity and reconciles all day totals", () => {
    const map = buildDailyExpenseMap("2026-07", [
      entry({ id: "spend", amountCents: 20000 }),
      entry({ id: "credit", amountCents: 5000, direction: "credit" }),
      entry({ id: "smaller", date: "2026-07-08", amountCents: 10000 }),
      entry({ id: "credit-only", date: "2026-07-09", amountCents: 1200, direction: "credit" }),
      entry({ id: "other-month", date: "2026-08-01", amountCents: 999999 }),
      entry({ id: "invalid-day", date: "2026-07-32", amountCents: 888888 }),
      entry({ id: "zero", amountCents: 0 }),
    ]);

    expect(map.days.find((day) => day.date === "2026-07-05")).toMatchObject({ expenseCents: 20000, creditCents: 5000, netCents: 15000, intensity: 4 });
    expect(map.days.find((day) => day.date === "2026-07-08")?.intensity).toBe(2);
    expect(map.days.find((day) => day.date === "2026-07-09")).toMatchObject({ expenseCents: 0, creditCents: 1200, netCents: -1200, intensity: 0 });
    expect(map).toMatchObject({ expenseCents: 30000, creditCents: 6200, netCents: 23800 });
    expect(map.expenseCents).toBe(map.days.reduce((sum, day) => sum + day.expenseCents, 0));
    expect(map.creditCents).toBe(map.days.reduce((sum, day) => sum + day.creditCents, 0));
    expect(map.netCents).toBe(map.days.reduce((sum, day) => sum + day.netCents, 0));
    expect(map.entries.map(({ id }) => id)).toEqual(["credit", "spend", "smaller", "credit-only"]);
  });

  it("uses exact month boundaries across a year change and rejects malformed periods", () => {
    const december = buildDailyExpenseMap("2026-12", [entry({ date: "2027-01-01" }), entry({ date: "2026-12-31" })]);
    const january = buildDailyExpenseMap("2027-01", [entry({ date: "2026-12-31" }), entry({ date: "2027-01-01" })]);
    expect(december.entries.map(({ date }) => date)).toEqual(["2026-12-31"]);
    expect(january.entries.map(({ date }) => date)).toEqual(["2027-01-01"]);
    expect(() => buildDailyExpenseMap("2026-13", [])).toThrow("Mês inválido");
  });
});
