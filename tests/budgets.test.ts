import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createDatabase } from "@/lib/db";
import { transactions, recurringTemplates, transfers } from "@/lib/db/schema";
import { migrateDatabase } from "@/lib/db/migrate";
import { aggregateBudgets } from "@/lib/budget-aggregation";
import { createAccount } from "@/lib/server/accounts";
import { archiveCategory, createCategory, deleteCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { copyPreviousBudgets, getBudgetOverview, removeBudget, saveBudget } from "@/lib/server/budgets";
import { getDashboardData } from "@/lib/server/dashboard";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(cleanups.splice(0).map((fn) => fn())); });
async function setup() {
  const database = await createTestDatabase(); cleanups.push(database.cleanup);
  const account = await createAccount({ name: "Bank", type: "checking", initialBalanceCents: 100000 }, database.db);
  const card = await createAccount({ name: "Card", type: "credit", initialBalanceCents: 0, creditClosingDay: 4, creditDueDay: 10 }, database.db);
  const category = await createCategory({ name: "Budget food", group: "variable_expense" }, database.db);
  const input = { categoryId: category.id, competenceMonth: "2026-01", amountCents: 80000 };
  return { ...database, account, card, category, input };
}
describe("monthly budgets", () => {
  it("accounts for competence, pending status, credit installments and bill payments and reconciles the dashboard", async () => {
    const { db, account, card, category, input } = await setup();
    await saveBudget(input, db);
    const base = { accountId: account.id, categoryId: category.id, type: "expense" as const, status: "posted" as const, transactionDate: "2026-01-02", competenceMonth: "2026-01" };
    await db.insert(transactions).values([
      { ...base, description: "Posted", amountCents: 20000 },
      { ...base, description: "Pending", status: "pending", amountCents: 10000 },
      { ...base, description: "Cancelled", status: "cancelled", amountCents: 99999 },
      { ...base, description: "Income", type: "income", amountCents: 99999 },
      { ...base, description: "Contribution", type: "investment_contribution", amountCents: 99999 },
      { ...base, description: "Withdrawal", type: "investment_withdrawal", amountCents: 99999 },
    ]);
    await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Installment", purchaseDate: "2025-12-01", firstInvoiceMonth: "2026-01", installmentCount: 2, totalAmountCents: 30000 }, db);
    let overview = await getBudgetOverview("2026-01", db);
    expect(overview.rows[0]).toMatchObject({ postedCents: 35000, pendingCents: 10000, committedCents: 45000, remainingCents: 35000, percent: 56.25, state: "below" });
    expect(overview.rows[0].expenses).toContainEqual(expect.objectContaining({ accountName: "Card", origin: "Parcela / ajuste de cartão" }));
    await upsertCreditCardBill({ accountId: card.id, invoiceMonth: "2026-01", dueDate: "2026-01-10", statementTotalCents: 15000, currentChargesTotalCents: 15000 }, db);
    await createCreditCardBillPayment({ accountId: card.id, invoiceMonth: "2026-01", paymentAccountId: account.id, amountCents: 15000, paymentDate: "2026-01-10", idempotencyKey: "budget-payment", description: "Bill" }, db);
    expect((await getBudgetOverview("2026-01", db)).committedCents).toBe(45000);
    await db.update(transactions).set({ status: "posted" }).where(eq(transactions.description, "Pending"));
    expect((await getBudgetOverview("2026-01", db)).rows[0]).toMatchObject({ postedCents: 45000, pendingCents: 0, committedCents: 45000 });
    await db.update(transactions).set({ status: "cancelled" }).where(eq(transactions.description, "Pending"));
    expect((await getBudgetOverview("2026-01", db)).committedCents).toBe(35000);
    await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Refund", purchaseDate: "2026-01-02", firstInvoiceMonth: "2026-01", installmentCount: 1, totalAmountCents: -5000, kind: "adjustment" }, db);
    expect((await getBudgetOverview("2026-01", db)).committedCents).toBe(30000);
    await db.insert(transactions).values({ ...base, categoryId: null, description: "Uncategorized", amountCents: 3000 });
    const other = await createCategory({ name: "No limit", group: "fixed_expense" }, db);
    await db.insert(transactions).values({ ...base, categoryId: other.id, description: "No limit", amountCents: 4000 });
    const [recurrence] = await db.insert(recurringTemplates).values({ accountId: account.id, categoryId: category.id, type: "expense", amountCents: 1000, dayOfMonth: 1, startMonth: "2026-01", description: "Template" }).returning();
    await db.insert(transactions).values({ ...base, recurringTemplateId: recurrence.id, description: "Generated", amountCents: 1000 });
    await db.insert(transfers).values({ fromAccountId: account.id, toAccountId: card.id, amountCents: 9000, transferDate: "2026-01-02", competenceMonth: "2026-01", description: "Transfer" });
    overview = await getBudgetOverview("2026-01", db);
    expect(overview.committedCents).toBe(38000);
    expect(overview.rows.find((row) => row.categoryId === null)?.limit).toBeNull();
    expect(overview.rows.find((row) => row.categoryId === other.id)?.limit).toBeNull();
    expect(overview.rows.find((row) => row.categoryId === category.id)?.expenses.filter((expense) => expense.origin === "Recorrência gerada")).toHaveLength(1);
    const dashboard = await getDashboardData("2026-01", db);
    expect(overview.committedCents).toBe(dashboard.categorySpending.reduce((sum, row) => sum + row.amountCents, 0));
    expect((await getBudgetOverview("2026-02", db)).rows[0]).toMatchObject({ limit: null, committedCents: 15000 });
    await db.update(transactions).set({ categoryId: other.id, amountCents: 2000 }).where(eq(transactions.description, "Generated"));
    expect((await getBudgetOverview("2026-01", db)).committedCents).toBe(39000);
    await db.delete(transactions).where(eq(transactions.description, "Generated"));
    expect((await getBudgetOverview("2026-01", db)).committedCents).toBe(37000);
  });
  it("persists encrypted positive integers, enforces uniqueness across independent connections and copies without overwriting", async () => {
    const { db, databaseUrl, input, category } = await setup();
    const concurrent = createDatabase(databaseUrl); cleanups.push(async () => { concurrent.$client.close(); });
    const attempts = await Promise.allSettled([saveBudget(input, db), saveBudget({ ...input, amountCents: 90000 }, concurrent)]);
    expect(attempts.some((attempt) => attempt.status === "fulfilled")).toBe(true);
    for (const attempt of attempts) if (attempt.status === "rejected") expect(attempt.reason.code).toBe("SQLITE_BUSY");
    expect(await db.query.monthlyBudgets.findMany()).toHaveLength(1);
    await saveBudget(input, db);
    const raw = await db.$client.execute("SELECT * FROM monthly_budgets");
    expect(raw.rows[0].amount_cents).toMatch(/^pfc:v2:/);
    expect(raw.rows[0].competence_month).toMatch(/^pfc:v2:/);
    expect(String(raw.rows[0].competence_month_hash)).toHaveLength(64);
    await expect(db.$client.execute({ sql: "INSERT INTO monthly_budgets SELECT 'duplicate', category_id, competence_month, amount_cents, competence_month_hash, created_at, updated_at FROM monthly_budgets", args: [] })).rejects.toThrow();
    await migrateDatabase(db.$client);
    expect(await copyPreviousBudgets("2026-02", db)).toBe(1);
    await saveBudget({ ...input, competenceMonth: "2026-02", amountCents: 70000 }, db);
    expect(await copyPreviousBudgets("2026-02", db)).toBe(0);
    expect((await getBudgetOverview("2026-02", db)).rows[0].limit?.amountCents).toBe(70000);
    expect((await getBudgetOverview("2026-01", db)).rows[0].limit?.amountCents).toBe(80000);
    await expect(deleteCategory(category.id, db)).rejects.toMatchObject({ code: "CATEGORY_IN_USE" });
    await archiveCategory(category.id, db);
    expect((await getBudgetOverview("2026-01", db)).rows[0].archived).toBe(true);
    expect((await getBudgetOverview("2026-01", db)).categories.some((item) => item.id === category.id)).toBe(false);
    expect(await copyPreviousBudgets("2026-03", db)).toBe(0);
    await expect(saveBudget({ ...input, competenceMonth: "2026-03" }, db)).rejects.toMatchObject({ code: "ARCHIVED_CATEGORY" });
    await saveBudget({ ...input, amountCents: 85000 }, db);
    await removeBudget(input, db); await removeBudget(input, db);
    expect((await getBudgetOverview("2026-01", db)).rows).toEqual([]);
    expect((await getBudgetOverview("2026-02", db)).rows).toHaveLength(1);
  });
  it("rejects malformed values, months and incompatible categories and propagates read errors", async () => {
    const { db, input } = await setup();
    for (const amountCents of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "100"])
      await expect(saveBudget({ ...input, amountCents } as typeof input, db)).rejects.toThrow();
    for (const month of ["bad", "2026-13", "2026-00"]) {
      await expect(copyPreviousBudgets(month, db)).rejects.toThrow();
      await expect(getBudgetOverview(month, db)).rejects.toThrow();
      await expect(removeBudget({ ...input, competenceMonth: month }, db)).rejects.toThrow();
    }
    const income = await createCategory({ name: "Budget income", group: "income" }, db);
    await expect(saveBudget({ ...input, categoryId: income.id }, db)).rejects.toMatchObject({ code: "INVALID_CATEGORY" });
    await expect(saveBudget({ ...input, categoryId: crypto.randomUUID() }, db)).rejects.toMatchObject({ code: "CATEGORY_NOT_FOUND" });
    const broken = new Proxy(db, { get(target, property) { return property === "query" ? { ...db.query, monthlyBudgets: { findMany: vi.fn().mockRejectedValue(new Error("read failed")) } } : Reflect.get(target, property); } });
    await expect(getBudgetOverview("2026-01", broken)).rejects.toThrow("read failed");
    expect(await copyPreviousBudgets("2026-01", db)).toBe(0);
  });
  it("handles thresholds and net credits without assigning zero budgets to unbounded categories", () => {
    const categoryId = crypto.randomUUID();
    for (const [amount, state] of [[799, "below"], [800, "warning"], [999, "warning"], [1000, "reached"], [1200, "reached"], [-50, "below"]] as const) {
      const [row] = aggregateBudgets([], [{ id: "limit", categoryId, competenceMonth: "2026-01", amountCents: 1000 }], [{ id: "expense", categoryId, categoryName: "Food", accountName: "Card", amountCents: amount, date: "2026-01-01", description: "Expense", pending: false, origin: "Card" }]);
      expect(row.state).toBe(state); expect(row.remainingCents).toBe(1000 - amount);
    }
    expect(aggregateBudgets([], [], [])).toEqual([]);
  });
});
