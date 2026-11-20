import { afterEach, describe, expect, it } from "vitest";

import { transactionFundingLinks } from "@/lib/db/schema";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { DomainError } from "@/lib/server/errors";
import { getPredictability, parsePredictabilityReference } from "@/lib/server/predictability";
import { createRecurringTemplate } from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { createTransfer } from "@/lib/server/transfers";
import { createTestDatabase } from "@/tests/helpers/database";
import {
  createBaseProjectionCategories,
  createProjectionAccount,
  createProjectionCreditAccount,
} from "@/tests/helpers/projected-balance";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

async function setup() {
  const { db, cleanup } = await createTestDatabase();
  cleanups.push(cleanup);
  const checking = await createProjectionAccount(db);
  const savings = await createProjectionAccount(db, { name: "Savings", type: "savings" });
  const card = await createProjectionCreditAccount(db);
  const categories = await createBaseProjectionCategories(db);
  return { db, checking, savings, card, ...categories };
}

describe("predictability data", () => {
  it("builds the cycle budget from recurring income, fixed bills and the invoice due in the cycle", async () => {
    const { db, checking, card, salary, housing, groceries, brokerage } = await setup();
    const rent = await createRecurringTemplate(
      { accountId: checking.id, categoryId: housing.id, type: "expense", amountCents: 150000, dayOfMonth: 10, startMonth: "2026-07", description: "Aluguel" },
      db
    );
    await createRecurringTemplate(
      { accountId: checking.id, categoryId: salary.id, type: "income", amountCents: 500000, dayOfMonth: 5, startMonth: "2026-07", description: "Salário" },
      db
    );
    await createRecurringTemplate(
      { accountId: checking.id, categoryId: salary.id, type: "income", amountCents: 20000, dayOfMonth: 20, startMonth: "2026-07", description: "Freela" },
      db
    );
    await createRecurringTemplate(
      { accountId: checking.id, categoryId: brokerage.id, type: "investment_contribution", amountCents: 50000, dayOfMonth: 6, startMonth: "2026-07", description: "Aporte" },
      db
    );
    await createRecurringTemplate(
      { accountId: card.id, categoryId: groceries.id, type: "expense", amountCents: 4000, dayOfMonth: 8, startMonth: "2026-07", description: "Streaming no cartão" },
      db
    );
    await createCreditCardCharge(
      { accountId: card.id, categoryId: groceries.id, description: "Compra no cartão", purchaseDate: "2026-07-03", totalAmountCents: 80000, installmentCount: 1 },
      db
    );
    // The materialized rent keeps the registered value and never counts as a daily expense.
    await createTransaction(
      { accountId: checking.id, categoryId: housing.id, recurringTemplateId: rent.id, type: "expense", status: "posted", amountCents: 155000, transactionDate: "2026-07-10", competenceMonth: "2026-07", description: "Aluguel" },
      db
    );

    const result = await getPredictability({ today: "2026-07-15" }, db);

    expect(result.cycle).toMatchObject({ start: "2026-07-05", end: "2026-08-04", dayCount: 31, anchorDay: 5 });
    expect(result.summary).toMatchObject({
      incomeCents: 520000,
      fixedCents: 200000,
      creditCardCents: 80000,
      budgetCents: 240000,
      spentCents: 0,
      remainingCents: 240000,
    });
    expect(result.budgetItems.map((item) => [item.kind, item.description])).toEqual([
      ["income", "Salário"],
      ["fixed", "Aporte"],
      ["fixed", "Aluguel"],
      ["credit_card", "Fatura Card 2026-07"],
      ["income", "Freela"],
    ]);
    expect(result.budgetItems[0].accountName).toBe("Main");
    expect(result.days.find((day) => day.isToday)?.date).toBe("2026-07-15");
  });

  it("only counts one-off debit, Pix and cash entries as daily spending", async () => {
    const { db, checking, savings, card, salary, groceries, brokerage } = await setup();
    await createRecurringTemplate(
      { accountId: checking.id, categoryId: salary.id, type: "income", amountCents: 310000, dayOfMonth: 1, startMonth: "2026-07", description: "Salário" },
      db
    );
    const entry = (description: string, amountCents: number, transactionDate: string, overrides = {}) =>
      createTransaction(
        { accountId: checking.id, categoryId: groceries.id, type: "expense", status: "posted", amountCents, transactionDate, competenceMonth: transactionDate.slice(0, 7), description, ...overrides },
        db
      );
    await entry("Tênis", 30000, "2026-07-01");
    await entry("Agendado", 5000, "2026-07-20", { status: "pending" });
    await entry("Aporte avulso", 7000, "2026-07-31", { type: "investment_contribution", categoryId: brokerage.id });
    await entry("Cancelado", 9000, "2026-07-02", { status: "cancelled" });
    await entry("Fora do ciclo", 9000, "2026-08-01");
    await entry("Receita avulsa", 9000, "2026-07-02", { type: "income", categoryId: salary.id });
    await entry("Compra antiga no cartão", 9000, "2026-07-02", { accountId: card.id });
    const funded = await entry("Pago pela reserva", 9000, "2026-07-02", { accountId: savings.id });
    const withdrawal = await entry("Resgate", 9000, "2026-07-02", { accountId: savings.id, type: "investment_withdrawal", categoryId: brokerage.id });
    await db.insert(transactionFundingLinks).values({
      expenseTransactionId: funded.id,
      withdrawalTransactionId: withdrawal.id,
      type: "investment_funded_expense",
    });
    await upsertCreditCardBill(
      { accountId: card.id, invoiceMonth: "2026-07", dueDate: "2026-07-10", statementTotalCents: 12000, currentChargesTotalCents: 12000 },
      db
    );
    await createCreditCardBillPayment(
      { accountId: card.id, invoiceMonth: "2026-07", paymentAccountId: checking.id, amountCents: 12000, paymentDate: "2026-07-10", idempotencyKey: "predictability-bill" },
      db
    );
    await createTransfer(
      { fromAccountId: checking.id, toAccountId: savings.id, amountCents: 20000, transferDate: "2026-07-03", competenceMonth: "2026-07", description: "Guardar" },
      db
    );

    const result = await getPredictability({ today: "2026-07-02", reference: "2026-07-15" }, db);

    expect(result.cycle).toMatchObject({ start: "2026-07-01", end: "2026-07-31", dayCount: 31 });
    expect(result.days.flatMap((day) => day.expenses.map((expense) => expense.description))).toEqual([
      "Tênis",
      "Agendado",
      "Aporte avulso",
    ]);
    // The old card purchase reaches the budget through its invoice, never as a daily expense.
    expect(result.summary).toMatchObject({ creditCardCents: 9000, budgetCents: 301000, spentCents: 42000, remainingCents: 259000 });
    expect(result.days[0].allowanceCents).toBe(9710);
    expect(result.days.slice(0, 5).map((day) => day.status)).toEqual(["consumed", "consumed", "consumed", "partial", "free"]);
    expect(result.days[0].expenses[0]).toMatchObject({ accountName: "Main", categoryName: "Groceries" });
  });

  it("uses the calendar month and warns when there is no recurring income", async () => {
    const { db } = await setup();
    const result = await getPredictability({ today: "2026-07-15" }, db);
    expect(result.cycle).toMatchObject({ start: "2026-07-01", end: "2026-07-31", anchorDay: null });
    expect(result.summary.alerts).toEqual([{ code: "NO_RECURRING_INCOME" }]);
  });

  it("parses the cycle reference from the URL", () => {
    expect(parsePredictabilityReference(undefined)).toBeUndefined();
    expect(parsePredictabilityReference(["2026-07-01"])).toBeUndefined();
    expect(parsePredictabilityReference("")).toBeUndefined();
    expect(parsePredictabilityReference("2026-07-01")).toBe("2026-07-01");
    expect(() => parsePredictabilityReference("julho")).toThrow(DomainError);
  });
});
