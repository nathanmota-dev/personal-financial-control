import type { AppDb } from "@/lib/db";
import {
accounts,
categories,
transactions
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp,
normalizeDate,
serializeTimestamps
} from "@/lib/server/finance";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getGoalAllocations,getGoalDetailsInDb,getGoalRowById,getReserveSnapshot,insertAllocation } from "./persistence";
import { allocationSchema,goalContributionSchema,normalizeNotes,resolveDb } from "./validation";

export async function allocateGoalFunds(
  input: z.input<typeof allocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = allocationSchema.parse(input);
  values.occurredOn = normalizeDate(values.occurredOn);

  return db.transaction(async (transaction) => {
    const goal = await getGoalRowById(values.goalId, transaction);
    invariant(
      goal.status !== "archived",
      "GOAL_ARCHIVED",
      "Archived goals cannot receive allocations."
    );

    const reserve = await getReserveSnapshot(transaction);
    invariant(
      reserve.freeReserveCents >= values.amountCents,
      "GOAL_ALLOCATION_EXCEEDS_FREE_RESERVE",
      "Allocation exceeds the free investment reserve."
    );

    await insertAllocation(transaction, {
      goalId: values.goalId,
      type: "manual_allocation",
      amountCents: values.amountCents,
      occurredOn: values.occurredOn,
      notes: values.notes,
    });

    return getGoalDetailsInDb(values.goalId, transaction);
  });
}

export async function releaseGoalFunds(
  input: z.input<typeof allocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = allocationSchema.parse(input);
  values.occurredOn = normalizeDate(values.occurredOn);

  return db.transaction(async (transaction) => {
    const goal = await getGoalRowById(values.goalId, transaction);
    invariant(
      goal.status !== "archived",
      "GOAL_ARCHIVED",
      "Archived goals cannot release allocations."
    );

    const allocations = await getGoalAllocations(values.goalId, transaction);
    const allocatedCents = allocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0
    );

    invariant(
      allocatedCents >= values.amountCents,
      "GOAL_RELEASE_EXCEEDS_ALLOCATED",
      "Release exceeds the amount allocated to this goal."
    );

    await insertAllocation(transaction, {
      goalId: values.goalId,
      type: "manual_release",
      amountCents: -values.amountCents,
      occurredOn: values.occurredOn,
      notes: values.notes,
    });

    return getGoalDetailsInDb(values.goalId, transaction);
  });
}

export async function createGoalContribution(
  input: z.input<typeof goalContributionSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = goalContributionSchema.parse(input);
  values.transactionDate = normalizeDate(values.transactionDate);

  return db.transaction(async (transaction) => {
    const [goal, account, category] = await Promise.all([
      getGoalRowById(values.goalId, transaction),
      transaction.query.accounts.findFirst({
        where: eq(accounts.id, values.accountId),
      }),
      transaction.query.categories.findFirst({
        where: eq(categories.id, values.categoryId),
      }),
    ]);

    invariant(
      goal.status !== "archived",
      "GOAL_ARCHIVED",
      "Archived goals cannot receive contributions."
    );
    invariant(account, "ACCOUNT_NOT_FOUND", "Account does not exist.", 404);
    invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);
    invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
    invariant(
      !category.isArchived,
      "CATEGORY_ARCHIVED",
      "Cannot use an archived category."
    );
    invariant(
      account.type === "checking" || account.type === "savings" || account.type === "cash",
      "INVALID_INVESTMENT_SOURCE_ACCOUNT",
      "Investment contributions require a checking, savings, or cash source account."
    );
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment contributions require an investment category."
    );

    const timestamp = currentTimestamp();
    const [createdTransaction] = await transaction
      .insert(transactions)
      .values({
        accountId: values.accountId,
        categoryId: values.categoryId,
        type: "investment_contribution",
        status: "posted",
        amountCents: values.amountCents,
        transactionDate: values.transactionDate,
        competenceMonth: values.transactionDate.slice(0, 7),
        description: `Aporte para ${goal.name}`,
        notes: normalizeNotes(values.notes) ?? `Meta: ${goal.name}`,
        isIncludedInInvestmentCheckpoint: false,
        updatedAt: timestamp,
      })
      .returning();

    const reserve = await getReserveSnapshot(transaction);
    invariant(
      reserve.freeReserveCents >= values.amountCents,
      "GOAL_ALLOCATION_EXCEEDS_FREE_RESERVE",
      "Contribution exceeds the free investment reserve."
    );

    const allocation = await insertAllocation(transaction, {
      goalId: values.goalId,
      transactionId: createdTransaction.id,
      type: "contribution",
      amountCents: values.amountCents,
      occurredOn: values.transactionDate,
      notes: normalizeNotes(values.notes) ?? "Aporte vinculado",
    });

    return {
      transaction: serializeTimestamps(createdTransaction),
      allocation: serializeTimestamps(allocation),
      ...(await getGoalDetailsInDb(values.goalId, transaction)),
    };
  });
}
