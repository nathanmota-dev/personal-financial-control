import { describe, expect, it } from "vitest";

import { calculateRealizedYield, daysBetween, deductReserveFromClasses, splitBankReserve } from "@/lib/bank-reserve";
import { bankReserveShortcuts, formatReserveInput, parseReserveInput } from "@/lib/utils/components/bank-reserve";

const snapshot = (holdingId: string, snapshotDate: string, currentValueCents: number) => ({ holdingId, snapshotDate, currentValueCents });

describe("splitBankReserve", () => {
  it("keeps the reserve and the portfolio adding up to the total", () => {
    expect(splitBankReserve(50_000, 25_000)).toEqual({ reserveCents: 25_000, portfolioCents: 25_000, exceedsTotal: false });
    expect(splitBankReserve(50_000, null)).toEqual({ reserveCents: 0, portfolioCents: 50_000, exceedsTotal: false });
    expect(splitBankReserve(50_000, 50_000)).toEqual({ reserveCents: 50_000, portfolioCents: 0, exceedsTotal: false });
  });

  it("caps the reserve at the total and flags it", () => {
    expect(splitBankReserve(30_000, 40_000)).toEqual({ reserveCents: 30_000, portfolioCents: 0, exceedsTotal: true });
    expect(splitBankReserve(-10, 5)).toEqual({ reserveCents: 0, portfolioCents: 0, exceedsTotal: true });
  });
});

describe("calculateRealizedYield", () => {
  it("normalizes the gain between the oldest and newest snapshot to a monthly rate", () => {
    const result = calculateRealizedYield({ holdings: [{ id: "a" }], asOfDate: "2026-07-31", snapshots: [snapshot("a", "2026-07-01", 100_000), snapshot("a", "2026-07-16", 100_500), snapshot("a", "2026-07-31", 101_000)] });
    expect(result).toEqual({ monthlyRateBps: 100, periodDays: 30 });
  });

  it("ignores snapshots outside the window, redemptions and positions with a single snapshot", () => {
    const result = calculateRealizedYield({
      holdings: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      asOfDate: "2026-07-31",
      snapshots: [
        snapshot("a", "2026-05-01", 10_000), snapshot("a", "2026-07-11", 200_000), snapshot("a", "2026-07-21", 202_000),
        snapshot("b", "2026-07-11", 50_000), snapshot("b", "2026-07-21", 10_000),
        snapshot("c", "2026-07-21", 70_000),
        snapshot("d", "2026-07-11", 0), snapshot("d", "2026-07-21", 5_000),
      ],
    });
    expect(result).toEqual({ monthlyRateBps: 300, periodDays: 10 });
  });

  it("returns null without enough history", () => {
    expect(calculateRealizedYield({ holdings: [{ id: "a" }], asOfDate: "2026-07-31", snapshots: [] })).toBeNull();
  });
});

describe("deductReserveFromClasses", () => {
  it("takes the reserve from fixed income first and drops emptied classes", () => {
    const items = [{ assetClass: "equities" as const, amountCents: 20_000 }, { assetClass: "fixed_income" as const, amountCents: 30_000 }, { assetClass: "cash" as const, amountCents: 5_000 }];
    expect(deductReserveFromClasses(items, 32_000)).toEqual([{ assetClass: "equities", amountCents: 20_000 }, { assetClass: "cash", amountCents: 3_000 }]);
    expect(deductReserveFromClasses(items, 0)).toEqual(items);
  });
});

describe("bank reserve helpers", () => {
  it("counts days and offers the common splits", () => {
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3);
    expect(bankReserveShortcuts(10_001)).toEqual([{ label: "Nada", cents: 0 }, { label: "Metade", cents: 5_000 }, { label: "Tudo", cents: 10_001 }]);
  });

  it("parses the typed amount and rejects what is not money", () => {
    expect(parseReserveInput("")).toBe(0);
    expect(parseReserveInput("1.234,56")).toBe(123_456);
    expect(parseReserveInput("abc")).toBeNull();
    expect(parseReserveInput("-5")).toBeNull();
    expect(formatReserveInput(3_885_412)).toBe("38.854,12");
    expect(formatReserveInput(0)).toBe("0,00");
  });
});
