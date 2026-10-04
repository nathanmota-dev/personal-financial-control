import {
financialGoalAllocations,
financialGoals,
type AllocationType
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp,
serializeTimestamps
} from "@/lib/server/finance";
import { getInvestmentProjection } from "@/lib/server/investments";
import { eq } from "drizzle-orm";
import { buildGoalCard } from "./calculations";
import { DbContext,normalizeNotes } from "./validation";

export async function getGoalRowById(id: string, database: DbContext) {
  const goal = await database.query.financialGoals.findFirst({
    where: eq(financialGoals.id, id),
  });

  invariant(goal, "GOAL_NOT_FOUND", "Financial goal does not exist.", 404);

  return goal;
}

export async function getGoalAllocations(goalId: string, database: DbContext) {
  return database.query.financialGoalAllocations.findMany({
    where: eq(financialGoalAllocations.goalId, goalId),
    orderBy: (table, { desc }) => [desc(table.occurredOn), desc(table.createdAt)],
  });
}

export async function getInvestmentBalanceCents(database: DbContext) {
  const investmentProjection = await getInvestmentProjection(database);

  return investmentProjection?.currentBalanceCents ?? 0;
}

export async function getReserveSnapshot(database: DbContext) {
  const [investmentBalanceCents, goals, allocations] = await Promise.all([
    getInvestmentBalanceCents(database),
    database.query.financialGoals.findMany(),
    database.query.financialGoalAllocations.findMany(),
  ]);
  const visibleGoalIds = new Set(
    goals.filter((goal) => goal.status !== "archived").map((goal) => goal.id)
  );
  const totalAllocatedCents = allocations
    .filter((allocation) => visibleGoalIds.has(allocation.goalId))
    .reduce((total, allocation) => total + allocation.amountCents, 0);

  return {
    investmentBalanceCents,
    totalAllocatedCents,
    freeReserveCents: investmentBalanceCents - totalAllocatedCents,
  };
}

export async function insertAllocation(
  database: DbContext,
  values: {
    goalId: string;
    transactionId?: string | null;
    type: AllocationType;
    amountCents: number;
    occurredOn: string;
    notes?: string | null;
  }
) {
  const [allocation] = await database
    .insert(financialGoalAllocations)
    .values({
      ...values,
      notes: normalizeNotes(values.notes),
      updatedAt: currentTimestamp(),
    })
    .returning();

  return allocation;
}

export async function getGoalDetailsInDb(id: string, database: DbContext) {
  const goal = await getGoalRowById(id, database);
  const allocations = await getGoalAllocations(id, database);
  const allocatedCents = allocations.reduce(
    (total, allocation) => total + allocation.amountCents,
    0
  );

  return {
    goal: buildGoalCard(goal, allocatedCents),
    allocations: allocations.map(serializeTimestamps),
  };
}
