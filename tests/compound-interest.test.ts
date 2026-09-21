import { describe, expect, it } from "vitest";

import { calculateCompoundInterest } from "@/lib/compound-interest";

describe("compound interest calculator", () => {
  it("converts an annual effective rate and applies monthly contributions", () => {
    const simulation = calculateCompoundInterest({
      initialAmountCents: 5000000,
      monthlyContributionCents: 110000,
      interestRate: 12,
      interestRatePeriod: "annual",
      investmentPeriod: 1,
      investmentPeriodUnit: "years",
    });

    expect(simulation.points).toHaveLength(13);
    expect(simulation.totalInvestedCents).toBe(6320000);
    expect(simulation.totalBalanceCents).toBeGreaterThan(simulation.totalInvestedCents);
    expect(simulation.totalInterestCents).toBe(
      simulation.totalBalanceCents - simulation.totalInvestedCents
    );
    expect(simulation.monthlyRate).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1);
  });

  it("supports a zero rate without adding artificial interest", () => {
    const simulation = calculateCompoundInterest({
      initialAmountCents: 100000,
      monthlyContributionCents: 10000,
      interestRate: 0,
      interestRatePeriod: "monthly",
      investmentPeriod: 3,
      investmentPeriodUnit: "months",
    });

    expect(simulation.totalBalanceCents).toBe(130000);
    expect(simulation.totalInvestedCents).toBe(130000);
    expect(simulation.totalInterestCents).toBe(0);
  });
});
