import type { CompoundInterestSimulationInput } from "@/lib/interfaces/compound-interest";
import type { ProjectionCalculationInput } from "@/lib/interfaces/projected-balance";

export const benchmarkOptions = {
  time: 1000,
  iterations: 100,
  warmupTime: 500,
  warmupIterations: 20,
};

export function compoundInterestInput(years: number): CompoundInterestSimulationInput {
  return {
    initialAmountCents: 1000000,
    monthlyContributionCents: 50000,
    interestRate: 8,
    interestRatePeriod: "annual",
    investmentPeriod: years,
    investmentPeriodUnit: "years",
  };
}

export function projectionInput(eventCount: number, clustered: boolean): ProjectionCalculationInput {
  return {
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    initialBalanceCents: 1000000,
    minimumReserveCents: 200000,
    events: Array.from({ length: eventCount }, (_, index) => {
      const day = clustered ? index % 3 : (index * 37) % 90;
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const income = index % 5 === 0;
      const amountCents = income ? 100000 : 5000 + (index % 100) * 100;

      return {
        id: `event-${index}`,
        source: income ? "transaction" : "recurring",
        type: income ? "income" : "expense",
        description: `Scheduled event ${index % 20}`,
        amountCents,
        netImpactCents: income ? amountCents : -amountCents,
        date,
      };
    }),
  };
}
