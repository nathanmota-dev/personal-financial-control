import { afterEach, describe, expect, it } from "vitest";

import { createAccount, getAccountDetails } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  createCreditCardCharge,
  deleteCreditCardCharge,
  getCreditCardCharge,
  getCreditCardOverview,
  updateCreditCardCharge,
} from "@/lib/server/credit-card";
import {
  createCreditCardBillPayment,
  getCreditCardBill,
  upsertCreditCardBill,
} from "@/lib/server/credit-card-bills";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("credit card", () => {
  it("creates installments using the closing day and preserves cent totals", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const card = await createAccount(
      {
        name: "Card",
        type: "credit",
        initialBalanceCents: 0,
        creditClosingDay: 4,
        creditDueDay: 10,
      },
      db
    );
    const category = await createCategory({ name: "Electronics", group: "variable_expense" }, db);

    const charge = await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: category.id,
        description: "Headphones",
        purchaseDate: "2026-05-05",
        totalAmountCents: 1000,
        installmentCount: 3,
      },
      db
    );

    expect(charge.firstInvoiceMonth).toBe("2026-06");
    expect(charge.installments.map((installment) => installment.amountCents)).toEqual([334, 333, 333]);
    expect(charge.installments.map((installment) => installment.invoiceMonth)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(
      charge.installments.reduce((total, installment) => total + installment.amountCents, 0)
    ).toBe(1000);
  });

  it("builds the monthly overview with invoice entries, category totals, and future installments", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const card = await createAccount(
      {
        name: "Card",
        type: "credit",
        initialBalanceCents: 0,
        creditClosingDay: 4,
        creditDueDay: 10,
      },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);
    const housing = await createCategory({ name: "Housing", group: "fixed_expense" }, db);
    const groceries = await createCategory({ name: "Groceries", group: "variable_expense" }, db);
    const transport = await createCategory({ name: "Transport", group: "variable_expense" }, db);
    const investment = await createCategory({ name: "Brokerage", group: "investment" }, db);

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: salary.id,
        type: "income",
        amountCents: 500000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-01",
        description: "Salary",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: housing.id,
        type: "expense",
        amountCents: 100000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-02",
        description: "Rent",
      },
      db
    );
    await createTransaction(
      {
        accountId: checking.id,
        categoryId: investment.id,
        type: "investment_contribution",
        amountCents: 50000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-03",
        description: "Invest",
      },
      db
    );
    await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: groceries.id,
        description: "Supermarket",
        purchaseDate: "2026-05-03",
        totalAmountCents: 120000,
        installmentCount: 2,
      },
      db
    );
    await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: transport.id,
        description: "Airline tickets",
        purchaseDate: "2026-05-05",
        totalAmountCents: 90000,
        installmentCount: 3,
      },
      db
    );
    await createTransaction(
      {
        accountId: card.id,
        categoryId: transport.id,
        type: "expense",
        amountCents: 45000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-02",
        description: "Legacy fuel",
      },
      db
    );

    const overview = await getCreditCardOverview("2026-05", db);

    expect(overview.state).toBe("ready");
    if (overview.state !== "ready") {
      return;
    }

    expect(overview.invoice.totalAmountCents).toBe(105000);
    expect(overview.invoice.purchaseCount).toBe(2);
    expect(overview.budgetSummary.availableForInvoiceCents).toBe(350000);
    expect(overview.budgetSummary.remainingAfterInvoiceCents).toBe(245000);
    expect(overview.invoice.categoryTotals.map((item) => [item.categoryName, item.amountCents])).toEqual([
      ["Groceries", 60000],
      ["Transport", 45000],
    ]);
    expect(overview.invoice.futureInstallments).toHaveLength(2);
    expect(overview.invoice.futureInstallments[0]?.installments[0]?.invoiceMonth).toBe("2026-06");
  });

  it("supports idempotent creation, update, and deletion of purchases", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const card = await createAccount(
      {
        name: "CRUD Card",
        type: "credit",
        initialBalanceCents: 0,
        creditClosingDay: 4,
        creditDueDay: 10,
      },
      db
    );
    const category = await createCategory({ name: "CRUD Category", group: "variable_expense" }, db);

    const input = {
      accountId: card.id,
      categoryId: category.id,
      description: "Imported purchase",
      purchaseDate: "2026-05-05",
      totalAmountCents: 1000,
      installmentCount: 2,
      importFingerprint: "itau:crud:imported-purchase",
    };
    const created = await createCreditCardCharge(input, db);
    const repeated = await createCreditCardCharge(input, db);

    expect(repeated.id).toBe(created.id);
    expect((await getCreditCardCharge(created.id, db)).installments).toHaveLength(2);

    const updated = await updateCreditCardCharge(
      {
        id: created.id,
        totalAmountCents: 1500,
        installmentCount: 3,
        description: "Updated purchase",
      },
      db
    );

    expect(updated.description).toBe("Updated purchase");
    expect(updated.installments).toHaveLength(3);
    expect(updated.installments.reduce((total, item) => total + item.amountCents, 0)).toBe(1500);

    await deleteCreditCardCharge(created.id, db);
    await expect(getCreditCardCharge(created.id, db)).rejects.toMatchObject({
      code: "CREDIT_CARD_CHARGE_NOT_FOUND",
    });
  });

  it("registers a payment, marks the bill paid, and prevents duplicate payments", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const card = await createAccount(
      {
        name: "Paid Card",
        type: "credit",
        initialBalanceCents: 0,
        creditClosingDay: 4,
        creditDueDay: 10,
      },
      db
    );
    const checking = await createAccount(
      { name: "Payment Checking", type: "checking", initialBalanceCents: 20000 },
      db
    );
    const category = await createCategory({ name: "Paid Category", group: "variable_expense" }, db);

    const charge = await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: category.id,
        description: "Paid purchase",
        purchaseDate: "2026-05-03",
        totalAmountCents: 10000,
        installmentCount: 1,
      },
      db
    );
    await upsertCreditCardBill(
      {
        accountId: card.id,
        invoiceMonth: "2026-05",
        dueDate: "2026-05-10",
        statementTotalCents: 10000,
        currentChargesTotalCents: 10000,
      },
      db
    );

    const payment = await createCreditCardBillPayment(
      {
        accountId: card.id,
        invoiceMonth: "2026-05",
        paymentAccountId: checking.id,
        amountCents: 10000,
        paymentDate: "2026-05-10",
        idempotencyKey: "itau:2026-05:settlement",
      },
      db
    );
    const repeated = await createCreditCardBillPayment(
      {
        accountId: card.id,
        invoiceMonth: "2026-05",
        paymentAccountId: checking.id,
        amountCents: 10000,
        paymentDate: "2026-05-10",
        idempotencyKey: "itau:2026-05:settlement",
      },
      db
    );

    expect(payment.idempotent).toBe(false);
    expect(repeated.idempotent).toBe(true);
    expect((await getCreditCardBill(card.id, "2026-05", db))?.status).toBe("paid");
    expect((await getCreditCardBill(card.id, "2026-05", db))?.payments).toHaveLength(1);
    expect((await getAccountDetails(checking.id, db)).currentBalanceCents).toBe(10000);

    await expect(
      updateCreditCardCharge({ id: charge.id, description: "Cannot edit paid purchase" }, db)
    ).rejects.toMatchObject({ code: "CREDIT_CARD_CHARGE_BILL_PAID" });
    await expect(deleteCreditCardCharge(charge.id, db)).rejects.toMatchObject({
      code: "CREDIT_CARD_CHARGE_BILL_PAID",
    });
  });
});
