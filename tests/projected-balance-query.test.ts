import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  getProjectedBalance,
  parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";
import { buildProjectedBalanceRequest } from "@/tests/helpers/projected-balance";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("projected balance query", () => {
  it("uses the next income date as the default period end", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const checking = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const salary = await createCategory({ name: "Salary", group: "income" }, db);

    await createTransaction(
      {
        accountId: checking.id,
        categoryId: salary.id,
        type: "income",
        status: "pending",
        amountCents: 100000,
        transactionDate: "2026-07-05",
        competenceMonth: "2026-07",
        description: "Salary",
      },
      db
    );

    const projection = await getProjectedBalance(
      buildProjectedBalanceRequest({
        period: "next_income",
        endDate: undefined,
      }),
      db
    );

    expect(projection.filters.endDate).toBe("2026-07-05");
    expect(projection.daily).toHaveLength(5);
  });

  it("validates projected balance query parameters", () => {
    expect(() =>
      parseProjectedBalanceSearchParams(
        new URLSearchParams({
          period: "custom",
          startDate: "2026-01-01",
          endDate: "2027-01-02",
        })
      )
    ).toThrow(/366 days/);

    expect(() =>
      parseProjectedBalanceSearchParams(
        new URLSearchParams({
          period: "custom",
          startDate: "2026-01-01",
        })
      )
    ).toThrow(/endDate is required/);

    expect(() =>
      parseProjectedBalanceSearchParams(
        new URLSearchParams({
          accountId: "not-a-uuid",
        })
      )
    ).toThrow(/valid UUID/);
  });
});
