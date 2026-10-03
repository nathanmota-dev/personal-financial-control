import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import * as route from "@/app/api/goals/[id]/route";
import { createGoal } from "@/lib/server/goals";

routeDatabase();
guardCases(route);
it("loads, edits and archives a goal while rejecting invalid values", async () => {
  const { goal } = await createGoal({
    name: "Trip",
    targetAmountCents: 100000,
  });
  const context = { params: Promise.resolve({ id: goal.id }) };
  expect((await route.GET(request(), context)).status).toBe(200);
  const updated = await route.PATCH(
    request("PATCH", { name: "Travel", targetAmountCents: 150000 }),
    context,
  );
  expect((await updated.json()).data.goal).toMatchObject({
    name: "Travel",
    targetAmountCents: 150000,
  });
  expect(
    (await route.PATCH(request("PATCH", { targetAmountCents: -1 }), context))
      .status,
  ).toBe(400);
  expect((await route.DELETE(request("DELETE"), context)).status).toBe(200);
  expect(
    (
      await route.GET(request(), {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000099" }),
      })
    ).status,
  ).toBe(404);
});
