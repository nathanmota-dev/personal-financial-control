import { describe, expect, it } from "vitest";

import type { RecurringTemplateRow } from "@/lib/interfaces/recurring";
import {
  buildRecurringCalendarEvents,
  isRecurringTemplateVisibleInMonth,
} from "@/lib/recurring-calendar";

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
  lastGeneratedMonth: "2026-07",
  description: "Internet",
  account: { id: "00000000-0000-0000-0000-000000000002", name: "Principal" },
  category: { id: "00000000-0000-0000-0000-000000000003", name: "Casa", group: "fixed_expense" },
};

function template(overrides: Partial<RecurringTemplateRow> = {}) {
  return { ...baseTemplate, ...overrides };
}

describe("recurring calendar", () => {
  it("projects active templates into their configured day and marks generated entries", () => {
    const [event] = buildRecurringCalendarEvents("2026-07", [template()]);

    expect(event?.date.getFullYear()).toBe(2026);
    expect(event?.date.getMonth()).toBe(6);
    expect(event?.date.getDate()).toBe(12);
    expect(event?.description).toBe("Internet");
    expect(event?.isGenerated).toBe(true);
  });

  it("filters templates by status and active interval", () => {
    const events = buildRecurringCalendarEvents("2026-07", [
      template({ id: "00000000-0000-0000-0000-000000000004" }),
      template({
        id: "00000000-0000-0000-0000-000000000005",
        status: "paused",
      }),
      template({
        id: "00000000-0000-0000-0000-000000000006",
        startMonth: "2026-08",
      }),
      template({
        id: "00000000-0000-0000-0000-000000000007",
        endMonth: "2026-06",
      }),
    ]);

    expect(events.map((event) => event.id)).toEqual([
      "00000000-0000-0000-0000-000000000004",
    ]);
  });

  it("keeps an ended template visible through its end month only", () => {
    const endedTemplate = template({ endMonth: "2026-07" });

    expect(isRecurringTemplateVisibleInMonth(endedTemplate, "2026-07")).toBe(true);
    expect(isRecurringTemplateVisibleInMonth(endedTemplate, "2026-08")).toBe(false);
  });
});
