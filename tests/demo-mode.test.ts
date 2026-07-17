import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getFinanceDatabase } from "@/lib/db";
import { accountIds, categoryIds } from "@/lib/demo/fixture";
import { getCategorySpendingReport, getMonthlyDashboard } from "@/lib/server/dashboard";
import { getCreditCardOverview } from "@/lib/server/credit-card";
import { getGoalsDashboard } from "@/lib/server/goals";
import {
  getInvestmentContributionHistory,
  getInvestmentProjection,
} from "@/lib/server/investments";
import { getProjectedBalance, parseProjectedBalanceSearchParams } from "@/lib/server/projected-balance";
import { listRecurringTemplates } from "@/lib/server/recurring";
import { createTransaction, listTransactions } from "@/lib/server/transactions";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { listTransfers } from "@/lib/server/transfers";

const originalDemoMode = process.env.DEMO_MODE;

describe("demo mode", () => {
  beforeAll(() => {
    process.env.DEMO_MODE = "on";
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });

  it("loads every finance domain from the in-memory fixture", async () => {
    const [accounts, categories, transactions, transfers, recurring, dashboard, spending, creditCard, investments, history, goals] =
      await Promise.all([
        listAccounts(),
        listCategories(),
        listTransactions({ competenceMonth: "2026-07" }),
        listTransfers({ competenceMonth: "2026-07" }),
        listRecurringTemplates(),
        getMonthlyDashboard("2026-07"),
        getCategorySpendingReport("2026-07"),
        getCreditCardOverview("2026-07"),
        getInvestmentProjection(),
        getInvestmentContributionHistory(),
        getGoalsDashboard(),
      ]);

    expect(accounts).toHaveLength(5);
    expect(categories.length).toBeGreaterThan(5);
    expect(transactions.length).toBeGreaterThanOrEqual(10);
    expect(transfers).toHaveLength(2);
    expect(recurring).toHaveLength(4);
    expect(dashboard.totals.incomeCents).toBeGreaterThan(0);
    expect(spending.length).toBeGreaterThan(0);
    expect(creditCard.state).toBe("ready");
    expect(investments?.currentBalanceCents).toBeGreaterThan(0);
    expect(history.points.length).toBeGreaterThan(0);
    expect(goals.goals.length).toBe(3);
    expect(goals.archivedGoals.length).toBe(1);
  });

  it("calculates a projected balance and keeps mutations in memory", async () => {
    const request = parseProjectedBalanceSearchParams(
      new URLSearchParams({
        period: "next_30_days",
        startDate: "2026-07-16",
      })
    );
    const projection = await getProjectedBalance(request);
    const before = (await listTransactions({ competenceMonth: "2026-07" })).length;

    await createTransaction({
      accountId: accountIds.checking,
      categoryId: categoryIds.salary,
      type: "income",
      amountCents: 100,
      transactionDate: "2026-07-16",
      competenceMonth: "2026-07",
      description: "Simulação temporária",
    });

    const after = (await listTransactions({ competenceMonth: "2026-07" })).length;

    expect(projection.daily.length).toBe(30);
    expect(after).toBe(before + 1);
    expect((await getFinanceDatabase()).query.accounts).toBeDefined();
  });
});
