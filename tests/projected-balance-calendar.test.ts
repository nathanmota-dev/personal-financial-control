import { describe, expect, it } from "vitest";

import {
  buildProjectionCalendarDays,
  getProjectionMonthRange,
} from "@/lib/projected-balance-calendar";
import type { DailyProjection } from "@/lib/interfaces/projected-balance";

function buildDay(date: string): DailyProjection {
  return {
    date,
    startingBalanceCents: 100000,
    incomeCents: 0,
    expenseCents: 0,
    investmentCents: 0,
    investmentContributionCents: 0,
    investmentWithdrawalCents: 0,
    creditCardCents: 0,
    transferInCents: 0,
    transferOutCents: 0,
    netChangeCents: 0,
    projectedBalanceCents: 100000,
    availablePerDayCents: 10000,
    status: "safe",
    events: [],
  };
}

describe("projected balance calendar", () => {
  it("builds a complete month and leaves dates outside the range empty", () => {
    const daily = [buildDay("2026-07-02"), buildDay("2026-07-31")];
    const days = buildProjectionCalendarDays("2026-07", daily);

    expect(days).toHaveLength(31);
    expect(days[0]?.day).toBeNull();
    expect(days[1]?.day?.date).toBe("2026-07-02");
    expect(days[30]?.day?.date).toBe("2026-07-31");
  });

  it("derives the visible month bounds from the projection", () => {
    expect(getProjectionMonthRange([buildDay("2026-07-02"), buildDay("2026-09-04")])).toEqual({
      firstMonth: "2026-07",
      lastMonth: "2026-09",
    });
  });
});
