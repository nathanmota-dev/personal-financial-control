import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../helpers/route";
import * as route from "@/app/api/accounts/route";

routeDatabase();
guardCases(route);
it("creates an account, persists cents and lists it with private caching", async () => {
  const response = await route.POST(
    request("POST", { name: "Cash", type: "cash", initialBalanceCents: 12345 }),
  );
  expect(response.status).toBe(201);
  const { account } = await response.json();
  expect(account).toMatchObject({ name: "Cash", initialBalanceCents: 12345 });
  const listed = await route.GET(request());
  expect((await listed.json()).accounts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: account.id, name: "Cash" }),
    ]),
  );
  expect(listed.headers.get("Cache-Control")).toBe("private, no-store");
});
it("reports payload validation and malformed JSON", async () => {
  expect((await route.POST(request("POST", { name: "" }))).status).toBe(400);
  expect(
    (
      await route.POST(
        new Request("http://localhost/api/accounts", {
          method: "POST",
          body: "{",
        }),
      )
    ).status,
  ).toBe(400);
});
