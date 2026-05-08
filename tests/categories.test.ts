import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory, deleteCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("categories", () => {
  it("prevents deleting categories that are already in use", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Housing", group: "fixed_expense" }, db);

    await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 10000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-10",
        description: "Rent",
      },
      db
    );

    await expect(deleteCategory(category.id, db)).rejects.toThrow(/cannot be deleted/i);
  });

  it("prevents deleting categories that are already in use by credit card purchases", async () => {
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
    const category = await createCategory({ name: "Flights", group: "variable_expense" }, db);

    await createCreditCardCharge(
      {
        accountId: card.id,
        categoryId: category.id,
        description: "Trip",
        purchaseDate: "2026-05-03",
        totalAmountCents: 50000,
        installmentCount: 2,
      },
      db
    );

    await expect(deleteCategory(category.id, db)).rejects.toThrow(/cannot be deleted/i);
  });
});
