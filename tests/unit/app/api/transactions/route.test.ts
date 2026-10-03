import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../helpers/route";
import * as route from "@/app/api/transactions/route";
import { defaultCategoryIds } from "@/lib/category-defaults";

const database = routeDatabase();
guardCases(route);
it("creates real income and filters it by competence month", async () => {
  const response = await route.POST(
    request("POST", {
      accountId: database.checkingId,
      categoryId: defaultCategoryIds.salary,
      type: "income",
      amountCents: 12345,
      transactionDate: "2026-07-16",
      competenceMonth: "2026-07",
      description: "API income",
    }),
  );
  expect(response.status).toBe(201);
  expect((await response.json()).transaction).toMatchObject({
    amountCents: 12345,
    description: "API income",
  });
  expect((await (await route.GET(request())).json()).transactions).toHaveLength(
    1,
  );
  expect(
    (
      await (
        await route.GET(request("GET", undefined, "?competenceMonth=2026-08"))
      ).json()
    ).transactions,
  ).toHaveLength(0);
  expect((await route.POST(request("POST", {}))).status).toBe(400);
});
