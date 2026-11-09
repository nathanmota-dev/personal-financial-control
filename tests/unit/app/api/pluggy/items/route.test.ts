import { beforeEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyApi, pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/items/route";
import { getPluggyClient } from "@/lib/server/pluggy/config";

vi.mock("@/lib/server/pluggy/config", async (original) => ({
  ...(await original<typeof import("@/lib/server/pluggy/config")>()),
  getPluggyClient: vi.fn(),
}));

routeDatabase();
guardCases(route);
pluggyGuardCases(route);
beforeEach(() => { vi.mocked(getPluggyClient).mockReturnValue(pluggyApi()); });

const input = { externalItemId: "item-1", label: "Banco" };

it("adds an Item ID and lists its remote accounts without their balances", async () => {
  const response = await route.POST(request("POST", input));
  expect(response.status).toBe(201);
  const { item } = await response.json();
  expect(item).toMatchObject({ label: "Banco", connectorName: "MeuPluggy", status: "UPDATED", collectedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: null, accountsError: null });
  expect(item.remoteAccounts).toEqual([
    { externalAccountId: "remote-bank", name: "Conta Plus", kind: "bank", numberSuffix: "2345" },
    { externalAccountId: "remote-card", name: "Cartão", kind: "credit", numberSuffix: null },
  ]);
  const overview = await (await route.GET(request())).json();
  expect(overview.items).toHaveLength(1);
  expect(overview.links).toEqual([]);
});

it("rejects a duplicate Item ID", async () => {
  await route.POST(request("POST", input));
  const response = await route.POST(request("POST", input));
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({ error: { code: "PLUGGY_ITEM_EXISTS" } });
});

it("rejects an invalid Item ID before calling Pluggy", async () => {
  const client = pluggyApi();
  vi.mocked(getPluggyClient).mockReturnValue(client);
  expect((await route.POST(request("POST", { externalItemId: "../auth", label: "Banco" }))).status).toBe(400);
  expect(client.getItem).not.toHaveBeenCalled();
});

it("keeps the connection visible when its accounts cannot be listed", async () => {
  await route.POST(request("POST", input));
  const { DomainError } = await import("@/lib/server/errors");
  vi.mocked(getPluggyClient).mockReturnValue(pluggyApi({ listAccounts: vi.fn(async () => { throw new DomainError("PLUGGY_RATE_LIMITED", "Limite", 429); }) }));
  const { items } = await (await route.GET(request())).json();
  expect(items[0]).toMatchObject({ remoteAccounts: [], accountsError: "Limite" });
});

it("does not swallow unexpected listing failures", async () => {
  await route.POST(request("POST", input));
  vi.mocked(getPluggyClient).mockReturnValue(pluggyApi({ listAccounts: vi.fn(async () => { throw new Error("boom"); }) }));
  expect((await route.GET(request())).status).toBe(500);
});

it("removes a connection and reports a missing one", async () => {
  const { item } = await (await route.POST(request("POST", input))).json();
  expect((await route.DELETE(request("DELETE", undefined, `?id=${item.id}`))).status).toBe(200);
  expect((await (await route.GET(request())).json()).items).toEqual([]);
  expect((await route.DELETE(request("DELETE", undefined, `?id=${item.id}`))).status).toBe(404);
  expect((await route.DELETE(request("DELETE"))).status).toBe(400);
});
