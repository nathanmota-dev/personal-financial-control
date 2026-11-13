import { describe, expect, it } from "vitest";

import type { RecurringTemplateRow } from "@/lib/interfaces/recurring";
import { buildRecurringAgenda, summarizeRecurringMonth } from "@/lib/recurring-summary";

const baseTemplate: RecurringTemplateRow = {
  id: "00000000-0000-0000-0000-000000000001",
  accountId: "00000000-0000-0000-0000-000000000002",
  categoryId: "00000000-0000-0000-0000-000000000003",
  type: "expense",
  status: "active",
  amountCents: 15000,
  dayOfMonth: 12,
  startMonth: "2026-05",
  endMonth: null,
  lastGeneratedMonth: null,
  description: "Internet",
  account: { id: "00000000-0000-0000-0000-000000000002", name: "Principal" },
  category: { id: "00000000-0000-0000-0000-000000000003", name: "Casa", group: "fixed_expense" },
};

function template(overrides: Partial<RecurringTemplateRow> = {}) {
  return { ...baseTemplate, ...overrides };
}

describe("recurring month summary", () => {
  it("totals the active rules scheduled for the month by type", () => {
    const summary = summarizeRecurringMonth([
      template({ id: "a", amountCents: 10000, lastGeneratedMonth: "2026-07" }),
      template({ id: "b", amountCents: 5000 }),
      template({ id: "c", type: "income", amountCents: 50000 }),
      template({ id: "d", type: "investment_contribution", amountCents: 20000 }),
      template({ id: "e", status: "paused", amountCents: 99900 }),
      template({ id: "f", startMonth: "2026-08", amountCents: 77700 }),
      template({ id: "g", endMonth: "2026-06", amountCents: 88800 }),
    ], "2026-07");

    expect(summary).toEqual({
      expenseCents: 15000,
      incomeCents: 50000,
      investmentCents: 20000,
      generatedExpenseCents: 10000,
      pendingExpenseCents: 5000,
      freeCents: 15000,
      scheduledCount: 4,
      generatedCount: 1,
      pausedCount: 1,
    });
  });

  it("returns zeroed totals without rules", () => {
    expect(summarizeRecurringMonth([], "2026-07")).toMatchObject({ expenseCents: 0, freeCents: 0, scheduledCount: 0, pausedCount: 0 });
  });
});

describe("recurring agenda", () => {
  it("lists scheduled rules by day and then by the largest amount", () => {
    const agenda = buildRecurringAgenda([
      template({ id: "late", dayOfMonth: 20 }),
      template({ id: "small", dayOfMonth: 5, amountCents: 1000 }),
      template({ id: "big", dayOfMonth: 5, amountCents: 9000 }),
      template({ id: "paused", dayOfMonth: 1, status: "paused" }),
    ], "2026-07");

    expect(agenda.map((item) => item.id)).toEqual(["big", "small", "late"]);
  });
});
