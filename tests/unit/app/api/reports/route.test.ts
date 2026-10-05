import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../helpers/route";
import * as route from "@/app/api/reports/route";
import { getFinanceDatabase } from "@/lib/db";

routeDatabase();
guardCases(route);

it.each(["categories", "sources"])("returns only the requested report view: %s", async (view) => {
  const response = await route.GET(request("GET", undefined, `?mode=monthly&period=2026-07&view=${view}`));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual(view === "categories" ? { categories: [] } : { entries: [] });
});
it.each(["?mode=invalid&view=categories", "?period=2026-13&view=sources", "?view=invalid"])("rejects malformed query: %s", async (query) => {
  expect((await route.GET(request("GET", undefined, query))).status).toBe(400);
  expect(getFinanceDatabase).not.toHaveBeenCalled();
});
it("reports loading failures without disclosing database details", async () => {
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(new Error("private database details"));
  const response = await route.GET(request("GET", undefined, "?view=categories"));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Não foi possível carregar os dados do relatório." });
});
