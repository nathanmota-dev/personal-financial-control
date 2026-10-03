import { expect, it } from "vitest";
import {
  guardCases,
  request,
  routeDatabase,
} from "../../../../../helpers/route";
import * as route from "@/app/api/goals/[id]/contributions/route";
import { createGoal, getGoalDetails } from "@/lib/server/goals";
import { defaultCategoryIds } from "@/lib/category-defaults";
import { listTransactions } from "@/lib/server/transactions";

const database = routeDatabase();
guardCases(route);
it("records a real investment contribution linked to the goal", async () => {
  const { goal } = await createGoal({
    name: "Trip",
    targetAmountCents: 100000,
  });
  const context = { params: Promise.resolve({ id: goal.id }) };
  const input = {
    accountId: database.checkingId,
    categoryId: defaultCategoryIds.investments,
    amountCents: 10000,
    transactionDate: "2026-07-16",
    notes: null,
  };
  expect((await route.POST(request("POST", input), context)).status).toBe(201);
  expect((await getGoalDetails(goal.id)).goal.allocatedCents).toBe(10000);
  expect(await listTransactions()).toEqual([
    expect.objectContaining({
      type: "investment_contribution",
      amountCents: 10000,
    }),
  ]);
  expect(
    (await route.POST(request("POST", { ...input, notes: "second" }), context))
      .status,
  ).toBe(201);
  expect((await route.POST(request("POST", {}), context)).status).toBe(400);
});
