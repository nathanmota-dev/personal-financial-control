import { beforeEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../../helpers/route";
import { pluggyApi, pluggyGuardCases } from "../../helpers";
import * as route from "@/app/api/pluggy/sync/daily/route";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient, isPluggyConfigured } from "@/lib/server/pluggy/config";

vi.mock("@/lib/server/pluggy/config", async (original) => ({
  ...(await original<typeof import("@/lib/server/pluggy/config")>()),
  getPluggyClient: vi.fn(),
  isPluggyConfigured: vi.fn(),
}));

routeDatabase();
guardCases(route);
pluggyGuardCases(route);
beforeEach(() => {
  vi.mocked(getPluggyClient).mockReturnValue(pluggyApi());
  vi.mocked(isPluggyConfigured).mockReturnValue(true);
});

async function addItem() {
  const { pluggyItems } = await import("@/lib/db/schema");
  await (await getFinanceDatabase()).insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "OUTDATED" });
}

const daily = async () => (await route.POST(request("POST", {}))).json();

it("syncs on the first visit of the day and skips the next ones", async () => {
  await addItem();
  await expect(daily()).resolves.toMatchObject({ ok: true, ran: true, run: { status: "success" } });
  await expect(daily()).resolves.toEqual({ ok: true, ran: false, reason: "already-synced" });
  expect(getPluggyClient).toHaveBeenCalledTimes(1);
});

it("skips without touching Pluggy when it is not configured or has no connection", async () => {
  await expect(daily()).resolves.toEqual({ ok: true, ran: false, reason: "no-items" });
  vi.mocked(isPluggyConfigured).mockReturnValue(false);
  await addItem();
  await expect(daily()).resolves.toEqual({ ok: true, ran: false, reason: "not-configured" });
  expect(getPluggyClient).not.toHaveBeenCalled();
});

it("uses the database failure response for replica outages", async () => {
  const { databaseUnavailable } = await import("@/lib/db/replica-errors");
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(databaseUnavailable());
  const response = await route.POST(request("POST", {}));
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({ error: { code: "DATABASE_UNAVAILABLE" } });
});
