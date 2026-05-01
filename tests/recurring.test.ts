import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  createRecurringTemplate,
  generateRecurringTransactions,
} from "@/lib/server/recurring";
import { listTransactions } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("recurring", () => {
  it("generates monthly transactions and blocks duplicates", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);

    await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );

    const created = await generateRecurringTransactions("2026-05", db);

    expect(created).toHaveLength(1);
    expect((await listTransactions({ competenceMonth: "2026-05" }, db)).length).toBe(1);
    await expect(generateRecurringTransactions("2026-05", db)).rejects.toThrow(/already exists/i);
  });
});
