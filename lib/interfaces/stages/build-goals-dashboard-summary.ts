
export interface BuildGoalsDashboardSummaryContext {
  visibleGoals: { id: string; name: string; createdAt: Date; updatedAt: Date; status: "active" | "paused" | "completed" | "archived"; notes: string | null; category: "other" | "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency"; targetAmountCents: number; targetDate: string | null; plannedMonthlyContributionCents: number; priority: number; color: string; }[];
  allocationTotals: Map<string, number>;
  archivedGoals: { id: string; name: string; createdAt: Date; updatedAt: Date; status: "active" | "paused" | "completed" | "archived"; notes: string | null; category: "other" | "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency"; targetAmountCents: number; targetDate: string | null; plannedMonthlyContributionCents: number; priority: number; color: string; }[];
  investmentProjection: import("@/lib/interfaces/investments").ReserveProjection | null;
  allocationRows: { id: string; type: "initial_allocation" | "manual_allocation" | "manual_release" | "contribution" | "correction"; createdAt: Date; updatedAt: Date; amountCents: number; notes: string | null; transactionId: string | null; goalId: string; occurredOn: string; }[];
}
