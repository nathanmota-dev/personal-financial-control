import { beforeEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyApi, pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/links/route";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";

vi.mock("@/lib/server/pluggy/config", async (original) => ({
  ...(await original<typeof import("@/lib/server/pluggy/config")>()),
  getPluggyClient: vi.fn(),
}));

const state = routeDatabase();
guardCases(route);
pluggyGuardCases(route);
beforeEach(() => { vi.mocked(getPluggyClient).mockReturnValue(pluggyApi()); });

async function addItem() {
  const { pluggyItems } = await import("@/lib/db/schema");
  const [item] = await (await getFinanceDatabase()).insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  return item.id;
}

const body = (itemId: string, overrides = {}) => ({ itemId, externalAccountId: "remote-bank", accountId: state.checkingId, cutoffDate: "2026-01-01", ...overrides });

it("links, edits and disables a remote account", async () => {
  const itemId = await addItem();
  const created = await route.POST(request("POST", body(itemId)));
  expect(created.status).toBe(201);
  const { link } = await created.json();
  expect(link).toMatchObject({ itemId, accountId: state.checkingId, kind: "bank", remoteName: "Conta Plus", cutoffDate: "2026-01-01", isEnabled: true });
  const edited = await (await route.PATCH(request("PATCH", { id: link.id, cutoffDate: "2026-02-01", isEnabled: false }))).json();
  expect(edited.link).toMatchObject({ cutoffDate: "2026-02-01", isEnabled: false });
  await expect((await route.GET(request())).json()).resolves.toMatchObject({ links: [{ id: link.id, isEnabled: false }] });
});

it("removes links together with their connection", async () => {
  const itemId = await addItem();
  await route.POST(request("POST", body(itemId)));
  const { eq } = await import("drizzle-orm");
  const { removePluggyItem } = await import("@/lib/server/pluggy/items");
  const { pluggyAccountLinks } = await import("@/lib/db/schema");
  const db = await getFinanceDatabase();
  await removePluggyItem(itemId, db);
  expect(await db.query.pluggyAccountLinks.findFirst({ where: eq(pluggyAccountLinks.itemId, itemId) })).toBeUndefined();
});

it("enforces the account kind on creation and edition", async () => {
  const itemId = await addItem();
  const mismatch = await route.POST(request("POST", body(itemId, { accountId: state.creditId })));
  expect(mismatch.status).toBe(400);
  await expect(mismatch.json()).resolves.toMatchObject({ error: { code: "PLUGGY_ACCOUNT_KIND_MISMATCH" } });
  const { link } = await (await route.POST(request("POST", body(itemId, { externalAccountId: "remote-card", accountId: state.creditId })))).json();
  expect(link.kind).toBe("credit");
  expect((await route.PATCH(request("PATCH", { id: link.id, accountId: state.checkingId }))).status).toBe(400);
});

it.each([
  ["item", { itemId: "missing" }, "PLUGGY_ITEM_NOT_FOUND"],
  ["remote account", { externalAccountId: "foreign" }, "PLUGGY_ACCOUNT_NOT_FOUND"],
  ["local account", { accountId: "missing" }, "PLUGGY_LOCAL_ACCOUNT_NOT_FOUND"],
])("returns 404 for an unknown %s", async (_name, overrides, code) => {
  const itemId = await addItem();
  const response = await route.POST(request("POST", body(itemId, overrides)));
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({ error: { code } });
});

it("rejects linking the same remote account twice", async () => {
  const itemId = await addItem();
  await route.POST(request("POST", body(itemId)));
  expect((await route.POST(request("POST", body(itemId)))).status).toBe(409);
});

it("validates dates and unknown links", async () => {
  const itemId = await addItem();
  expect((await route.POST(request("POST", body(itemId, { cutoffDate: "2026-13-40" })))).status).toBe(400);
  expect((await route.PATCH(request("PATCH", { id: "missing", isEnabled: false }))).status).toBe(404);
});
