import type {
  CompoundInterestSimulation,
  CompoundInterestSimulationInput,
} from "@/lib/interfaces/compound-interest";

export function formatPeriodLabel(month: number) {
  if (month === 0) return "Início";
  if (month < 12) return `${month}m`;
  if (month % 12 === 0) return `${month / 12}a`;
  return `${Math.floor(month / 12)}a ${month % 12}m`;
}

export function calculateCompoundInterest(
  input: CompoundInterestSimulationInput
): CompoundInterestSimulation {
  const months =
    input.investmentPeriodUnit === "years"
      ? input.investmentPeriod * 12
      : input.investmentPeriod;
  const periodicRate = input.interestRate / 100;
  const monthlyRate =
    input.interestRatePeriod === "annual"
      ? Math.pow(1 + periodicRate, 1 / 12) - 1
      : periodicRate;
  const points = [];
  let balanceCents = input.initialAmountCents;

  points.push({
    month: 0,
    label: "Início",
    balanceCents,
    investedCents: input.initialAmountCents,
    interestCents: 0,
  });

  for (let month = 1; month <= months; month += 1) {
    balanceCents = Math.round(
      balanceCents * (1 + monthlyRate) + input.monthlyContributionCents
    );
    const investedCents =
      input.initialAmountCents + input.monthlyContributionCents * month;

    points.push({
      month,
      label: formatPeriodLabel(month),
      balanceCents,
      investedCents,
      interestCents: balanceCents - investedCents,
    });
  }

  const finalPoint = points.at(-1)!;

  return {
    input,
    totalBalanceCents: finalPoint.balanceCents,
    totalInvestedCents: finalPoint.investedCents,
    totalInterestCents: finalPoint.interestCents,
    monthlyRate,
    points,
  };
}
