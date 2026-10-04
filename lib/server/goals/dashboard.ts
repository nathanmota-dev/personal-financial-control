import type { AppDb } from "@/lib/db";
import {
allocationTypes,
goalCategories,
goalStatuses
} from "@/lib/db/schema";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import {
serializeTimestamps
} from "@/lib/server/finance";
import { getInvestmentProjection } from "@/lib/server/investments";
import { getFinanceToday } from "@/lib/server/runtime";
import { buildGoalsDashboardSummary } from "@/lib/server/stages/build-goals-dashboard-summary";
import { indexToMonth,monthToIndex } from "@/lib/utils/finance-month";
import { buildAllocationTotals,sortGoals } from "./calculations";
import { getGoalAllocations,getGoalDetailsInDb,getGoalRowById } from "./persistence";
import { AllocationRow,resolveDb } from "./validation";

export function buildMonthlyEvolution(
  allocations: AllocationRow[],
  visibleGoalIds: Set<string>
) {
  const relevantAllocations = allocations.filter((allocation) =>
    visibleGoalIds.has(allocation.goalId)
  );
  const totalsByMonth = new Map<
    string,
    {
      monthlyAllocatedCents: number;
      monthlyContributionCents: number;
      monthlyReleasedCents: number;
      netMovementCents: number;
    }
  >();

  for (const allocation of relevantAllocations) {
    const month = allocation.occurredOn.slice(0, 7);
    const current = totalsByMonth.get(month) ?? {
      monthlyAllocatedCents: 0,
      monthlyContributionCents: 0,
      monthlyReleasedCents: 0,
      netMovementCents: 0,
    };

    if (allocation.amountCents > 0) {
      current.monthlyAllocatedCents += allocation.amountCents;
    }

    if (allocation.type === "contribution") {
      current.monthlyContributionCents += allocation.amountCents;
    }

    if (allocation.amountCents < 0) {
      current.monthlyReleasedCents += Math.abs(allocation.amountCents);
    }

    current.netMovementCents += allocation.amountCents;
    totalsByMonth.set(month, current);
  }

  if (!totalsByMonth.size) {
    return [];
  }

  const months = [...totalsByMonth.keys()].sort();
  const firstMonthIndex = monthToIndex(months[0]);
  const currentMonth = getFinanceToday().slice(0, 7);
  const lastMonthIndex = Math.max(
    monthToIndex(months[months.length - 1]),
    monthToIndex(currentMonth)
  );
  let cumulativeAllocatedCents = 0;
  const points = [];

  for (let monthIndex = firstMonthIndex; monthIndex <= lastMonthIndex; monthIndex += 1) {
    const month = indexToMonth(monthIndex);
    const monthly = totalsByMonth.get(month) ?? {
      monthlyAllocatedCents: 0,
      monthlyContributionCents: 0,
      monthlyReleasedCents: 0,
      netMovementCents: 0,
    };

    cumulativeAllocatedCents += monthly.netMovementCents;
    points.push({
      month,
      ...monthly,
      cumulativeAllocatedCents,
    });
  }

  return points;
}

export async function getGoalsDashboard(database?: AppDb) {
  const db = await resolveDb(database);
  const [investmentProjection, goalRows, allocationRows, accountRows, categoryRows] =
    await Promise.all([
      getInvestmentProjection(db),
      db.query.financialGoals.findMany(),
      db.query.financialGoalAllocations.findMany({
        orderBy: (table, { desc }) => [desc(table.occurredOn), desc(table.createdAt)],
      }),
      listAccounts(undefined, db),
      listCategories(undefined, db),
    ]);

  const allocationTotals = buildAllocationTotals(allocationRows);
  const visibleGoals = goalRows
    .filter((goal) => goal.status !== "archived")
    .sort(sortGoals);
  const archivedGoals = goalRows
    .filter((goal) => goal.status === "archived")
    .sort(sortGoals);
  const { investmentBalanceCents, totalAllocatedCents, freeReserveCents, remainingToGoalsCents, monthlyRequiredCents, monthlyPlannedContributionCents, goals, archived, allocationBreakdown, visibleGoalIds, recentAllocations } = buildGoalsDashboardSummary({ visibleGoals, allocationTotals, archivedGoals, investmentProjection, allocationRows });

  return {
    investmentProjection,
    summary: {
      investmentBalanceCents,
      totalAllocatedCents,
      freeReserveCents,
      remainingToGoalsCents,
      monthlyRequiredCents,
      monthlyPlannedContributionCents,
      goalCount: goals.length,
      archivedGoalCount: archived.length,
    },
    goals,
    archivedGoals: archived,
    charts: {
      allocationBreakdown,
      monthlyEvolution: buildMonthlyEvolution(allocationRows, visibleGoalIds),
    },
    recentAllocations,
    options: {
      sourceAccounts: accountRows
        .filter(
          (account) =>
            account.type === "checking" ||
            account.type === "savings" ||
            account.type === "cash"
        )
        .map((account) => ({ id: account.id, name: account.name })),
      investmentCategories: categoryRows
        .filter((category) => category.group === "investment")
        .map((category) => ({ id: category.id, name: category.name })),
      goalCategories: [...goalCategories],
      goalStatuses: [...goalStatuses],
      allocationTypes: [...allocationTypes],
    },
  };
}

export async function getGoalDetails(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  return getGoalDetailsInDb(id, db);
}

export async function listGoalAllocations(goalId: string, database?: AppDb) {
  const db = await resolveDb(database);
  await getGoalRowById(goalId, db);
  const allocations = await getGoalAllocations(goalId, db);

  return allocations.map(serializeTimestamps);
}
