import { describe, expect, it } from "vitest";

import {
  buildInvestmentGrowthSeries,
  projectCompoundBalance,
} from "@/lib/investment-projection";

describe("investment projection", () => {
  it("applies the full monthly rate when the reference is the first day", () => {
    expect(
      projectCompoundBalance({
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-06-01",
        months: 1,
      })
    ).toBe(101000);
  });

  it("converts the monthly rate into an effective rate for the remaining days", () => {
    const expectedBalance = Math.round(100000 * Math.pow(1.01, 16 / 30));

    expect(
      projectCompoundBalance({
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-06-15",
        months: 1,
      })
    ).toBe(expectedBalance);
  });

  it("applies one effective daily rate on the last day of the month", () => {
    const expectedBalance = Math.round(100000 * Math.pow(1.01, 1 / 30));

    expect(
      projectCompoundBalance({
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-06-30",
        months: 1,
      })
    ).toBe(expectedBalance);
  });

  it("starts planned contributions in the month after the partial period", () => {
    const points = buildInvestmentGrowthSeries({
      currentBalanceCents: 100000,
      monthlyContributionCents: 10000,
      expectedMonthlyRateBps: 100,
      referenceDate: "2026-06-15",
      months: 2,
    });

    expect(points[0]).toMatchObject({
      competenceMonth: "2026-06",
      principalCents: 100000,
    });
    expect(points[1]).toMatchObject({
      competenceMonth: "2026-07",
      principalCents: 110000,
    });
  });
});
