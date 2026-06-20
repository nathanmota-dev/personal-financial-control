import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { transactions } from "@/lib/db/schema";
import {
  createInvestmentContribution,
  getInvestmentContributionHistory,
  getInvestmentProjection,
  saveInvestmentPortfolio,
} from "@/lib/server/investments";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("investments", () => {
  it("projects fixed horizons without adding a contribution in the first month", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-05-01",
      },
      db
    );

    const projection = await getInvestmentProjection(db);

    expect(Object.keys(projection?.projection ?? {}).map(Number)).toEqual([1, 6, 12, 24]);
    expect(projection?.projection[1]).toBe(101000);
    expect(projection?.projection[6]).toBeGreaterThan(150000);
    expect(projection?.projection[12]).toBeGreaterThan(projection?.projection[6] ?? 0);
    expect(projection?.projection[24]).toBeGreaterThan(projection?.projection[12] ?? 0);
  });

  it("adds posted contributions to the effective balance and consolidates them", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 5000000 },
      db
    );
    const category = await createCategory(
      { name: "Corretora", group: "investment" },
      db
    );

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 2500000,
        monthlyContributionCents: 250000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-05-01",
      },
      db
    );
    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 250000,
        transactionDate: "2026-06-15",
      },
      db
    );

    const beforeConsolidation = await getInvestmentProjection(db);
    expect(beforeConsolidation?.currentBalanceCents).toBe(2750000);
    expect(beforeConsolidation?.unincorporatedContributionCents).toBe(250000);
    expect(beforeConsolidation?.referenceDate).toBe("2026-06-15");

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: beforeConsolidation?.currentBalanceCents ?? 0,
        monthlyContributionCents: beforeConsolidation?.monthlyContributionCents ?? 0,
        expectedMonthlyRateBps: beforeConsolidation?.expectedMonthlyRateBps ?? 0,
        referenceDate: beforeConsolidation?.referenceDate ?? "2026-06-15",
      },
      db
    );

    const afterConsolidation = await getInvestmentProjection(db);
    expect(afterConsolidation?.currentBalanceCents).toBe(2750000);
    expect(afterConsolidation?.unincorporatedContributionCents).toBe(0);
  });

  it("uses only posted contributions in the balance and history", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory(
      { name: "Investimentos", group: "investment" },
      db
    );

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-05-01",
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
          transactionDate: "2026-06-10",
          competenceMonth: "2026-06",
          description: `Aporte ${status}`,
        },
        db
      );
    }

    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 40000,
        transactionDate: "2026-06-15",
      },
      db
    );

    const projection = await getInvestmentProjection(db);
    const history = await getInvestmentContributionHistory(db);

    expect(projection?.currentBalanceCents).toBe(140000);
    expect(history.totalContributionCents).toBe(40000);
    expect(history.points.find((point) => point.month === "2026-06")).toMatchObject({
      monthlyContributionCents: 40000,
      cumulativeContributionCents: 40000,
    });
  });

  it("keeps legacy contributions in history without adding them to the base again", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta legado", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory(
      { name: "Carteira legada", group: "investment" },
      db
    );

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 500000,
        monthlyContributionCents: 50000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-06-01",
      },
      db
    );
    await db.insert(transactions).values({
      accountId: account.id,
      categoryId: category.id,
      type: "investment_contribution",
      status: "posted",
      amountCents: 75000,
      transactionDate: "2026-05-10",
      competenceMonth: "2026-05",
      description: "Aporte anterior à migração",
    });

    const projection = await getInvestmentProjection(db);
    const history = await getInvestmentContributionHistory(db);

    expect(projection?.currentBalanceCents).toBe(500000);
    expect(projection?.unincorporatedContributionCents).toBe(0);
    expect(history.totalContributionCents).toBe(75000);
  });

  it("fills empty months while accumulating contribution history", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const account = await createAccount(
      { name: "Conta principal", type: "cash", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory(
      { name: "Renda variável", group: "investment" },
      db
    );

    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 10000,
        transactionDate: "2026-06-05",
      },
      db
    );
    await createInvestmentContribution(
      {
        accountId: account.id,
        categoryId: category.id,
        amountCents: 25000,
        transactionDate: "2026-08-05",
      },
      db
    );

    const history = await getInvestmentContributionHistory(db);

    expect(history.points.slice(0, 3)).toEqual([
      {
        month: "2026-06",
        monthlyContributionCents: 10000,
        cumulativeContributionCents: 10000,
      },
      {
        month: "2026-07",
        monthlyContributionCents: 0,
        cumulativeContributionCents: 10000,
      },
      {
        month: "2026-08",
        monthlyContributionCents: 25000,
        cumulativeContributionCents: 35000,
      },
    ]);
  });
});
