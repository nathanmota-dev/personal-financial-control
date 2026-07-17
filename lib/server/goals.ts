import { eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { getInvestmentProjection } from "@/lib/server/investments";
import {
  accounts,
  allocationTypes,
  categories,
  financialGoalAllocations,
  financialGoals,
  goalCategories,
  goalStatuses,
  transactions,
  type AllocationType,
  type GoalCategory,
  type GoalStatus,
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
  currentTimestamp,
  normalizeCompetenceMonth,
  normalizeDate,
  serializeTimestamps,
} from "@/lib/server/finance";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { getFinanceToday } from "@/lib/server/runtime";

type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type DbContext = AppDb | AppDbTransaction;
type GoalRow = typeof financialGoals.$inferSelect;
type AllocationRow = typeof financialGoalAllocations.$inferSelect;

const DEFAULT_GOAL_COLOR = "#38bdf8";

const nullableTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .nullable()
  .optional();

const optionalMonthSchema = z
  .string()
  .trim()
  .transform((value) => {
    if (!value.length) {
      return null;
    }

    if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
      return normalizeDate(value).slice(0, 7);
    }

    return normalizeCompetenceMonth(value);
  })
  .nullable()
  .optional();

const goalValuesSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum(goalCategories).default("other"),
  targetAmountCents: z.number().int().positive(),
  targetDate: optionalMonthSchema,
  plannedMonthlyContributionCents: z.number().int().nonnegative().default(0),
  priority: z.number().int().min(0).max(2).default(1),
  status: z.enum(goalStatuses).default("active"),
  color: z.string().trim().min(1).default(DEFAULT_GOAL_COLOR),
  notes: nullableTextSchema,
});

const createGoalSchema = goalValuesSchema.extend({
  initialAllocationCents: z.number().int().nonnegative().default(0),
  initialAllocationDate: z.string().trim().optional(),
});

const updateGoalSchema = goalValuesSchema.partial().extend({
  id: z.string().uuid(),
});

const allocationSchema = z.object({
  goalId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  occurredOn: z.string().trim(),
  notes: nullableTextSchema,
});

const goalContributionSchema = z.object({
  goalId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string().trim(),
  notes: nullableTextSchema,
});

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

function todayIso() {
  return getFinanceToday();
}

function normalizeNullableMonth(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
    return normalizeDate(value).slice(0, 7);
  }

  return normalizeCompetenceMonth(value);
}

function normalizeStoredTargetMonth(value: string | null) {
  return value ? value.slice(0, 7) : null;
}

function normalizeNotes(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function monthToIndex(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + monthNumber - 1;
}

function indexToMonth(index: number) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getRemainingMonths(targetDate: string | null) {
  if (!targetDate) {
    return null;
  }

  const [targetYear, targetMonth] = targetDate.split("-").map(Number);
  const now = new Date(`${getFinanceToday()}T00:00:00.000Z`);
  const currentIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const targetIndex = targetYear * 12 + targetMonth - 1;

  return Math.max(targetIndex - currentIndex + 1, 1);
}

function getRequiredMonthlyContributionCents({
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

function buildAllocationTotals(allocations: AllocationRow[]) {
  const totals = new Map<string, number>();

  for (const allocation of allocations) {
    totals.set(
      allocation.goalId,
      (totals.get(allocation.goalId) ?? 0) + allocation.amountCents
    );
  }

  return totals;
}

function sortGoals(left: GoalRow, right: GoalRow) {
  return (
    left.priority - right.priority ||
    (left.targetDate ?? "9999-12-31").localeCompare(
      right.targetDate ?? "9999-12-31"
    ) ||
    left.name.localeCompare(right.name)
  );
}

function buildGoalCard(goal: GoalRow, allocatedCents: number) {
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

async function getGoalRowById(id: string, database: DbContext) {
  const goal = await database.query.financialGoals.findFirst({
    where: eq(financialGoals.id, id),
  });

  invariant(goal, "GOAL_NOT_FOUND", "Financial goal does not exist.", 404);

  return goal;
}

async function getGoalAllocations(goalId: string, database: DbContext) {
  return database.query.financialGoalAllocations.findMany({
    where: eq(financialGoalAllocations.goalId, goalId),
    orderBy: (table, { desc }) => [desc(table.occurredOn), desc(table.createdAt)],
  });
}

async function getInvestmentBalanceCents(database: DbContext) {
  const investmentProjection = await getInvestmentProjection(database);

  return investmentProjection?.currentBalanceCents ?? 0;
}

async function getReserveSnapshot(database: DbContext) {
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

async function insertAllocation(
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

async function getGoalDetailsInDb(id: string, database: DbContext) {
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

function buildMonthlyEvolution(
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
