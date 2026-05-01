import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  compareMonths,
  getCategorySpendingReport,
  getMonthlyDashboard,
  getMonthlyEvolution,
} from "@/lib/server/dashboard";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("dashboard", () => {
  it("aggregates monthly totals and reports", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);
    const rent = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const food = await createCategory({ name: "Food", group: "variable_expense" }, db);
    const brokerage = await createCategory({ name: "Brokerage", group: "investment" }, db);

    await createTransaction(
      {
        accountId: account.id,
        categoryId: salary.id,
        type: "income",
        amountCents: 300000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-01",
        description: "Salary",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: rent.id,
        type: "expense",
        amountCents: 120000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-02",
        description: "Rent",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: food.id,
        type: "expense",
        amountCents: 30000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-03",
        description: "Food",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: brokerage.id,
        type: "investment_contribution",
        amountCents: 25000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-04",
        description: "Invest",
      },
      db
    );

    const dashboard = await getMonthlyDashboard("2026-05", db);
    const spending = await getCategorySpendingReport("2026-05", db);
    const evolution = await getMonthlyEvolution(["2026-05"], db);
    const comparison = await compareMonths("2026-05", "2026-05", db);

    expect(dashboard.totals.fixedExpenseCents).toBe(120000);
    expect(dashboard.totals.variableExpenseCents).toBe(30000);
    expect(dashboard.totals.investmentContributionCents).toBe(25000);
    expect(dashboard.totals.netResultCents).toBe(125000);
    expect(spending[0]?.categoryName).toBe("Rent");
    expect(evolution).toHaveLength(1);
    expect(comparison.left.totals.netResultCents).toBe(125000);
  });
});
