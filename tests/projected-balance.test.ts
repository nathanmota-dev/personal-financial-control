import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { getProjectedBalance } from "@/lib/server/projected-balance";
import { createRecurringTemplate } from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { createTransfer } from "@/lib/server/transfers";
import { createTestDatabase } from "@/tests/helpers/database";
import {
  buildProjectedBalanceRequest,
  createBaseProjectionCategories,
  createProjectionAccount,
  createProjectionCreditAccount,
} from "@/tests/helpers/projected-balance";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("projected balance", () => {
  it("projects transactions, recurring expenses, credit card invoices, and investments", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createProjectionAccount(db, { initialBalanceCents: 200000 });
    const card = await createProjectionCreditAccount(db);
    const { salary, housing, groceries, brokerage } =
      await createBaseProjectionCategories(db);

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: groceries.id,
        type: "expense",
        status: "posted",
        amountCents: 30000,
        transactionDate: "2026-06-20",
        competenceMonth: "2026-06",
        description: "Past groceries",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: salary.id,
        type: "income",
        status: "pending",
        amountCents: 300000,
        transactionDate: "2026-07-05",
        competenceMonth: "2026-07",
        description: "Salary",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: housing.id,
        type: "expense",
        status: "posted",
        amountCents: 120000,
        transactionDate: "2026-07-06",
        competenceMonth: "2026-07",
        description: "Rent",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: brokerage.id,
        type: "investment_contribution",
        status: "pending",
        amountCents: 80000,
        transactionDate: "2026-07-15",
        competenceMonth: "2026-07",
        description: "Planned investment",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: groceries.id,
        type: "expense",
        status: "cancelled",
        amountCents: 99999,
        transactionDate: "2026-07-18",
        competenceMonth: "2026-07",
        description: "Cancelled expense",
      },
      db
    );
    await createRecurringTemplate(
      {
        accountId: checking.id,
        categoryId: groceries.id,
        type: "expense",
        amountCents: 30000,
        dayOfMonth: 20,
        startMonth: "2026-07",
        description: "Subscription",
      },
      db
    );
    await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: groceries.id,
        description: "Phone",
        purchaseDate: "2026-07-03",
        totalAmountCents: 150000,
        installmentCount: 1,
      },
      db
    );

    const projection = await getProjectedBalance(
      buildProjectedBalanceRequest({
        minimumReserveCents: 50000,
      }),
      db
    );

    expect(projection.summary.initialBalanceCents).toBe(170000);
    expect(projection.summary.finalProjectedBalanceCents).toBe(90000);
    expect(projection.summary.minimumProjectedBalanceCents).toBe(90000);
    expect(projection.summary.availablePerDayCents).toBe(1290);
    expect(projection.summary.status).toBe("safe");
    expect(projection.summary.nextIncomeDate).toBe("2026-07-05");
    expect(projection.daily.find((day) => day.date === "2026-07-10")).toMatchObject({
      creditCardCents: 150000,
      projectedBalanceCents: 200000,
    });
    expect(projection.daily.find((day) => day.date === "2026-07-15")).toMatchObject({
      investmentCents: 80000,
      projectedBalanceCents: 120000,
    });
    expect(projection.daily.find((day) => day.date === "2026-07-20")).toMatchObject({
      expenseCents: 30000,
      projectedBalanceCents: 90000,
    });
    expect(
      projection.daily.flatMap((day) => day.events).map((event) => event.description)
    ).not.toContain("Cancelled expense");
  });

  it("uses generated recurring transactions instead of duplicating template occurrences", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createProjectionAccount(db);
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const template = await createRecurringTemplate(
      {
        accountId: checking.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-07",
        description: "Monthly rent",
      },
      db
    );

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: category.id,
        recurringTemplateId: template.id,
        type: "expense",
        status: "posted",
        amountCents: 50000,
        transactionDate: "2026-07-05",
        competenceMonth: "2026-07",
        description: "Monthly rent",
      },
      db
    );

    const projection = await getProjectedBalance(
      buildProjectedBalanceRequest({
        endDate: "2026-07-10",
      }),
      db
    );
    const day = projection.daily.find((item) => item.date === "2026-07-05");

    expect(day?.expenseCents).toBe(50000);
    expect(day?.events).toHaveLength(1);
    expect(day?.events[0]?.source).toBe("transaction");
  });

  it("neutralizes transfers across selected accounts and applies them for one account", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const main = await createProjectionAccount(db);
    const reserve = await createAccount(
      { name: "Reserve", type: "savings", initialBalanceCents: 0 },
      db
    );

    await createTransfer(
      {
        fromAccountId: main.id,
        toAccountId: reserve.id,
        amountCents: 50000,
        transferDate: "2026-07-03",
        competenceMonth: "2026-07",
        description: "Reserve money",
      },
      db
    );

    const consolidated = await getProjectedBalance(
      buildProjectedBalanceRequest({
        endDate: "2026-07-05",
      }),
      db
    );
    const mainOnly = await getProjectedBalance(
      buildProjectedBalanceRequest({
        endDate: "2026-07-05",
        accountIds: [main.id],
      }),
      db
    );

    expect(consolidated.summary.finalProjectedBalanceCents).toBe(100000);
    expect(consolidated.daily.find((day) => day.date === "2026-07-03")?.events).toEqual([]);
    expect(mainOnly.summary.finalProjectedBalanceCents).toBe(50000);
    expect(mainOnly.daily.find((day) => day.date === "2026-07-03")).toMatchObject({
      transferOutCents: 50000,
      projectedBalanceCents: 50000,
    });
  });

  it("marks warning and negative days and clamps daily availability to zero", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createProjectionAccount(db);
    const groceries = await createCategory({ name: "Groceries", group: "variable_expense" }, db);

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: groceries.id,
        type: "expense",
        status: "pending",
        amountCents: 60000,
        transactionDate: "2026-07-02",
        competenceMonth: "2026-07",
        description: "Large purchase",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: groceries.id,
        type: "expense",
        status: "pending",
        amountCents: 50000,
        transactionDate: "2026-07-03",
        competenceMonth: "2026-07",
        description: "Another purchase",
      },
      db
    );

    const projection = await getProjectedBalance(
      buildProjectedBalanceRequest({
        endDate: "2026-07-05",
        minimumReserveCents: 50000,
      }),
      db
    );

    expect(projection.summary.status).toBe("negative");
    expect(projection.summary.firstWarningDate).toBe("2026-07-02");
    expect(projection.summary.firstNegativeDate).toBe("2026-07-03");
    expect(projection.summary.availablePerDayCents).toBe(0);
    expect(projection.daily.find((day) => day.date === "2026-07-02")?.status).toBe("warning");
    expect(projection.daily.find((day) => day.date === "2026-07-03")?.status).toBe("negative");
  });

  it("treats investment withdrawals as positive cash events", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createProjectionAccount(db);
    const investment = await createCategory({ name: "Brokerage", group: "investment" }, db);

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: investment.id,
        type: "investment_withdrawal",
        status: "pending",
        amountCents: 25000,
        transactionDate: "2026-07-10",
        competenceMonth: "2026-07",
        description: "Resgate",
      },
      db
    );

    const projection = await getProjectedBalance(
      buildProjectedBalanceRequest({ endDate: "2026-07-12" }),
      db
    );

    expect(projection.daily.find((day) => day.date === "2026-07-10")).toMatchObject({
      investmentCents: -25000,
      investmentWithdrawalCents: 25000,
      projectedBalanceCents: 125000,
    });
  });

});
