import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import * as route from "@/app/api/credit-card/bills/route";

const database = routeDatabase();
guardCases(route);
it("creates, updates and filters real invoice statements", async () => {
  const input = {
    accountId: database.creditId,
    invoiceMonth: "2026-07",
    dueDate: "2026-07-12",
    statementTotalCents: 12345,
    currentChargesTotalCents: 12345,
  };
  const created = await route.POST(request("POST", input));
  expect(created.status).toBe(201);
  const id = (await created.json()).bill.id;
  const updated = await route.POST(
    request("POST", { ...input, statementTotalCents: 20000 }),
  );
  expect((await updated.json()).bill).toMatchObject({
    id,
    statementTotalCents: 20000,
  });
  expect((await (await route.GET(request())).json()).bills).toHaveLength(1);
  expect(
    (
      await (
        await route.GET(
          request(
            "GET",
            undefined,
            `?accountId=${database.creditId}&invoiceMonth=2026-07`,
          ),
        )
      ).json()
    ).bills,
  ).toHaveLength(1);
  expect(
    (
      await (
        await route.GET(request("GET", undefined, "?invoiceMonth=2026-08"))
      ).json()
    ).bills,
  ).toHaveLength(0);
  expect((await route.POST(request("POST", {}))).status).toBe(400);
  expect(
    (await route.GET(request("GET", undefined, "?invoiceMonth=bad"))).status,
  ).toBe(400);
});
