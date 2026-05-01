import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { getMonthlyDashboard } from "@/lib/server/dashboard";
import { createTransaction } from "@/lib/server/transactions";
import { createTransfer } from "@/lib/server/transfers";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("transfers", () => {
  it("does not contaminate operational totals", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const main = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const reserve = await createAccount(
      { name: "Reserve", type: "savings", initialBalanceCents: 0 },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);

    await createTransaction(
      {
        accountId: main.id,
        categoryId: salary.id,
        type: "income",
        amountCents: 200000,
        status: "posted",
        competenceMonth: "2026-05",
        transactionDate: "2026-05-01",
        description: "Salary",
      },
      db
    );
    await createTransfer(
      {
        fromAccountId: main.id,
        toAccountId: reserve.id,
        amountCents: 50000,
        competenceMonth: "2026-05",
        transferDate: "2026-05-03",
        description: "Reserve",
      },
      db
    );

    const dashboard = await getMonthlyDashboard("2026-05", db);

    expect(dashboard.totals.incomeCents).toBe(200000);
    expect(dashboard.totals.netResultCents).toBe(200000);
  });
});
