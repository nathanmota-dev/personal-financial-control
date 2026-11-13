import type { InvestmentContributionHistory, InvestmentMovementMonth } from "@/lib/interfaces/investments";

/** Months of the chart that had any movement, newest first, so the list reads from today backwards. */
export function monthsWithMovements(history: InvestmentContributionHistory): InvestmentMovementMonth[] {
  return history.points.filter((point) => point.monthlyContributionCents > 0 || point.monthlyWithdrawalCents > 0).reverse();
}
