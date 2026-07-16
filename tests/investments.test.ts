import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { transactions } from "@/lib/db/schema";
import {
  configureInvestmentPortfolio,
  createInvestmentContribution,
  createInvestmentWithdrawal,
  getInvestmentContributionHistory,
  getInvestmentProjection,
  reconcileInvestmentBalance,
} from "@/lib/server/investments";
import {
  createRecurringTemplate,
  generateRecurringTransactions,
} from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("investments", () => {
  it("calculates the current balance with the return between the checkpoint and today", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 2966000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-08",
      },
      db
    );

    const projection = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });
    const expectedBalance = Math.round(2966000 * Math.pow(1.01, 8 / 31));

    expect(projection?.currentBalanceCents).toBe(expectedBalance);
    expect(projection?.estimatedInterestCents).toBe(expectedBalance - 2966000);
  });

  it("renders posted contributions in the correct point of the balance timeline", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 5000000 },
      db
    );
    const category = await createCategory({ name: "Corretora", group: "investment" }, db);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-06-01",
      },
      db
    );
    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 10000,
        transactionDate: "2026-06-15",
      },
      db
    );

    const projection = await getInvestmentProjection(db, { asOfDate: "2026-07-01" });
    const expectedBalance = Math.round(
      (100000 * Math.pow(1.01, 14 / 30) + 10000) * Math.pow(1.01, 16 / 30)
    );

    expect(projection?.currentBalanceCents).toBe(expectedBalance);
    expect(projection?.contributionCents).toBe(10000);
    expect(projection?.netMovementCents).toBe(10000);
  });

  it("incorporates a new checkpoint without counting previous movements again", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 5000000 },
      db
    );
    const category = await createCategory({ name: "Investimentos", group: "investment" }, db);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-01",
      },
      db
    );
    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 40000,
        transactionDate: "2026-07-10",
      },
      db
    );

    const before = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });
    await reconcileInvestmentBalance(
      {
        checkpointBalanceCents: before?.currentBalanceCents ?? 0,
        checkpointDate: "2026-07-16",
      },
      db
    );
    const after = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });

    expect(before?.contributionCents).toBe(40000);
    expect(after?.currentBalanceCents).toBe(before?.currentBalanceCents);
    expect(after?.contributionCents).toBe(0);
    expect(after?.checkpointDate).toBe("2026-07-16");
  });

  it("uses only posted movements for the current balance and pending movements for the future", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "cash", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Renda variável", group: "investment" }, db);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-01",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_contribution",
        status: "posted",
        amountCents: 40000,
        transactionDate: "2026-07-05",
        competenceMonth: "2026-07",
        description: "Aporte realizado",
      },
      db
    );
    for (const status of ["pending", "cancelled"] as const) {
      await createTransaction(
        {
          accountId: account.id,
          categoryId: category.id,
          type: "investment_contribution",
          status,
          amountCents: 30000,
          transactionDate: "2026-07-06",
          competenceMonth: "2026-07",
          description: `Aporte ${status}`,
        },
        db
      );
    }
    await createInvestmentWithdrawal(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 10000,
        transactionDate: "2026-07-10",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_contribution",
        status: "pending",
        amountCents: 80000,
        transactionDate: "2026-07-20",
        competenceMonth: "2026-07",
        description: "Aporte planejado",
      },
      db
    );

    const projection = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });

    expect(projection?.contributionCents).toBe(40000);
    expect(projection?.withdrawalCents).toBe(10000);
    expect(projection?.plannedMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: "2026-07-20", amountCents: 80000 }),
      ])
    );
    expect(projection?.plannedMovements).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: "2026-07-06", amountCents: 30000 }),
      ])
    );
  });

  it("uses recurring contributions once and does not duplicate generated occurrences", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta recorrente", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Aporte mensal", group: "investment" }, db);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-01",
      },
      db
    );
    const template = await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_contribution",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-08",
        description: "Aporte mensal",
      },
      db
    );

    const beforeGeneration = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });
    expect(
      beforeGeneration?.plannedMovements.filter((movement) => movement.date === "2026-08-05")
    ).toHaveLength(1);

    await generateRecurringTransactions("2026-08", db);
    const afterGeneration = await getInvestmentProjection(db, { asOfDate: "2026-07-16" });
    const augustMovements = afterGeneration?.plannedMovements.filter(
      (movement) => movement.date === "2026-08-05"
    );

    expect(augustMovements).toHaveLength(1);
    expect(augustMovements?.[0]?.id).not.toBe(`${template.id}:2026-08`);
  });

  it("builds monthly history for contributions and withdrawals", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta histórica", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Carteira", group: "investment" }, db);

    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 10000,
        transactionDate: "2026-06-05",
      },
      db
    );
    await createInvestmentWithdrawal(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 3000,
        transactionDate: "2026-07-05",
      },
      db
    );

    const history = await getInvestmentContributionHistory(db);

    expect(history.totalContributionCents).toBe(10000);
    expect(history.totalWithdrawalCents).toBe(3000);
    expect(history.points.find((point) => point.month === "2026-07")).toMatchObject({
      monthlyWithdrawalCents: 3000,
      cumulativeNetMovementCents: 7000,
    });
  });

  it("keeps legacy checkpoint flags when storing historical movements", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta legado", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Carteira legada", group: "investment" }, db);

    await db.insert(transactions).values({
      accountId: account.id,
      categoryId: category.id,
      type: "investment_contribution",
      status: "posted",
      amountCents: 75000,
      transactionDate: "2026-05-10",
      competenceMonth: "2026-05",
      description: "Aporte histórico",
      isIncludedInInvestmentCheckpoint: true,
    });
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 500000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-06-01",
      },
      db
    );

    const projection = await getInvestmentProjection(db, { asOfDate: "2026-07-01" });

    expect(projection?.contributionCents).toBe(0);
    expect(projection?.currentBalanceCents).toBeGreaterThan(500000);
  });
});
