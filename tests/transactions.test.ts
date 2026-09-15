import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAccount, getAccountDetails } from "@/lib/server/accounts";
import { createCategory, listCategories } from "@/lib/server/categories";
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
  it("allows ordinary income and expenses without a category and supports clearing one later", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Checking", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Groceries", group: "variable_expense" }, db);

    const uncategorized = await createTransaction(
      {
        accountId: account.id,
        type: "expense",
        amountCents: 10000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-05",
        description: "Market",
      },
      db
    );
    const categorized = await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 7000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-06",
        description: "Bakery",
      },
      db
    );

    expect(uncategorized.categoryId).toBeNull();
    expect((await listTransactions({ uncategorized: true }, db)).map((row) => row.id)).toEqual([
      uncategorized.id,
    ]);

    const preserved = await updateTransaction(
      { id: categorized.id, description: "Bakery updated" },
      db
    );
    expect(preserved.categoryId).toBe(category.id);

    const cleared = await updateTransaction({ id: categorized.id, categoryId: null }, db);
    expect(cleared.categoryId).toBeNull();
    expect((await listTransactions({ uncategorized: true }, db)).map((row) => row.id)).toEqual([
      categorized.id,
      uncategorized.id,
    ]);
  });

  it("requires a category for investment movements", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Investment account", type: "checking", initialBalanceCents: 0 },
      db
    );

    await expect(
      createTransaction(
        {
          accountId: account.id,
          type: "investment_contribution",
          amountCents: 10000,
          status: "posted",
          competenceMonth: "2026-05",
          transactionDate: "2026-05-05",
          description: "Contribution",
        },
        db
      )
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });
  });

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

  it("creates an investment-funded expense as an atomic pair and exposes its link", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 100000 },
      db
    );
    const expenseCategory = await createCategory({ name: "Mercado", group: "variable_expense" }, db);
    const categories = await listCategories({}, db);
    const investments = categories.find((category) => category.name === "Investimentos");
    const holding = await createInvestmentHolding(
      {
        name: "CDB liquidez",
        assetClass: "fixed_income",
        instrumentType: "cdb",
        currentValueCents: 80000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 80000,
        allocatedOn: "2026-07-16",
      },
      db
    );
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 80000,
        expectedMonthlyRateBps: 0,
        checkpointDate: "2026-07-01",
      },
      db
    );

    const expense = await createTransaction(
      {
        accountId: account.id,
        categoryId: expenseCategory.id,
        type: "expense",
        status: "posted",
        amountCents: 25000,
        transactionDate: "2026-07-10",
        competenceMonth: "2026-07",
        description: "Mercado extra",
        fundingSource: "investments",
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 25000 }],
      },
      db
    );

    const rows = await listTransactions({}, db);
    const withdrawal = rows.find((row) => row.type === "investment_withdrawal");
    const listedExpense = rows.find((row) => row.id === expense.id);
    const accountDetails = await getAccountDetails(account.id, db);
    const dashboard = await getInvestmentPortfolioDashboard(db);

    expect(investments?.id).toBeDefined();
    expect(rows).toHaveLength(2);
    expect(listedExpense).toMatchObject({
      fundingSource: "investments",
      isGeneratedByFunding: false,
      fundingLink: {
        expenseTransactionId: expense.id,
        type: "investment_funded_expense",
      },
    });
    expect(withdrawal).toMatchObject({
      fundingSource: "investments",
      isGeneratedByFunding: true,
      description: "Resgate automático: Mercado extra",
      fundingLink: {
        expenseTransactionId: expense.id,
        withdrawalTransactionId: withdrawal?.id,
      },
    });
    expect(accountDetails.currentBalanceCents).toBe(100000);
    expect(dashboard.holdings[0]?.currentValueCents).toBe(55000);
    expect(dashboard.allocations[0]?.amountCents).toBe(55000);
    expect((await db.query.transactionFundingLinks.findMany())).toHaveLength(1);
  });

  it("updates, switches, and deletes an investment-funded expense as one operation", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Conta principal", type: "checking", initialBalanceCents: 100000 },
      db
    );
    const expenseCategory = await createCategory({ name: "Viagem", group: "variable_expense" }, db);
    const holding = await createInvestmentHolding(
      {
        name: "Fundo",
        assetClass: "funds",
        instrumentType: "investment_fund",
        currentValueCents: 80000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 80000,
        allocatedOn: "2026-07-16",
      },
      db
    );
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 80000,
        expectedMonthlyRateBps: 0,
        checkpointDate: "2026-07-01",
      },
      db
    );

    const expense = await createTransaction(
      {
        accountId: account.id,
        categoryId: expenseCategory.id,
        type: "expense",
        status: "posted",
        amountCents: 20000,
        transactionDate: "2026-07-10",
        competenceMonth: "2026-07",
        description: "Viagem",
        fundingSource: "investments",
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 20000 }],
      },
      db
    );

    await updateTransaction(
      {
        id: expense.id,
        description: "Viagem paga",
        amountCents: 30000,
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 30000 }],
      },
      db
    );
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(50000);
    expect((await getAccountDetails(account.id, db)).currentBalanceCents).toBe(100000);

    await updateTransaction({ id: expense.id, fundingSource: "account" }, db);
    expect((await db.query.transactionFundingLinks.findMany())).toHaveLength(0);
    expect((await listTransactions({}, db))).toHaveLength(1);
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(80000);
    expect((await getAccountDetails(account.id, db)).currentBalanceCents).toBe(70000);

    await updateTransaction(
      {
        id: expense.id,
        fundingSource: "investments",
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 30000 }],
      },
      db
    );
    expect((await listTransactions({}, db))).toHaveLength(2);
    expect((await getAccountDetails(account.id, db)).currentBalanceCents).toBe(100000);

    const withdrawal = (await listTransactions({}, db)).find(
      (row) => row.type === "investment_withdrawal"
    );
    await expect(updateTransaction({ id: withdrawal!.id, description: "Tentativa" }, db)).rejects.toMatchObject({
      code: "MANAGED_TRANSACTION",
    });

    await deleteTransaction(expense.id, db);
    expect(await listTransactions({}, db)).toHaveLength(0);
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(80000);
    expect((await getAccountDetails(account.id, db)).currentBalanceCents).toBe(100000);
  });

  it("keeps a pending investment-funded pair untouched until it becomes effective", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Conta futura", type: "savings", initialBalanceCents: 100000 },
      db
    );
    const expenseCategory = await createCategory({ name: "Curso", group: "fixed_expense" }, db);
    const holding = await createInvestmentHolding(
      {
        name: "Tesouro",
        assetClass: "fixed_income",
        instrumentType: "treasury",
        currentValueCents: 80000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Futuro" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 80000,
        allocatedOn: "2026-07-16",
      },
      db
    );
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 80000,
        expectedMonthlyRateBps: 0,
        checkpointDate: "2026-07-01",
      },
      db
    );

    const expense = await createTransaction(
      {
        accountId: account.id,
        categoryId: expenseCategory.id,
        type: "expense",
        status: "pending",
        amountCents: 15000,
        transactionDate: "2026-07-20",
        competenceMonth: "2026-07",
        description: "Curso futuro",
        fundingSource: "investments",
      },
      db
    );
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(80000);

    await updateTransaction(
      {
        id: expense.id,
        status: "posted",
        transactionDate: "2026-07-16",
        sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 15000 }],
      },
      db
    );
    expect((await getInvestmentPortfolioDashboard(db)).holdings[0]?.currentValueCents).toBe(65000);
    expect((await getAccountDetails(account.id, db)).currentBalanceCents).toBe(100000);
  });
});
