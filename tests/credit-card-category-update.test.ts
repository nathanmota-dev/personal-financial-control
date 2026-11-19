import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge, getCreditCardCharge, updateCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

let database: Database;
let card: string;
let checking: string;
let food: string;
let travel: string;

const db = () => database.db;
const installmentsOf = async (id: string) => (await getCreditCardCharge(id, db())).installments.map(({ id: rowId, amountCents, invoiceMonth }) => ({ rowId, amountCents, invoiceMonth }));

async function payBill(invoiceMonth: string, amountCents: number) {
  await upsertCreditCardBill({ accountId: card, invoiceMonth, dueDate: `${invoiceMonth}-10`, statementTotalCents: amountCents, currentChargesTotalCents: amountCents }, db());
  await createCreditCardBillPayment({ accountId: card, invoiceMonth, paymentAccountId: checking, amountCents, paymentDate: `${invoiceMonth}-10`, idempotencyKey: `paid:${invoiceMonth}` }, db());
}

beforeEach(async () => {
  database = await createTestDatabase();
  card = (await createAccount({ name: "Card", type: "credit", initialBalanceCents: 0, creditClosingDay: 25, creditDueDay: 10 }, db())).id;
  checking = (await createAccount({ name: "Checking", type: "checking", initialBalanceCents: 50000 }, db())).id;
  food = (await createCategory({ name: "Food", group: "variable_expense" }, db())).id;
  travel = (await createCategory({ name: "Travel", group: "variable_expense" }, db())).id;
});

afterEach(async () => {
  await database.cleanup();
});

describe("credit card category update", () => {
  it("recategorizes a purchase on a paid bill without touching its installments", async () => {
    const charge = await createCreditCardCharge({ accountId: card, categoryId: food, description: "Lunch", purchaseDate: "2026-05-03", totalAmountCents: 10000, installmentCount: 1 }, db());
    await payBill("2026-05", 10000);
    const before = await installmentsOf(charge.id);

    const updated = await updateCreditCardCharge({ id: charge.id, categoryId: travel }, db());

    expect(updated.categoryId).toBe(travel);
    expect(await installmentsOf(charge.id)).toEqual(before);
    await expect(updateCreditCardCharge({ id: charge.id, categoryId: food, description: "Dinner" }, db())).rejects.toMatchObject({ code: "CREDIT_CARD_CHARGE_BILL_PAID" });
  });

  it("treats a form resubmitting the same values with an empty note as a category-only change", async () => {
    const charge = await createCreditCardCharge({ accountId: card, categoryId: food, description: "Lunch", purchaseDate: "2026-05-03", totalAmountCents: 10000, installmentCount: 1 }, db());
    await payBill("2026-05", 10000);

    const updated = await updateCreditCardCharge({
      id: charge.id, accountId: card, categoryId: travel, description: "Lunch", notes: "", purchaseDate: "2026-05-03", totalAmountCents: 10000, installmentCount: 1, kind: "purchase",
    }, db());

    expect(updated.categoryId).toBe(travel);
  });

  it("keeps the bank's installment plan unless the schedule changes", async () => {
    const installmentPlan = [{ amountCents: 7000, invoiceMonth: "2026-06" }, { amountCents: 3000, invoiceMonth: "2026-08" }];
    const charge = await createCreditCardCharge({ accountId: card, categoryId: food, description: "Hotel", purchaseDate: "2026-05-28", totalAmountCents: 10000, installmentCount: 2, installmentPlan }, db());
    const before = await installmentsOf(charge.id);

    await updateCreditCardCharge({ id: charge.id, categoryId: travel, description: "Hotel trip", notes: "Booked" }, db());
    expect(await installmentsOf(charge.id)).toEqual(before);

    await updateCreditCardCharge({ id: charge.id, totalAmountCents: 12000 }, db());
    expect((await installmentsOf(charge.id)).map(({ amountCents, invoiceMonth }) => ({ amountCents, invoiceMonth }))).toEqual([
      { amountCents: 6000, invoiceMonth: "2026-06" },
      { amountCents: 6000, invoiceMonth: "2026-07" },
    ]);
  });
});
