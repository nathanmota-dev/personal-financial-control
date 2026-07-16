import { describe, expect, it } from "vitest";

import {
  buildInvestmentGrowthSeries,
  calculateInvestmentBalance,
} from "@/lib/investment-projection";

describe("investment projection", () => {
  it("accrues the estimated balance across the elapsed calendar days", () => {
    const expectedBalance = Math.round(2966000 * Math.pow(1.01, 8 / 31));

    expect(
      calculateInvestmentBalance({
        checkpointBalanceCents: 2966000,
        checkpointDate: "2026-07-08",
        expectedMonthlyRateBps: 100,
        asOfDate: "2026-07-16",
      }).balanceCents
    ).toBe(expectedBalance);
  });

  it("accrues the balance before and after each movement", () => {
    const balanceBeforeContribution = 100000 * Math.pow(1.01, 14 / 30);
    const expectedBalance = Math.round(
      (balanceBeforeContribution + 10000) * Math.pow(1.01, 16 / 30)
    );

    expect(
      calculateInvestmentBalance({
        checkpointBalanceCents: 100000,
        checkpointDate: "2026-06-01",
        expectedMonthlyRateBps: 100,
        asOfDate: "2026-07-01",
        movements: [
          {
            id: "contribution",
            date: "2026-06-15",
            amountCents: 10000,
            direction: "contribution",
          },
        ],
      })
    ).toMatchObject({
      balanceCents: expectedBalance,
      contributionCents: 10000,
      withdrawalCents: 0,
      netMovementCents: 10000,
    });
  });

  it("subtracts withdrawals from the estimated balance", () => {
    const expectedBalance = Math.round(
      (100000 * Math.pow(1.01, 10 / 31) - 25000) * Math.pow(1.01, 8 / 31)
    );

    expect(
      calculateInvestmentBalance({
        checkpointBalanceCents: 100000,
        checkpointDate: "2026-07-01",
        expectedMonthlyRateBps: 100,
        asOfDate: "2026-07-19",
        movements: [
          {
            id: "withdrawal",
            date: "2026-07-11",
            amountCents: 25000,
            direction: "withdrawal",
          },
        ],
      })
    ).toMatchObject({
      balanceCents: expectedBalance,
      withdrawalCents: 25000,
      netMovementCents: -25000,
    });
  });

  it("includes planned movements in future growth points", () => {
    const points = buildInvestmentGrowthSeries({
      currentBalanceCents: 100000,
      expectedMonthlyRateBps: 100,
      referenceDate: "2026-07-16",
      movements: [
        {
          id: "future-contribution",
          date: "2026-07-20",
          amountCents: 10000,
          direction: "contribution",
        },
      ],
      months: 2,
    });

    expect(points[0]).toMatchObject({
      competenceMonth: "2026-07",
      principalCents: 110000,
    });
    expect(points[1]).toMatchObject({
      competenceMonth: "2026-08",
      principalCents: 110000,
    });
    expect(points[1]?.balanceCents).toBeGreaterThan(points[0]?.balanceCents ?? 0);
  });
});
