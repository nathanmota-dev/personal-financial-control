import { describe, expect, it } from "vitest";

import { effectiveDayInMonth, isValidDayOfMonth, listDayOfMonthAdjustments } from "@/lib/day-of-month";

describe("day of month", () => {
  it("accepts only whole days from 1 to 31", () => {
    expect([1, 15, 31].every(isValidDayOfMonth)).toBe(true);
    expect([0, 32, 1.5, Number.NaN].some(isValidDayOfMonth)).toBe(false);
  });

  it("moves a day the month does not have to its last day", () => {
    expect(effectiveDayInMonth("2026-11", 31)).toBe(30);
    expect(effectiveDayInMonth("2026-12", 31)).toBe(31);
    expect(effectiveDayInMonth("2027-02", 30)).toBe(28);
    expect(effectiveDayInMonth("2028-02", 30)).toBe(29);
    expect(effectiveDayInMonth("2027-02", 10)).toBe(10);
  });

  it("lists only the months whose date was adjusted", () => {
    expect(listDayOfMonthAdjustments("2026-11", 31, 4)).toEqual([
      { month: "2026-11", date: "2026-11-30" },
      { month: "2027-02", date: "2027-02-28" },
    ]);
    expect(listDayOfMonthAdjustments("2027-01", 29)).toEqual([{ month: "2027-02", date: "2027-02-28" }]);
    expect(listDayOfMonthAdjustments("2026-11", 28)).toEqual([]);
  });
});
