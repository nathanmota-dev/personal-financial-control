import { beforeEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyApi, pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/sync/route";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";

vi.mock("@/lib/server/pluggy/config", async (original) => ({
  ...(await original<typeof import("@/lib/server/pluggy/config")>()),
  getPluggyClient: vi.fn(),
}));

routeDatabase();
guardCases(route);
pluggyGuardCases(route);
beforeEach(() => { vi.mocked(getPluggyClient).mockReturnValue(pluggyApi()); });

async function addItem() {
  const { pluggyItems } = await import("@/lib/db/schema");
  await (await getFinanceDatabase()).insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "OUTDATED" });
}

it("returns no run before the first sync", async () => {
  await expect((await route.GET(request())).json()).resolves.toEqual({ ok: true, run: null, running: false });
});

it("starts a run, records it and returns it as the latest", async () => {
  await addItem();
  const response = await route.POST(request("POST", {}));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.run).toMatchObject({ status: "success", summary: { dryRun: false, items: { total: 1, failed: 0 } } });
  await expect((await route.GET(request())).json()).resolves.toMatchObject({ run: { id: body.run.id, status: "success" }, running: false });
});

it("supports a dry run that records nothing", async () => {
  await addItem();
  const body = await (await route.POST(request("POST", { dryRun: true }))).json();
  expect(body.run).toMatchObject({ id: null, summary: { dryRun: true } });
  await expect((await route.GET(request())).json()).resolves.toMatchObject({ run: null });
});

it("explains the missing configuration without creating a run", async () => {
  const { DomainError } = await import("@/lib/server/errors");
  vi.mocked(getPluggyClient).mockImplementationOnce(() => { throw new DomainError("PLUGGY_NOT_CONFIGURED", "Configure", 503); });
  const response = await route.POST(request("POST", {}));
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({ error: { code: "PLUGGY_NOT_CONFIGURED" } });
});

it("rejects malformed bodies", async () => {
  expect((await route.POST(new Request("http://localhost/api/test", { method: "POST", body: "{", headers: { "Content-Type": "application/json" } }))).status).toBe(400);
  expect((await route.POST(request("POST", { dryRun: "yes" }))).status).toBe(400);
});

it("uses the database failure response for replica outages", async () => {
  const { databaseUnavailable } = await import("@/lib/db/replica-errors");
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(databaseUnavailable());
  const response = await route.GET(request());
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({ error: { code: "DATABASE_UNAVAILABLE" } });
});

it("hides unexpected failures", async () => {
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(new Error("secret detail"));
  const response = await route.GET(request());
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("secret detail");
});
