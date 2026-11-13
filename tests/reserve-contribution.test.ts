import { describe, expect, it } from "vitest";

import { buildMonthlyContributions, isReserveCategory, recurringMonthlyCents } from "@/lib/reserve-contribution";

describe("reserve contribution helpers", () => {
  it("recognizes the reserve category by its catalog name or aliases, only among investments", () => {
    expect(isReserveCategory({ name: "Reserva de Emergência", group: "investment" })).toBe(true);
    expect(isReserveCategory({ name: "reserva", group: "investment" })).toBe(true);
    expect(isReserveCategory({ name: "Reserva", group: "variable_expense" })).toBe(false);
    expect(isReserveCategory({ name: "Ações", group: "investment" })).toBe(false);
  });

  it("plans one contribution a month from the next month, clamping the day to short months", () => {
    expect(buildMonthlyContributions("2026-01-31", 5000, 2)).toEqual([
      { id: "reserve-plan:2026-02", date: "2026-02-28", amountCents: 5000, direction: "contribution", source: "recurring" },
      { id: "reserve-plan:2026-03", date: "2026-03-31", amountCents: 5000, direction: "contribution", source: "recurring" },
    ]);
    expect(buildMonthlyContributions("2026-01-31", 0, 2)).toEqual([]);
  });

  it("sums the recurring entries active in the current month", () => {
    const templates = [
      { amountCents: 100, startMonth: "2026-01", endMonth: null },
      { amountCents: 200, startMonth: "2026-08", endMonth: null },
      { amountCents: 300, startMonth: "2026-01", endMonth: "2026-06" },
      { amountCents: 400, startMonth: "2026-07", endMonth: "2026-07" },
    ];
    expect(recurringMonthlyCents(templates, "2026-07-16")).toBe(500);
  });
});
