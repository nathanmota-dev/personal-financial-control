import { describe, expect, it, vi, afterEach } from "vitest";
import {
  calculateNetBalance,
  currentTimestamp,
  normalizeCompetenceMonth,
  normalizeDate,
  parseMoneyToCents,
  serializeTimestamps,
} from "@/lib/server/finance";

afterEach(() => vi.useRealTimers());
describe("server finance values", () => {
  it.each([
    [12.345, 1235],
    ["1.234,56", 123456],
    [" 0,01 ", 1],
    [-1, -100],
    ["-1,23", -123],
  ])("converts %s to cents", (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });
  it.each([Infinity, NaN, "invalid", "1,2,3"])(
    "rejects invalid money %s",
    (input) =>
      expect(() => parseMoneyToCents(input)).toThrow("Invalid monetary value"),
  );
  it.each(["2026-01", "2026-12"])("accepts competence month %s", (month) =>
    expect(normalizeCompetenceMonth(month)).toBe(month),
  );
  it.each(["2026-00", "2026-13", "26-07", "2026-7"])(
    "rejects invalid month %s",
    (month) => expect(() => normalizeCompetenceMonth(month)).toThrow("YYYY-MM"),
  );
  it("normalizes date shape and rejects invalid formats", () => {
    expect(normalizeDate("2026-07-16")).toBe("2026-07-16");
    for (const date of ["16/07/2026", "2026-13-16", "2026-7-1"])
      expect(() => normalizeDate(date)).toThrow("YYYY-MM-DD");
  });
  it("calculates net balance with and without withdrawals", () => {
    const balances = {
      initialBalanceCents: 1000,
      postedIncomeCents: 500,
      postedExpenseCents: 200,
      postedInvestmentContributionCents: 100,
      outgoingTransferCents: 50,
      incomingTransferCents: 75,
    };
    expect(calculateNetBalance(balances)).toBe(1225);
    expect(
      calculateNetBalance({ ...balances, postedInvestmentWithdrawalCents: 25 }),
    ).toBe(1250);
  });
  it("serializes optional timestamps without altering financial data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));
    expect(currentTimestamp()).toEqual(new Date("2026-07-16T12:00:00Z"));
    expect(
      serializeTimestamps({
        amountCents: 123,
        createdAt: currentTimestamp(),
        updatedAt: currentTimestamp(),
      }),
    ).toEqual({
      amountCents: 123,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z",
    });
    expect(serializeTimestamps({})).toEqual({
      createdAt: undefined,
      updatedAt: undefined,
    });
  });
});
