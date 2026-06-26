import type { ProjectedBalanceRequest } from "@/lib/interfaces/projected-balance-server";
import type { AppDb } from "@/lib/db";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";

type CreateAccountInput = Parameters<typeof createAccount>[0];

export async function createBaseProjectionCategories(db: AppDb) {
  const salary = await createCategory({ name: "Salary", group: "income" }, db);
  const housing = await createCategory({ name: "Housing", group: "fixed_expense" }, db);
  const groceries = await createCategory({ name: "Groceries", group: "variable_expense" }, db);
  const brokerage = await createCategory({ name: "Brokerage", group: "investment" }, db);

  return { salary, housing, groceries, brokerage };
}

export function buildProjectedBalanceRequest(
  overrides: Partial<ProjectedBalanceRequest> = {}
): ProjectedBalanceRequest {
  return {
    period: "custom",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    accountIds: [],
    creditAccountIds: [],
    minimumReserveCents: 0,
    includeCreditCard: true,
    includeInvestments: true,
    includeTransfers: true,
    ...overrides,
  };
}

export function createProjectionAccount(
  db: AppDb,
  overrides: Partial<CreateAccountInput> = {}
) {
  return createAccount(
    {
      name: "Main",
      type: "checking",
      initialBalanceCents: 100000,
      ...overrides,
    },
    db
  );
}

export function createProjectionCreditAccount(db: AppDb) {
  return createAccount(
    {
      name: "Card",
      type: "credit",
      initialBalanceCents: 0,
      creditClosingDay: 4,
      creditDueDay: 10,
    },
    db
  );
}
