import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pluggyItems, pluggySyncRuns } from "@/lib/db/schema";
import type { PluggyApi, PluggySyncRunStatus } from "@/lib/interfaces/pluggy";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runDailyPluggySync } from "@/lib/server/pluggy/daily-sync";
import { getLatestPluggyRun, hasCompletedPluggyRunOn } from "@/lib/server/pluggy/sync-runs";
import { createTestDatabase } from "@/tests/helpers/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED", connector: { name: "MeuPluggy" }, lastUpdatedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: null })),
    listAccounts: vi.fn(async () => []),
    listTransactions: vi.fn(async () => []),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => []),
  };
}

async function seedRun(startedAt: string, status: PluggySyncRunStatus) {
  await database.db.insert(pluggySyncRuns).values({ startedAt: new Date(startedAt), finishedAt: new Date(startedAt), status });
}

const daily = (now: string, client = api()) => runDailyPluggySync({ db: database.db, client: () => client, configured: true, now: new Date(now) });

beforeEach(async () => {
  database = await createTestDatabase();
  pluggyRuntime().syncRunning = false;
  await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "OUTDATED" });
});

afterEach(async () => {
  pluggyRuntime().syncRunning = false;
  database.db.$client.close();
  await database.cleanup();
});

describe("daily Pluggy sync", () => {
  it("counts the day in São Paulo time, not UTC", async () => {
    // 01:30 UTC on the 17th is still 22:30 on the 16th in São Paulo.
    await seedRun("2026-07-17T01:30:00.000Z", "success");
    await expect(hasCompletedPluggyRunOn(database.db, "2026-07-16")).resolves.toBe(true);
    await expect(hasCompletedPluggyRunOn(database.db, "2026-07-17")).resolves.toBe(false);
    await expect(daily("2026-07-17T02:00:00.000Z")).resolves.toEqual({ ran: false, reason: "already-synced" });
    await expect(daily("2026-07-17T03:30:00.000Z")).resolves.toMatchObject({ ran: true, run: { status: "success" } });
  });

  it("retries a day whose only run failed, and accepts a partial run", async () => {
    await seedRun("2026-07-16T12:00:00.000Z", "failed");
    await expect(daily("2026-07-16T13:00:00.000Z")).resolves.toMatchObject({ ran: true });
    await seedRun("2026-07-18T12:00:00.000Z", "partial");
    await expect(daily("2026-07-18T13:00:00.000Z")).resolves.toEqual({ ran: false, reason: "already-synced" });
  });

  it("skips while another sync is running instead of failing", async () => {
    pluggyRuntime().syncRunning = true;
    const client = api();
    await expect(daily("2026-07-16T13:00:00.000Z", client)).resolves.toEqual({ ran: false, reason: "running" });
    expect(client.getItem).not.toHaveBeenCalled();
  });

  it("skips without credentials or connections", async () => {
    await expect(runDailyPluggySync({ db: database.db, client: api, configured: false })).resolves.toEqual({ ran: false, reason: "not-configured" });
    await database.db.delete(pluggyItems);
    await expect(daily("2026-07-16T13:00:00.000Z")).resolves.toEqual({ ran: false, reason: "no-items" });
  });

  it("returns the most recent run although started_at is encrypted", async () => {
    for (const day of ["2026-07-10", "2026-07-14", "2026-07-12", "2026-07-11", "2026-07-13"]) await seedRun(`${day}T12:00:00.000Z`, "success");
    await expect(getLatestPluggyRun(database.db)).resolves.toMatchObject({ run: { startedAt: "2026-07-14T12:00:00.000Z" } });
  });
});
