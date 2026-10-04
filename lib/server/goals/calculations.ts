import {
serializeTimestamps
} from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { AllocationRow,GoalRow,normalizeStoredTargetMonth } from "./validation";

export function getRemainingMonths(targetDate: string | null) {
  if (!targetDate) {
    return null;
  }

  const [targetYear, targetMonth] = targetDate.split("-").map(Number);
  const now = new Date(`${getFinanceToday()}T00:00:00.000Z`);
  const currentIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const targetIndex = targetYear * 12 + targetMonth - 1;

  return Math.max(targetIndex - currentIndex + 1, 1);
}

export function getRequiredMonthlyContributionCents({
  remainingCents,
  targetDate,
  plannedMonthlyContributionCents,
}: {
  remainingCents: number;
  targetDate: string | null;
  plannedMonthlyContributionCents: number;
}) {
  if (remainingCents <= 0) {
    return 0;
  }

  const remainingMonths = getRemainingMonths(targetDate);

  if (!remainingMonths) {
    return plannedMonthlyContributionCents;
  }

  return Math.ceil(remainingCents / remainingMonths);
}

export function buildAllocationTotals(allocations: AllocationRow[]) {
  const totals = new Map<string, number>();

  for (const allocation of allocations) {
    totals.set(
      allocation.goalId,
      (totals.get(allocation.goalId) ?? 0) + allocation.amountCents
    );
  }

  return totals;
}

export function sortGoals(left: GoalRow, right: GoalRow) {
  return (
    left.priority - right.priority ||
    (left.targetDate ?? "9999-12-31").localeCompare(
      right.targetDate ?? "9999-12-31"
    ) ||
    left.name.localeCompare(right.name)
  );
}

export function buildGoalCard(goal: GoalRow, allocatedCents: number) {
  const remainingCents = Math.max(goal.targetAmountCents - allocatedCents, 0);
  const overfundedCents = Math.max(allocatedCents - goal.targetAmountCents, 0);
  const progressPercentage =
    goal.targetAmountCents > 0
      ? Math.min(Math.max((allocatedCents / goal.targetAmountCents) * 100, 0), 100)
      : 0;
  const monthlyRequiredCents = getRequiredMonthlyContributionCents({
    remainingCents,
    targetDate: goal.targetDate,
    plannedMonthlyContributionCents: goal.plannedMonthlyContributionCents,
  });

  return {
    ...serializeTimestamps(goal),
    targetDate: normalizeStoredTargetMonth(goal.targetDate),
    allocatedCents,
    remainingCents,
    overfundedCents,
    progressPercentage,
    monthlyRequiredCents,
  };
}
