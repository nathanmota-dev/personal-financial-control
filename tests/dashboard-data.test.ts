import { getReport } from "@/lib/server/reports";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { transactions, transfers } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getDashboardData, getMonthlyDashboard, getCategorySpendingReport, getMonthlyExpenseFeed } from "@/lib/server/dashboard";
import { configureInvestmentPortfolio } from "@/lib/server/investments";
import { createOperationalInvestmentAsset, updateManualInvestmentBalance, getInvestmentOverview } from "@/lib/server/investment-operations";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(cleanups.splice(0).map((cleanup) => cleanup())); });

async function setup() {
  const database = await createTestDatabase();
  cleanups.push(database.cleanup);
  const account = await createAccount({ name: "Main", type: "checking", initialBalanceCents: 100000 }, database.db);
  const card = await createAccount({ name: "Card", type: "credit", initialBalanceCents: 0, creditClosingDay: 4, creditDueDay: 10 }, database.db);
  const fixed = await createCategory({ name: "Rent", group: "fixed_expense" }, database.db);
  const variable = await createCategory({ name: "Food", group: "variable_expense" }, database.db);
  const refunds = await createCategory({ name: "Refunds", group: "variable_expense" }, database.db);
  return { ...database, account, card, fixed, variable, refunds };
}

describe("consolidated dashboard data", () => {
  it("reconciles pending entries, legacy purchases, installments, uncategorized expenses and credits without counting bill payments twice", async () => {
    const { db, account, card, fixed, variable, refunds } = await setup();
    const common = { accountId: account.id, competenceMonth: "2026-01", transactionDate: "2026-01-31", status: "posted" as const };
    await db.insert(transactions).values([
      { ...common, type: "income", amountCents: 200000, description: "Salary" },
      { ...common, competenceMonth: "2025-12", type: "income", amountCents: 100000, description: "December" },
      { ...common, type: "income", amountCents: 1000000, status: "cancelled", description: "Cancelled" },
      { ...common, categoryId: fixed.id, type: "expense", amountCents: 50000, status: "pending", description: "Rent" },
      { ...common, categoryId: variable.id, type: "expense", amountCents: 10000, description: "Food" },
      { ...common, type: "expense", amountCents: 5000, description: "Unknown" },
      { ...common, accountId: card.id, categoryId: variable.id, type: "expense", amountCents: 1000, description: "Legacy" },
      { ...common, type: "expense", amountCents: 999999, status: "cancelled", description: "Ignored" },
      { ...common, categoryId: variable.id, type: "expense", amountCents: 1000, description: "Tie B", id: "00000000-0000-4000-8000-000000000002" },
      { ...common, categoryId: variable.id, type: "expense", amountCents: 1000, description: "Tie A", id: "00000000-0000-4000-8000-000000000001" },
    ]);
    await createCreditCardCharge({ accountId: card.id, categoryId: variable.id, description: "Installment", totalAmountCents: 60000, installmentCount: 3, purchaseDate: "2025-12-01", firstInvoiceMonth: "2026-01" }, db);
    await createCreditCardCharge({ accountId: card.id, categoryId: refunds.id, description: "Refund", totalAmountCents: -3000, kind: "adjustment", installmentCount: 1, purchaseDate: "2026-01-02" }, db);
    await upsertCreditCardBill({ accountId: card.id, invoiceMonth: "2026-01", dueDate: "2026-01-10", statementTotalCents: 32000, currentChargesTotalCents: 18000 }, db);
    await createCreditCardBillPayment({ accountId: card.id, invoiceMonth: "2026-01", paymentAccountId: account.id, amountCents: 10000, paymentDate: "2026-01-10", idempotencyKey: "test-bill", description: "Any description" }, db);
    const data = await getDashboardData("2026-01", db);
    const monthlyReport = await getReport({ mode: "monthly", period: "2026-01" }, db, "2026-02-01");
    for (const [key, value] of Object.entries(data.dashboard.totals)) expect(monthlyReport.totals[key as keyof typeof data.dashboard.totals]).toBe(value);
    expect(monthlyReport.entries.some((row) => row.description === "Cancelled")).toBe(false);
    expect(monthlyReport.entries.some((row) => row.description === "Any description")).toBe(false);
    expect(monthlyReport.entries.find((row) => row.description === "Refund")).toMatchObject({ source: "installment", amountCents: -3000 });
    expect(monthlyReport.pending.count).toBe(1);
    const annualReport = await getReport({ mode: "annual", period: "2026" }, db, "2026-02-01");
    expect(annualReport.totals.expenseCents).toBe(105000);
    const totalExpenses = data.categorySpending.reduce((sum, row) => sum + row.amountCents, 0);
    expect(data.dashboard.totals).toMatchObject({ incomeCents: 200000, fixedExpenseCents: 50000, variableExpenseCents: 30000, uncategorizedExpenseCents: 5000, netResultCents: 115000 });
    expect(totalExpenses).toBe(85000);
    expect(data.categorySpending).toContainEqual({ categoryId: "uncategorized", categoryName: "Sem categoria", amountCents: 5000 });
    expect(data.categorySpending.find((row) => row.categoryId === refunds.id)?.amountCents).toBe(-3000);
    expect(data.previous.competenceMonth).toBe("2025-12");
    expect(data.comparisons.incomeCents).toMatchObject({ percentage: 100, direction: "up", tone: "positive" });
    expect(data.evolution).toHaveLength(6);
    expect(data.evolution.at(-1)?.totals).toEqual(data.dashboard.totals);
    expect(data.chartSummary.averageIncomeCents).toBe(50000);
    expect(data.expenses.map((row) => row.description)).toEqual(["Rent", "Installment", "Food", "Unknown", "Legacy"]);
    expect(data.dashboard.accountBalances.find((row) => row.id === account.id)).toMatchObject({ currentBalanceCents: 373000, metricLabel: "Saldo atual" });
    expect(data.dashboard.accountBalances.find((row) => row.id === card.id)).toMatchObject({ currentBalanceCents: 32000, metricLabel: "Fatura de janeiro de 2026" });
    expect((await getMonthlyDashboard("2026-01", db)).totals).toEqual(data.dashboard.totals);
    expect((await getCategorySpendingReport("2026-01", db)).some((row) => row.categoryName === "Sem categoria")).toBe(false);
    expect((await getMonthlyExpenseFeed("2026-01", db)).some((row) => row.description === "Any description")).toBe(false);
    await db.update(transactions).set({ amountCents: 6000 }).where(eq(transactions.description, "Unknown"));
    expect((await getDashboardData("2026-01", db)).dashboard.totals.netResultCents).toBe(114000);
    expect((await getDashboardData("2026-02", db)).dashboard.accountBalances.find((row) => row.id === card.id)?.currentBalanceCents).toBe(20000);
  });
  it("loads the monthly records and current accounts in batches and sorts ties deterministically", async () => {
    const { db, account } = await setup();
    await db.insert(transactions).values(Array.from({ length: 7 }, (_, index) => ({
      id: `00000000-0000-4000-8000-00000000000${index}`, accountId: account.id, type: "expense" as const,
      amountCents: 100, status: "posted" as const, competenceMonth: "2026-01", transactionDate: "2026-01-01", description: "Same",
    })));
    const transactionQuery = vi.fn(db.query.transactions.findMany);
    const installmentQuery = vi.fn(db.query.creditCardInstallments.findMany);
    const accountQuery = vi.fn(db.query.accounts.findMany);
    const paymentQuery = vi.fn(db.query.creditCardBillPayments.findMany);
    const query = { ...db.query,
      transactions: { ...db.query.transactions, findMany: transactionQuery },
      creditCardInstallments: { ...db.query.creditCardInstallments, findMany: installmentQuery },
      accounts: { ...db.query.accounts, findMany: accountQuery },
      creditCardBillPayments: { ...db.query.creditCardBillPayments, findMany: paymentQuery },
    };
    const observed = new Proxy(db, { get(target, key) { return key === "query" ? query : Reflect.get(target, key); } });
    const data = await getDashboardData("2026-01", observed);
    expect(transactionQuery).toHaveBeenCalledTimes(2); // One six-month batch and one all-time posted ledger.
    expect(installmentQuery).toHaveBeenCalledOnce();
    expect(accountQuery).toHaveBeenCalledOnce();
    expect(paymentQuery).toHaveBeenCalledOnce();
    expect(data.expenses.map((row) => row.id)).toEqual(Array.from({ length: 5 }, (_, index) => `00000000-0000-4000-8000-00000000000${index}`));
    expect(data.comparisons.netResultCents).toMatchObject({ tone: "neutral", description: "Sem movimentações no mês anterior" });
  });
  it("keeps the reserve and long-term portfolio at their current position regardless of competence", async () => {
    const { db, account } = await setup();
    await configureInvestmentPortfolio({ checkpointBalanceCents: 200000, checkpointDate: "2026-01-01", expectedMonthlyRateBps: 0 }, db);
    const asset = await createOperationalInvestmentAsset({ name: "CDB", assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "manual_balance" }, db);
    await updateManualInvestmentBalance({ holdingId: asset.id, currentValueCents: 75000, valueAsOf: "2026-01-02" }, db);
    const other = await createAccount({ name: "Savings", type: "savings", initialBalanceCents: 0 }, db);
    await db.insert(transfers).values({ fromAccountId: account.id, toAccountId: other.id, amountCents: 15000, transferDate: "2026-02-01", competenceMonth: "2026-02", description: "Move" });
    const data = await getDashboardData("2025-12", db);
    expect(data.investmentOverview).toEqual(await getInvestmentOverview(db));
    expect(data.investmentOverview).toMatchObject({ totalCents: 275000, reserve: { amountCents: 200000 }, portfolioCents: 75000 });
    expect(data.dashboard.accountBalances.find((row) => row.id === account.id)?.currentBalanceCents).toBe(85000);
    expect(data.dashboard.accountBalances.find((row) => row.id === other.id)?.currentBalanceCents).toBe(15000);
    expect(data.dashboard.totals.incomeCents).toBe(0);
  });
  it("returns real empty states and propagates a failed database read", async () => {
    const { db, account } = await setup();
    const data = await getDashboardData("2026-01", db);
    expect(data.expenses).toEqual([]);
    expect(data.categorySpending).toEqual([]);
    expect(data.chartSummary).toMatchObject({ accumulatedCents: 0, resultLabel: "neutro" });
    await db.insert(transactions).values({ accountId: account.id, type: "investment_withdrawal", amountCents: 500, status: "pending", competenceMonth: "2026-01", transactionDate: "2026-01-01", description: "Pending withdrawal" });
    expect((await getDashboardData("2026-01", db)).dashboard.totals.netInvestmentFlowCents).toBe(-500);
    const broken = new Proxy(db, { get(target, key) {
      return key === "query" ? { ...db.query, transactions: { findMany: vi.fn().mockRejectedValue(new Error("query failed")) } } : Reflect.get(target, key);
    } });
    await expect(getDashboardData("2026-01", broken)).rejects.toThrow("query failed");
    await expect(getDashboardData("bad", db)).rejects.toMatchObject({ code: "INVALID_COMPETENCE" });
  });
});
