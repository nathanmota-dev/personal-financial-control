export function projectCompoundBalance({
  currentBalanceCents,
  monthlyContributionCents,
  expectedMonthlyRateBps,
  months,
}: {
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  months: number;
}) {
  const rate = expectedMonthlyRateBps / 10_000;
  let balance = currentBalanceCents / 100;

  for (let month = 0; month < months; month += 1) {
    balance = balance * (1 + rate) + monthlyContributionCents / 100;
  }

  return Math.round(balance * 100);
}
