import { beforeEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyApi, pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/investments/route";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";

vi.mock("@/lib/server/pluggy/config", async (original) => ({
  ...(await original<typeof import("@/lib/server/pluggy/config")>()),
  getPluggyClient: vi.fn(),
}));

routeDatabase();
guardCases(route);
pluggyGuardCases(route);

const remote = { id: "remote-1", name: "CDB", type: "FIXED_INCOME", subtype: "CDB", balance: 100.25, date: "2026-07-15T00:00:00.000Z", status: "ACTIVE" };

beforeEach(() => { vi.mocked(getPluggyClient).mockReturnValue(pluggyApi({ listInvestments: vi.fn(async () => [remote]) })); });

async function addItem() {
  const { pluggyItems } = await import("@/lib/db/schema");
  const [item] = await (await getFinanceDatabase()).insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  return item.id;
}

it("lists, creates a linked holding and unlinks it", async () => {
  const itemId = await addItem();
  await expect((await route.GET(request())).json()).resolves.toMatchObject({ ok: true, investments: [{ externalAssetId: "remote-1", link: null, currentValueCents: 10025 }], holdings: [], notices: [] });
  const created = await route.POST(request("POST", { itemId, externalAssetId: "remote-1", holdingId: null }));
  expect(created.status).toBe(201);
  const { investments } = await created.json();
  expect(investments).toMatchObject([{ link: { holdingName: "CDB" } }]);
  const removed = await route.DELETE(request("DELETE", undefined, `?holdingId=${investments[0].link.holdingId}`));
  expect(removed.status).toBe(200);
  await expect(removed.json()).resolves.toMatchObject({ investments: [{ link: null }] });
});

it("returns the conflict of a position that is already linked", async () => {
  const itemId = await addItem();
  await route.POST(request("POST", { itemId, externalAssetId: "remote-1", holdingId: null }));
  const repeated = await route.POST(request("POST", { itemId, externalAssetId: "remote-1", holdingId: null }));
  expect(repeated.status).toBe(409);
  await expect(repeated.json()).resolves.toMatchObject({ error: { code: "PLUGGY_INVESTMENT_LINK_EXISTS" } });
});

it("rejects an invalid body and a missing holding id", async () => {
  expect((await route.POST(request("POST", { externalAssetId: "remote-1" }))).status).toBe(400);
  expect((await route.DELETE(request("DELETE"))).status).toBe(400);
});
