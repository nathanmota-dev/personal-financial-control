import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../helpers/route";
import * as route from "@/app/api/goals/route";
import { revalidatePath } from "next/cache";

routeDatabase();
guardCases(route);
it("creates a goal and lists its progress without caching", async () => {
  const created = await route.POST(
    request("POST", {
      name: "Trip",
      targetAmountCents: 100000,
      initialAllocationCents: 10000,
      initialAllocationDate: "2026-07-16",
    }),
  );
  expect(created.status).toBe(201);
  expect((await created.json()).data.goal).toMatchObject({
    name: "Trip",
    allocatedCents: 10000,
  });
  const response = await route.GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(revalidatePath).toHaveBeenCalledWith("/goals");
  expect((await route.POST(request("POST", {}))).status).toBe(400);
});
