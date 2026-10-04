import type { BuildGoalsDashboardSummaryContext } from "@/lib/interfaces/stages/build-goals-dashboard-summary";
import {
serializeTimestamps
} from "@/lib/server/finance";
import { buildGoalCard } from "@/lib/server/goals/calculations";
import { DEFAULT_GOAL_COLOR } from "@/lib/server/goals/validation";

export function buildGoalsDashboardSummary({ visibleGoals, allocationTotals, archivedGoals, investmentProjection, allocationRows }: BuildGoalsDashboardSummaryContext) {
const visibleGoalIds = new Set(visibleGoals.map((goal) => goal.id));

const goals = visibleGoals.map((goal) =>
    buildGoalCard(goal, allocationTotals.get(goal.id) ?? 0)
  );

const archived = archivedGoals.map((goal) =>
    buildGoalCard(goal, allocationTotals.get(goal.id) ?? 0)
  );

const investmentBalanceCents = investmentProjection?.currentBalanceCents ?? 0;

const totalAllocatedCents = goals.reduce(
    (total, goal) => total + goal.allocatedCents,
    0
  );

const freeReserveCents = investmentBalanceCents - totalAllocatedCents;

const remainingToGoalsCents = goals.reduce(
    (total, goal) => total + goal.remainingCents,
    0
  );

const monthlyRequiredCents = goals.reduce(
    (total, goal) => total + goal.monthlyRequiredCents,
    0
  );

const monthlyPlannedContributionCents = goals.reduce(
    (total, goal) => total + goal.plannedMonthlyContributionCents,
    0
  );

const allocationBreakdown = [
    ...goals
      .filter((goal) => goal.allocatedCents > 0)
      .map((goal) => ({
        id: goal.id,
        name: goal.name,
        amountCents: goal.allocatedCents,
        color: goal.color,
      })),
    ...(freeReserveCents > 0
      ? [
          {
            id: "free_reserve",
            name: "Reserva livre",
            amountCents: freeReserveCents,
            color: "#14b8a6",
          },
        ]
      : []),
  ];

const recentAllocations = allocationRows
    .filter((allocation) => visibleGoalIds.has(allocation.goalId))
    .slice(0, 8)
    .map((allocation) => {
      const goal = visibleGoals.find((item) => item.id === allocation.goalId);
return {
        ...serializeTimestamps(allocation),
        goalName: goal?.name ?? "Meta",
        goalColor: goal?.color ?? DEFAULT_GOAL_COLOR,
      };
    });
return { investmentBalanceCents, totalAllocatedCents, freeReserveCents, remainingToGoalsCents, monthlyRequiredCents, monthlyPlannedContributionCents, goals, archived, allocationBreakdown, visibleGoalIds, recentAllocations };
}
