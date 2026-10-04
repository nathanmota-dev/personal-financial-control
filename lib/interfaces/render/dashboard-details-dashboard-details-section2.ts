
export interface DashboardDetailsSection2Props {
  projection: { currentBalanceCents: number; asOfDate: string; estimatedInterestCents: number; contributionCents: number; withdrawalCents: number; netMovementCents: number; projection: { [k: string]: number; }; plannedMovements: import("@/lib/investment-projection").InvestmentMovement[]; nextContributionDate: string | undefined; createdAt: Date & string; id: string; updatedAt: Date & string; checkpointBalanceCents: number; expectedMonthlyRateBps: number; checkpointDate: string; } | null;
}
