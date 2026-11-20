import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { saveBudget } from "@/lib/server/budgets";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getSpendingCapacity, spendingCapacityInputSchema } from "@/lib/server/spending-capacity";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

vi.mock("@/lib/server/runtime", () => ({ getFinanceToday: () => "2026-03-10", getFinanceDefaultMonth: () => "2026-03" }));

let database: Awaited<ReturnType<typeof createTestDatabase>>;
const db = () => database.db;

beforeEach(async () => { database = await createTestDatabase(); });
afterEach(async () => { await database.cleanup(); });

describe("getSpendingCapacity", () => {
  it("combines the projection, the budget and the open invoices", async () => {
    const checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 100_000 }, db())).id;
    await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 25, creditDueDay: 5 }, db());
    const salary = (await createCategory({ name: "Salário", group: "income" }, db())).id;
    const market = (await createCategory({ name: "Mercado", group: "variable_expense" }, db())).id;
    await createTransaction({ accountId: checking, categoryId: salary, type: "income", status: "pending", amountCents: 300_000, transactionDate: "2026-03-20", competenceMonth: "2026-03", description: "Salário" }, db());
    await createTransaction({ accountId: checking, categoryId: market, type: "expense", status: "posted", amountCents: 12_000, transactionDate: "2026-03-05", competenceMonth: "2026-03", description: "Feira" }, db());
    await saveBudget({ categoryId: market, competenceMonth: "2026-03", amountCents: 10_000 }, db());

    const capacity = await getSpendingCapacity({}, db());

    expect(capacity.today).toBe("2026-03-10");
    expect(capacity.month).toBe("2026-03");
    expect(capacity.projection.nextIncomeDate).toBe("2026-03-20");
    expect(capacity.projection.balanceNowCents).toBe(88_000);
    expect(capacity.projection.status).toBe("safe");
    expect(capacity.budget).toMatchObject({ limitTotalCents: 10_000, committedCents: 12_000 });
    expect(capacity.budget.overBudget).toEqual([{ categoryName: "Mercado", limitCents: 10_000, committedCents: 12_000 }]);
    expect(capacity.invoices.totalOpenCents).toBe(0);
  });

  it("rejects an invalid month in the tool input", () => {
    expect(spendingCapacityInputSchema.safeParse({ competenceMonth: "2026-13" }).success).toBe(false);
    expect(spendingCapacityInputSchema.safeParse({ competenceMonth: "2026-03" }).success).toBe(true);
  });
});

describe("getSpendingCapacity invoices", () => {
  it("lists unpaid card invoices and leaves paid ones out", async () => {
    const card = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 25, creditDueDay: 5 }, db())).id;
    const market = (await createCategory({ name: "Mercado", group: "variable_expense" }, db())).id;
    await createCreditCardCharge({ accountId: card, categoryId: market, description: "Compra", purchaseDate: "2026-03-02", totalAmountCents: 8000, installmentCount: 1, kind: "purchase" }, db());
    await upsertCreditCardBill({ accountId: card, invoiceMonth: "2026-03", dueDate: "2026-04-05", statementTotalCents: 8000, currentChargesTotalCents: 8000 }, db());

    const capacity = await getSpendingCapacity({ competenceMonth: "2026-03", minimumReserveCents: 1000 }, db());
    expect(capacity.invoices.totalOpenCents).toBe(8000);
    expect(capacity.invoices.items[0]).toMatchObject({ accountName: "Cartão", dueDate: "2026-04-05" });
  });
});
