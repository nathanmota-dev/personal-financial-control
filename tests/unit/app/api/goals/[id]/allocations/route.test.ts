import { expect, it } from "vitest";
import {
  guardCases,
  request,
  routeDatabase,
} from "../../../../../helpers/route";
import * as route from "@/app/api/goals/[id]/allocations/route";
import { createGoal, getGoalDetails } from "@/lib/server/goals";

routeDatabase();
guardCases(route);
it("allocates and releases reserve funds without creating transactions", async () => {
  const { goal } = await createGoal({
    name: "Trip",
    targetAmountCents: 100000,
  });
  const context = { params: Promise.resolve({ id: goal.id }) };
  for (const input of [
    { amountCents: 10000, occurredOn: "2026-07-16", notes: "allocation" },
    {
      type: "manual_release",
      amountCents: 5000,
      occurredOn: "2026-07-16",
      notes: null,
    },
  ]) {
    expect((await route.POST(request("POST", input), context)).status).toBe(
      201,
    );
  }
  expect((await getGoalDetails(goal.id)).goal.allocatedCents).toBe(5000);
  const allocations = await route.GET(request(), context);
  expect((await allocations.json()).data).toHaveLength(2);
  expect((await route.POST(request("POST", {}), context)).status).toBe(400);
  expect(
    (
      await route.GET(request(), {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000099" }),
      })
    ).status,
  ).toBe(404);
});
