import { afterEach, describe, expect, it } from "vitest";
import { creditCardBillPayments, transactions, transfers } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createRecurringTemplate, generateRecurringTransactions } from "@/lib/server/recurring";
import { getDailyExpenseMap } from "@/lib/server/daily-expenses";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { await Promise.all(cleanups.splice(0).map((cleanup) => cleanup())); });

describe("monthly daily expense data", () => {
  it("uses purchase dates and posted expenses once while excluding pending, cancelled, payments and transfers", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const checking = await createAccount({ name: "Principal", type: "checking", initialBalanceCents: 0 }, db);
    const card = await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 }, db);
    const category = await createCategory({ name: "Alimentação", group: "variable_expense" }, db);
    const common = { accountId: checking.id, categoryId: category.id, competenceMonth: "2026-06", transactionDate: "2026-07-05" };
    await db.insert(transactions).values([
      { ...common, description: "Compra registrada", type: "expense", status: "posted", amountCents: 20000 },
      { ...common, description: "Pendente", type: "expense", status: "pending", amountCents: 80000 },
      { ...common, description: "Cancelada", type: "expense", status: "cancelled", amountCents: 90000 },
      { ...common, description: "Aporte", type: "investment_contribution", status: "posted", amountCents: 60000 },
      { ...common, accountId: card.id, description: "Cartão legado", type: "expense", status: "posted", amountCents: 8000 },
      { ...common, transactionDate: "2026-08-01", description: "Outro mês", type: "expense", status: "posted", amountCents: 70000 },
      { ...common, transactionDate: "2026-07-14", description: "Pagamento de fatura", type: "expense", status: "posted", amountCents: 10000 },
    ]);
    const payment = await db.query.transactions.findFirst({ where: (table, { eq }) => eq(table.description, "Pagamento de fatura") });
    if (!payment) throw new Error("Expected bill payment transaction");
    await db.insert(creditCardBillPayments).values({ transactionId: payment.id, paymentDate: "2026-07-14", amountCents: 10000, kind: "settlement", idempotencyKey: "daily-expense-payment" });
    await db.insert(transfers).values({ fromAccountId: checking.id, toAccountId: card.id, amountCents: 100000, transferDate: "2026-07-14", competenceMonth: "2026-07", description: "Transferência" });

    await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Compra parcelada", purchaseDate: "2026-07-22", totalAmountCents: 90000, installmentCount: 3, firstInvoiceMonth: "2026-08" }, db);
    await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Estorno", purchaseDate: "2026-07-22", totalAmountCents: -5000, kind: "adjustment", installmentCount: 1, firstInvoiceMonth: "2026-08" }, db);
    await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Compra de agosto", purchaseDate: "2026-08-01", totalAmountCents: 50000, installmentCount: 1, firstInvoiceMonth: "2026-08" }, db);
    await createRecurringTemplate({ accountId: checking.id, categoryId: category.id, type: "expense", amountCents: 12000, dayOfMonth: 23, startMonth: "2026-07", endMonth: "2026-07", description: "Recorrência gerada" }, db);
    await createRecurringTemplate({ accountId: checking.id, categoryId: category.id, type: "expense", amountCents: 99000, dayOfMonth: 24, startMonth: "2026-08", description: "Recorrência ainda não gerada" }, db);
    await generateRecurringTransactions("2026-07", db);

    const map = await getDailyExpenseMap("2026-07", db);
    expect(map).toMatchObject({ period: "2026-07", expenseCents: 130000, creditCents: 5000, netCents: 125000 });
    expect(map.entries).toHaveLength(5);
    expect(map.entries.map(({ description }) => description)).toContain("Cartão legado");
    expect(map.entries.map(({ description }) => description)).toContain("Recorrência gerada");
    expect(map.entries.map(({ description }) => description)).not.toEqual(expect.arrayContaining([
      "Pendente", "Cancelada", "Aporte", "Pagamento de fatura", "Compra de agosto", "Recorrência ainda não gerada",
    ]));
    expect(map.entries.find(({ description }) => description === "Compra parcelada")).toMatchObject({ amountCents: 90000, date: "2026-07-22", direction: "expense", source: "credit_card_charge", sourceHref: "/credit-card?month=2026-08" });
    expect(map.entries.find(({ description }) => description === "Estorno")).toMatchObject({ amountCents: 5000, date: "2026-07-22", direction: "credit" });
    expect(map.days.find(({ date }) => date === "2026-07-22")).toMatchObject({ expenseCents: 90000, creditCents: 5000, netCents: 85000, intensity: 4 });
    expect(map.entries.find(({ description }) => description === "Compra registrada")?.sourceHref).toBe("/transactions?month=2026-06");
  });
});
