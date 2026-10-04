import type { AppDb } from "@/lib/db";
import {
financialGoals,
type GoalCategory,
type GoalStatus
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp,
normalizeDate
} from "@/lib/server/finance";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getGoalDetailsInDb,getGoalRowById,getReserveSnapshot,insertAllocation } from "./persistence";
import { createGoalSchema,GoalRow,normalizeNotes,normalizeNullableMonth,resolveDb,todayIso,updateGoalSchema } from "./validation";

export async function createGoal(input: z.input<typeof createGoalSchema>, database?: AppDb) {
  const db = await resolveDb(database);
  const values = createGoalSchema.parse(input);
  const initialAllocationCents = values.initialAllocationCents;
  const initialAllocationDate = normalizeDate(values.initialAllocationDate ?? todayIso());

  invariant(
    values.status !== "archived" || initialAllocationCents === 0,
    "ARCHIVED_GOAL_INITIAL_ALLOCATION",
    "Archived goals cannot start with allocated funds."
  );

  return db.transaction(async (transaction) => {
    if (initialAllocationCents > 0) {
      const reserve = await getReserveSnapshot(transaction);
      invariant(
        reserve.freeReserveCents >= initialAllocationCents,
        "GOAL_ALLOCATION_EXCEEDS_FREE_RESERVE",
        "Allocation exceeds the free investment reserve."
      );
    }

    const [goal] = await transaction
      .insert(financialGoals)
      .values({
        name: values.name,
        category: values.category,
        targetAmountCents: values.targetAmountCents,
        targetDate: normalizeNullableMonth(values.targetDate),
        plannedMonthlyContributionCents: values.plannedMonthlyContributionCents,
        priority: values.priority,
        status: values.status,
        color: values.color,
        notes: normalizeNotes(values.notes),
        updatedAt: currentTimestamp(),
      })
      .returning();

    if (initialAllocationCents > 0) {
      await insertAllocation(transaction, {
        goalId: goal.id,
        type: "initial_allocation",
        amountCents: initialAllocationCents,
        occurredOn: initialAllocationDate,
        notes: "Alocacao inicial",
      });
    }

    return getGoalDetailsInDb(goal.id, transaction);
  });
}

export async function updateGoal(input: z.input<typeof updateGoalSchema>, database?: AppDb) {
  const db = await resolveDb(database);
  const { id, ...values } = updateGoalSchema.parse(input);
  await getGoalRowById(id, db);

  const updateValues: Partial<GoalRow> = {};

  if (values.name !== undefined) {
    updateValues.name = values.name;
  }

  if (values.category !== undefined) {
    updateValues.category = values.category as GoalCategory;
  }

  if (values.targetAmountCents !== undefined) {
    updateValues.targetAmountCents = values.targetAmountCents;
  }

  if (values.targetDate !== undefined) {
    updateValues.targetDate = normalizeNullableMonth(values.targetDate);
  }

  if (values.plannedMonthlyContributionCents !== undefined) {
    updateValues.plannedMonthlyContributionCents =
      values.plannedMonthlyContributionCents;
  }

  if (values.priority !== undefined) {
    updateValues.priority = values.priority;
  }

  if (values.status !== undefined) {
    updateValues.status = values.status as GoalStatus;
  }

  if (values.color !== undefined) {
    updateValues.color = values.color;
  }

  if (values.notes !== undefined) {
    updateValues.notes = normalizeNotes(values.notes);
  }

  invariant(
    Object.keys(updateValues).length > 0,
    "EMPTY_GOAL_UPDATE",
    "At least one goal field must be updated."
  );

  await db
    .update(financialGoals)
    .set({
      ...updateValues,
      updatedAt: currentTimestamp(),
    })
    .where(eq(financialGoals.id, id));

  return getGoalDetailsInDb(id, db);
}

export async function archiveGoal(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  await getGoalRowById(id, db);
  await db
    .update(financialGoals)
    .set({
      status: "archived",
      updatedAt: currentTimestamp(),
    })
    .where(eq(financialGoals.id, id));

  return getGoalDetailsInDb(id, db);
}
