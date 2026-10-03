import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import * as route from "@/app/api/credit-card/charges/route";
import { defaultCategoryIds } from "@/lib/category-defaults";

const database = routeDatabase();
guardCases(route);
it("creates installments and filters charges by account and month", async () => {
  const result = await route.POST(
    request("POST", {
      accountId: database.creditId,
      categoryId: defaultCategoryIds.food,
      totalAmountCents: 10001,
      installmentCount: 3,
      purchaseDate: "2026-07-16",
      description: "Parcelas",
    }),
  );
  expect(result.status).toBe(201);
  expect((await result.json()).charge).toMatchObject({
    totalAmountCents: 10001,
    installmentCount: 3,
  });
  expect((await (await route.GET(request())).json()).charges).toHaveLength(1);
  expect(
    (
      await (
        await route.GET(
          request(
            "GET",
            undefined,
            `?accountId=${database.creditId}&invoiceMonth=2026-08`,
          ),
        )
      ).json()
    ).charges,
  ).toHaveLength(1);
  expect((await route.POST(request("POST", {}))).status).toBe(400);
  expect(
    (await route.GET(request("GET", undefined, "?invoiceMonth=invalid")))
      .status,
  ).toBe(400);
});
