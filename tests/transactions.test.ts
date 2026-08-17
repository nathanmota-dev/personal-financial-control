import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "@/lib/server/transactions";
import {
  createInvestmentHolding,
  createInvestmentPurpose,
  getInvestmentPortfolioDashboard,
  upsertInvestmentPurposeAllocation,
} from "@/lib/server/investment-portfolio";
import { configureInvestmentPortfolio } from "@/lib/server/investments";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
});

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
  vi.useRealTimers();
});

describe("transactions", () => {
  it("filters transactions by month, account, category, and status", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Checking", type: "checking", initialBalanceCents: 0 },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);
    const groceries = await createCategory({ name: "Groceries", group: "variable_expense" }, db);

    await createTransaction(
      {
        accountId: account.id,
        categoryId: salary.id,
        type: "income",
        amountCents: 100000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-05",
        description: "Salary",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: groceries.id,
        type: "expense",
        amountCents: 10000,
        status: "pending",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-06",
        description: "Market",
      },
      db
    );
    await createTransaction(
      {
        accountId: account.id,
        categoryId: groceries.id,
        type: "expense",
        amountCents: 7000,
        status: "posted",
        competenceMonth: "2026-06",
        transactionDate: "2026-06-01",
        description: "Market June",
      },
      db
    );

    expect((await listTransactions({ competenceMonth: "2026-05" }, db)).length).toBe(2);
    expect((await listTransactions({ accountId: account.id }, db)).length).toBe(3);
    expect((await listTransactions({ categoryId: groceries.id }, db)).length).toBe(2);
    expect((await listTransactions({ status: "pending" }, db)).length).toBe(1);
  });

  it("reduces and restores the selected portfolio source for an effective withdrawal", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Conta investimentos", type: "checking", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Resgates", group: "investment" }, db);
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 0,
        checkpointDate: "2026-07-01",
      },
      db
    );
    const holding = await createInvestmentHolding(
      {
        name: "CDB liquidez",
        assetClass: "fixed_income",
        instrumentType: "cdb",
        currentValueCents: 100000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 100000,
        allocatedOn: "2026-07-16",
      },
      db
    );

    const created = await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_withdrawal",
        status: "posted",
        amountCents: 20000,
        transactionDate: "2026-07-10",
        competenceMonth: "2026-07",
        description: "Resgate reserva",
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 20000 }],
      },
      db
    );

    let dashboard = await getInvestmentPortfolioDashboard(db);
    expect(dashboard.holdings[0]?.currentValueCents).toBe(80000);
    expect(dashboard.allocations[0]?.amountCents).toBe(80000);

    await updateTransaction(
      {
        id: created.id,
        amountCents: 10000,
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 10000 }],
      },
      db
    );
    dashboard = await getInvestmentPortfolioDashboard(db);
    expect(dashboard.holdings[0]?.currentValueCents).toBe(90000);
    expect(dashboard.allocations[0]?.amountCents).toBe(90000);

    await deleteTransaction(created.id, db);
    dashboard = await getInvestmentPortfolioDashboard(db);
    expect(dashboard.holdings[0]?.currentValueCents).toBe(100000);
    expect(dashboard.allocations[0]?.amountCents).toBe(100000);
    expect((await listTransactions({}, db))).toHaveLength(0);
  });

  it("keeps pending withdrawals out of the portfolio and rolls back invalid source selections", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Conta planejada", type: "cash", initialBalanceCents: 1000000 },
      db
    );
    const category = await createCategory({ name: "Investimentos futuros", group: "investment" }, db);
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 50000,
        expectedMonthlyRateBps: 0,
        checkpointDate: "2026-07-01",
      },
      db
    );
    const holding = await createInvestmentHolding(
      {
        name: "Fundo",
        assetClass: "funds",
        instrumentType: "investment_fund",
        currentValueCents: 50000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Longo prazo" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 50000,
        allocatedOn: "2026-07-16",
      },
      db
    );

    const pending = await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "investment_withdrawal",
        status: "pending",
        amountCents: 10000,
        transactionDate: "2026-07-20",
        competenceMonth: "2026-07",
        description: "Resgate planejado",
      },
      db
    );
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(50000);

    await expect(
      updateTransaction(
        {
          id: pending.id,
          status: "posted",
          transactionDate: "2026-07-10",
          amountCents: 60000,
          sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 60000 }],
        },
        db
      )
    ).rejects.toMatchObject({ code: "INVESTMENT_REDUCTION_EXCEEDS_SOURCE" });

    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(50000);
    expect((await listTransactions({}, db))[0]?.status).toBe("pending");
  });
});
