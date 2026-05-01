import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createTransaction, listTransactions } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
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
});
