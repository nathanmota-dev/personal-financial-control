import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  allocateGoalFunds,
  archiveGoal,
  createGoal,
  createGoalContribution,
  getGoalsDashboard,
  releaseGoalFunds,
} from "@/lib/server/goals";
import { saveInvestmentPortfolio } from "@/lib/server/investments";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("goals", () => {
  it("creates goals and calculates visible progress", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );

    const created = await createGoal(
      {
        name: "MacBook",
        category: "electronics",
        targetAmountCents: 100000,
        initialAllocationCents: 25000,
        initialAllocationDate: "2026-07-09",
      },
      db
    );

    expect(created.goal.allocatedCents).toBe(25000);
    expect(created.goal.remainingCents).toBe(75000);
    expect(created.goal.progressPercentage).toBe(25);
  });

  it("normalizes target dates to month precision and validates priority", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const created = await createGoal(
      {
        name: "Apartamento",
        category: "housing",
        targetAmountCents: 100000,
        targetDate: "2027-03-15",
        priority: 0,
      },
      db
    );

    expect(created.goal.targetDate).toBe("2027-03");

    await expect(
      createGoal(
        {
          name: "Prioridade inválida",
          category: "other",
          targetAmountCents: 100000,
          priority: 99,
        },
        db
      )
    ).rejects.toThrow();
  });

  it("uses initial allocations to reduce the free reserve", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 200000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );

    await createGoal(
      {
        name: "Apartamento",
        category: "housing",
        targetAmountCents: 5000000,
        initialAllocationCents: 80000,
        initialAllocationDate: "2026-07-09",
      },
      db
    );

    const dashboard = await getGoalsDashboard(db);

    expect(dashboard.summary.totalAllocatedCents).toBe(80000);
    expect(dashboard.summary.freeReserveCents).toBe(120000);
  });

  it("blocks manual allocation above the free reserve", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 10000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );
    const created = await createGoal(
      {
        name: "Moto",
        category: "vehicle",
        targetAmountCents: 500000,
      },
      db
    );

    await expect(
      allocateGoalFunds(
        {
          goalId: created.goal.id,
          amountCents: 10001,
          occurredOn: "2026-07-10",
        },
        db
      )
    ).rejects.toMatchObject({
      code: "GOAL_ALLOCATION_EXCEEDS_FREE_RESERVE",
    });
  });

  it("releases allocated balance without allowing a negative goal allocation", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 50000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );
    const created = await createGoal(
      {
        name: "Viagem",
        category: "travel",
        targetAmountCents: 100000,
        initialAllocationCents: 30000,
        initialAllocationDate: "2026-07-09",
      },
      db
    );

    const released = await releaseGoalFunds(
      {
        goalId: created.goal.id,
        amountCents: 10000,
        occurredOn: "2026-07-10",
      },
      db
    );

    expect(released.goal.allocatedCents).toBe(20000);
    await expect(
      releaseGoalFunds(
        {
          goalId: created.goal.id,
          amountCents: 20001,
          occurredOn: "2026-07-11",
        },
        db
      )
    ).rejects.toMatchObject({
      code: "GOAL_RELEASE_EXCEEDS_ALLOCATED",
    });
  });

  it("creates a real investment contribution and links it to the goal allocation", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 100000 },
      db
    );
    const category = await createCategory(
      { name: "Corretora", group: "investment" },
      db
    );

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 0,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );
    const created = await createGoal(
      {
        name: "Reserva para carro",
        category: "vehicle",
        targetAmountCents: 9000000,
      },
      db
    );

    const contribution = await createGoalContribution(
      {
        goalId: created.goal.id,
        accountId: account.id,
        categoryId: category.id,
        amountCents: 15000,
        transactionDate: "2026-07-12",
      },
      db
    );
    const transaction = await db.query.transactions.findFirst({
      where: (table, { eq }) => eq(table.id, contribution.transaction.id),
    });

    expect(transaction).toMatchObject({
      type: "investment_contribution",
      status: "posted",
      amountCents: 15000,
      isIncludedInInvestmentBalance: false,
    });
    expect(contribution.allocation).toMatchObject({
      transactionId: contribution.transaction.id,
      type: "contribution",
      amountCents: 15000,
    });
    expect(contribution.goal.allocatedCents).toBe(15000);
  });

  it("removes archived goals from the dashboard summary", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-07-01",
      },
      db
    );
    const created = await createGoal(
      {
        name: "Meta antiga",
        category: "other",
        targetAmountCents: 100000,
        initialAllocationCents: 60000,
        initialAllocationDate: "2026-07-09",
      },
      db
    );

    await archiveGoal(created.goal.id, db);
    const dashboard = await getGoalsDashboard(db);

    expect(dashboard.summary.totalAllocatedCents).toBe(0);
    expect(dashboard.summary.freeReserveCents).toBe(100000);
    expect(dashboard.summary.goalCount).toBe(0);
    expect(dashboard.summary.archivedGoalCount).toBe(1);
  });

  it("aggregates goal allocations by month", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 0,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-05-01",
      },
      db
    );
    const created = await createGoal(
      {
        name: "Educação",
        category: "education",
        targetAmountCents: 100000,
        initialAllocationCents: 10000,
        initialAllocationDate: "2026-05-01",
      },
      db
    );
    await allocateGoalFunds(
      {
        goalId: created.goal.id,
        amountCents: 5000,
        occurredOn: "2026-05-20",
      },
      db
    );
    await allocateGoalFunds(
      {
        goalId: created.goal.id,
        amountCents: 7000,
        occurredOn: "2026-06-10",
      },
      db
    );
    await releaseGoalFunds(
      {
        goalId: created.goal.id,
        amountCents: 2000,
        occurredOn: "2026-06-11",
      },
      db
    );

    const dashboard = await getGoalsDashboard(db);
    const may = dashboard.charts.monthlyEvolution.find(
      (point) => point.month === "2026-05"
    );
    const june = dashboard.charts.monthlyEvolution.find(
      (point) => point.month === "2026-06"
    );

    expect(may).toMatchObject({
      monthlyAllocatedCents: 15000,
      monthlyReleasedCents: 0,
      netMovementCents: 15000,
      cumulativeAllocatedCents: 15000,
    });
    expect(june).toMatchObject({
      monthlyAllocatedCents: 7000,
      monthlyReleasedCents: 2000,
      netMovementCents: 5000,
      cumulativeAllocatedCents: 20000,
    });
  });
});
