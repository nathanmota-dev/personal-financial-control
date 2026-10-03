import { expect, it } from "vitest";
import {
  guardCases,
  request,
  routeDatabase,
} from "../../../../../helpers/route";
import * as route from "@/app/api/credit-card/charges/[id]/route";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { defaultCategoryIds } from "@/lib/category-defaults";

const database = routeDatabase();
guardCases(route);
it("loads, edits and deletes a persisted charge", async () => {
  const input = {
    accountId: database.creditId,
    categoryId: defaultCategoryIds.food,
    totalAmountCents: 10000,
    installmentCount: 1,
    purchaseDate: "2026-07-16",
    description: "Compra",
  };
  const charge = await createCreditCardCharge(input);
  const context = { params: Promise.resolve({ id: charge.id }) };
  expect(
    (await (await route.GET(request(), context)).json()).charge,
  ).toMatchObject({ id: charge.id });
  expect(
    (
      await (
        await route.PATCH(
          request("PATCH", { ...input, description: "Editada" }),
          context,
        )
      ).json()
    ).charge,
  ).toMatchObject({ description: "Editada" });
  expect(
    (await route.PATCH(request("PATCH", { installmentCount: 0 }), context))
      .status,
  ).toBe(400);
  expect((await route.DELETE(request("DELETE"), context)).status).toBe(204);
  expect((await route.GET(request(), context)).status).toBe(404);
  expect((await route.DELETE(request("DELETE"), context)).status).toBe(404);
});
