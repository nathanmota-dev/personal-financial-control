import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import {
  compareMonths,
  getCategorySpendingReport,
  getMonthlyDashboard,
  getMonthlyExpenseFeed,
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

  it("reports investment withdrawals as positive cash flow and net investment movement", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Brokerage", group: "investment" }, db);

    await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_contribution",
        status: "posted",
        amountCents: 50000,
        transactionDate: "2026-07-05",
        competenceMonth: "2026-07",
        description: "Aporte",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_withdrawal",
        status: "posted",
        amountCents: 20000,
        transactionDate: "2026-07-10",
        competenceMonth: "2026-07",
        description: "Resgate",
      },
      db
    );

    const dashboard = await getMonthlyDashboard("2026-07", db);

    expect(dashboard.totals.investmentContributionCents).toBe(50000);
    expect(dashboard.totals.investmentWithdrawalCents).toBe(20000);
    expect(dashboard.totals.netInvestmentFlowCents).toBe(30000);
    expect(dashboard.totals.netResultCents).toBe(-30000);
  });

  it("includes credit card installments in monthly totals and expense feeds", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const card = await createAccount(
      {
        name: "Card",
        type: "credit",
        initialBalanceCents: 0,
        creditClosingDay: 4,
        creditDueDay: 10,
      },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);
    const rent = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const food = await createCategory({ name: "Food", group: "variable_expense" }, db);

    await createTransaction(
      {
        accountId: checking.id,
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
        accountId: checking.id,
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
    await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: food.id,
        description: "Market",
        purchaseDate: "2026-05-03",
        totalAmountCents: 30000,
        installmentCount: 1,
      },
      db
    );

    const dashboard = await getMonthlyDashboard("2026-05", db);
    const spending = await getCategorySpendingReport("2026-05", db);
    const expenseFeed = await getMonthlyExpenseFeed("2026-05", db);

    expect(dashboard.totals.fixedExpenseCents).toBe(120000);
    expect(dashboard.totals.variableExpenseCents).toBe(30000);
    expect(dashboard.totals.netResultCents).toBe(150000);
    expect(dashboard.accountBalances.find((account) => account.id === card.id)?.metricLabel).toBe(
      "Fatura do mês"
    );
    expect(dashboard.accountBalances.find((account) => account.id === card.id)?.currentBalanceCents).toBe(
      30000
    );
    expect(spending.find((item) => item.categoryName === "Food")?.amountCents).toBe(30000);
    expect(expenseFeed.map((item) => item.description)).toContain("Market");
  });
});
