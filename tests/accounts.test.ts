import { afterEach, describe, expect, it } from "vitest";

import { createAccount, getAccountDetails, updateAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createTransaction } from "@/lib/server/transactions";
import { createTransfer } from "@/lib/server/transfers";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("accounts", () => {
  it("creates and updates accounts", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Wallet", type: "cash", initialBalanceCents: 10000 },
      db
    );

    const updated = await updateAccount(
      { id: account.id, name: "Travel Wallet", initialBalanceCents: 12000 },
      db
    );

    expect(updated.name).toBe("Travel Wallet");
    expect(updated.initialBalanceCents).toBe(12000);
  });

  it("calculates current balance with transactions and transfers", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const cash = await createAccount(
      { name: "Cash", type: "cash", initialBalanceCents: 100000 },
      db
    );
    const savings = await createAccount(
      { name: "Savings", type: "savings", initialBalanceCents: 0 },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);
    const housing = await createCategory({ name: "Housing", group: "fixed_expense" }, db);
    const investment = await createCategory({ name: "Brokerage", group: "investment" }, db);

    await createTransaction(
      {
        accountId: cash.id,
        categoryId: salary.id,
        type: "income",
        status: "posted",
        amountCents: 50000,
        transactionDate: "2026-05-10",
        competenceMonth: "2026-05",
        description: "Salary",
      },
      db
    );
    await createTransaction(
      {
        accountId: cash.id,
        categoryId: housing.id,
        type: "expense",
        status: "posted",
        amountCents: 20000,
        transactionDate: "2026-05-12",
        competenceMonth: "2026-05",
        description: "Rent",
      },
      db
    );
    await createTransaction(
      {
        accountId: cash.id,
        categoryId: investment.id,
        type: "investment_contribution",
        status: "posted",
        amountCents: 10000,
        transactionDate: "2026-05-15",
        competenceMonth: "2026-05",
        description: "Invest",
      },
      db
    );
    await createTransfer(
      {
        fromAccountId: cash.id,
        toAccountId: savings.id,
        amountCents: 5000,
        transferDate: "2026-05-18",
        competenceMonth: "2026-05",
        description: "Reserve",
      },
      db
    );

    const cashDetails = await getAccountDetails(cash.id, db);
    const savingsDetails = await getAccountDetails(savings.id, db);

    expect(cashDetails.currentBalanceCents).toBe(115000);
    expect(savingsDetails.currentBalanceCents).toBe(5000);
  });
});
