import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { databaseUnavailable } from "@/lib/db/replica-errors";
import { pluggyAccountLinks, pluggyImportLedger, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggySyncStep } from "@/lib/interfaces/pluggy";
import { createAccount } from "@/lib/server/accounts";
import { DomainError } from "@/lib/server/errors";
import { contentIndex } from "@/lib/crypto/content";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { getLatestPluggyRun } from "@/lib/server/pluggy/sync-runs";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;
let database: Database;
let accountId: string;

const count = async (table: string) => Number((await database.db.$client.execute(`SELECT COUNT(*) AS total FROM ${table}`)).rows[0].total);

function api(overrides: Partial<PluggyApi> = {}): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED", connector: { name: "MeuPluggy" }, lastUpdatedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: "2026-07-17T10:00:00.000Z" })),
    listAccounts: vi.fn(async () => [{ id: "remote-a", type: "BANK", name: "A" }, { id: "remote-b", type: "BANK", name: "B" }]),
    listTransactions: vi.fn(async () => []),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => []),
    ...overrides,
  };
}

async function seedItem(external = "item-1", label = "Banco") {
  const [item] = await database.db.insert(pluggyItems).values({ externalItemId: external, label, connectorName: "MeuPluggy", status: "OUTDATED" }).returning();
  return item;
}

async function seedLink(itemId: string, external: string, isEnabled = true) {
  const [link] = await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId: external, accountId, remoteName: external, kind: "bank", cutoffDate: "2026-01-01", isEnabled }).returning();
  return link;
}

beforeEach(async () => {
  database = await createTestDatabase();
  accountId = (await createAccount({ name: "Local", type: "checking", initialBalanceCents: 0 }, database.db)).id;
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  database.db.$client.close();
  await database.cleanup();
});

describe("Pluggy sync pipeline", () => {
  it("runs the ordered steps, per item and per enabled account", async () => {
    const item = await seedItem();
    await seedLink(item.id, "remote-a");
    await seedLink(item.id, "remote-b", false);
    const order: string[] = [];
    const steps: PluggySyncStep[] = [
      { name: "first", scope: "item", run: async (_context, target) => { order.push(`first:${target.label}`); return { counts: { seen: 1 } }; } },
      { name: "second", scope: "account", run: async (_context, link) => { order.push(`second:${link.externalAccountId}`); return { counts: { seen: 2 } }; } },
      { name: "third", scope: "item", run: async () => { order.push("third"); } },
    ];
    const run = await runPluggySync({ db: database.db, client: api(), steps });
    expect(order).toEqual(["first:Banco", "second:remote-a", "third"]);
    expect(run).toMatchObject({ status: "success", errorCode: null, summary: { counts: { seen: 3 }, items: { total: 1 }, accounts: { total: 1 } } });
    expect(await getLatestPluggyRun(database.db)).toMatchObject({ running: false, run: { id: run.id, status: "success" } });
  });

  it("updates item status with the default steps and creates no financial record", async () => {
    const item = await seedItem();
    await seedLink(item.id, "remote-a");
    const run = await runPluggySync({ db: database.db, client: api() });
    expect(run).toMatchObject({ status: "success", summary: { counts: { itemsChecked: 1, accountsChecked: 1 } } });
    const stored = await database.db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, item.id) });
    expect(stored).toMatchObject({ status: "UPDATED", lastErrorCode: null });
    expect(stored?.collectedAt?.toISOString()).toBe("2026-07-16T10:00:00.000Z");
    expect(stored?.lastSyncedAt).toBeInstanceOf(Date);
    for (const table of ["transactions", "transfers", "credit_card_charges", "credit_card_bills", "investment_operations", "pluggy_import_ledger"]) expect(await count(table)).toBe(0);
  });

  it("isolates a failing account and keeps syncing the others", async () => {
    const item = await seedItem();
    const missing = await seedLink(item.id, "remote-gone");
    await seedLink(item.id, "remote-a");
    const later: string[] = [];
    const steps: PluggySyncStep[] = [
      (await import("@/lib/server/pluggy/steps/account-check")).accountCheckStep,
      { name: "later", scope: "account", run: async (_context, link) => { later.push(link.externalAccountId); } },
    ];
    const run = await runPluggySync({ db: database.db, client: api(), steps });
    expect(run.status).toBe("partial");
    expect(run.errorCode).toBe("PLUGGY_ACCOUNT_NOT_FOUND");
    expect(run.summary).toMatchObject({ accounts: { total: 2, failed: 1 }, failures: [{ scope: "account", targetId: missing.id, code: "PLUGGY_ACCOUNT_NOT_FOUND" }] });
    expect(later).toEqual(["remote-a"]);
  });

  it("isolates a failing item, skips its accounts and records the error", async () => {
    const broken = await seedItem("item-broken", "Quebrado");
    const healthy = await seedItem("item-ok", "Saudável");
    await seedLink(broken.id, "remote-a");
    await seedLink(healthy.id, "remote-b");
    const client = api({ getItem: vi.fn(async (id: string) => {
      if (id === "item-broken") throw new DomainError("PLUGGY_FORBIDDEN", "Negado", 502);
      return { id, status: "UPDATED" };
    }) });
    const run = await runPluggySync({ db: database.db, client });
    expect(run).toMatchObject({ status: "partial", summary: { items: { failed: 1 }, accounts: { skipped: 1, failed: 0 } } });
    expect(await database.db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, broken.id) })).toMatchObject({ lastErrorCode: "PLUGGY_FORBIDDEN", lastSyncedAt: null });
    expect((await database.db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, healthy.id) }))?.lastSyncedAt).toBeInstanceOf(Date);
  });

  it("reports failed when every target failed and hides unexpected error details", async () => {
    await seedItem();
    const client = api({ getItem: vi.fn(async () => { throw new Error("key-1 raw payload"); }) });
    const run = await runPluggySync({ db: database.db, client });
    expect(run).toMatchObject({ status: "failed", errorCode: "PLUGGY_STEP_FAILED" });
    expect(JSON.stringify(run)).not.toContain("key-1");
  });

  it("allows one run per process and releases the guard afterwards", async () => {
    await seedItem();
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const steps: PluggySyncStep[] = [{ name: "hold", scope: "item", run: async () => { await held; } }];
    const first = runPluggySync({ db: database.db, client: api(), steps });
    await expect(runPluggySync({ db: database.db, client: api(), steps })).rejects.toMatchObject({ code: "PLUGGY_SYNC_RUNNING", status: 409 });
    expect((await getLatestPluggyRun(database.db)).running).toBe(true);
    release();
    await expect(first).resolves.toMatchObject({ status: "success" });
    await expect(runPluggySync({ db: database.db, client: api(), steps: [] })).resolves.toMatchObject({ status: "success" });
  });

  it("computes a dry run without writing anything", async () => {
    const item = await seedItem();
    await seedLink(item.id, "remote-a");
    const before = await database.db.$client.execute("SELECT * FROM pluggy_items");
    const write = vi.fn();
    const steps: PluggySyncStep[] = [
      (await import("@/lib/server/pluggy/steps/item-status")).itemStatusStep,
      { name: "probe", scope: "account", run: async (context) => { await context.write(async () => write()); expect(context.dryRun).toBe(true); return { counts: { planned: 1 } }; } },
    ];
    const run = await runPluggySync({ db: database.db, client: api(), steps, dryRun: true });
    expect(run).toMatchObject({ id: null, status: "success", summary: { dryRun: true, counts: { planned: 1, itemsChecked: 1 } } });
    expect(write).not.toHaveBeenCalled();
    expect(await count("pluggy_sync_runs")).toBe(0);
    expect((await database.db.$client.execute("SELECT * FROM pluggy_items")).rows).toEqual(before.rows);
  });

  it("stops on a database failure instead of isolating it and closes the run", async () => {
    await seedItem();
    const steps: PluggySyncStep[] = [{ name: "offline", scope: "item", run: async () => { throw databaseUnavailable(); } }];
    await expect(runPluggySync({ db: database.db, client: api(), steps })).rejects.toMatchObject({ code: "DATABASE_UNAVAILABLE" });
    expect(await getLatestPluggyRun(database.db)).toMatchObject({ running: false, run: { status: "failed", errorCode: "PLUGGY_SYNC_FAILED" } });
  });

  it("closes a run orphaned by a crash when the next one starts", async () => {
    const { pluggySyncRuns } = await import("@/lib/db/schema");
    const [orphan] = await database.db.insert(pluggySyncRuns).values({ startedAt: new Date("2026-07-01T00:00:00Z"), status: "running" }).returning();
    await runPluggySync({ db: database.db, client: api(), steps: [] });
    expect(await database.db.query.pluggySyncRuns.findFirst({ where: eq(pluggySyncRuns.id, orphan.id) })).toMatchObject({ status: "failed", errorCode: "PLUGGY_SYNC_INTERRUPTED" });
  });
});

describe("Pluggy persistence encryption", () => {
  it("stores ciphertext in every business column and looks records up by hash", async () => {
    const item = await seedItem("item-secret", "Banco secreto");
    await seedLink(item.id, "remote-secret");
    await database.db.insert(pluggyImportLedger).values({ fingerprint: "tx:secret", outcome: "skipped", lastSeenAt: new Date() });
    await runPluggySync({ db: database.db, client: api({ listAccounts: vi.fn(async () => [{ id: "remote-secret", type: "BANK", name: "A" }]) }) });
    for (const table of ["pluggy_items", "pluggy_account_links", "pluggy_sync_runs", "pluggy_import_ledger"]) {
      const { rows, columns } = await database.db.$client.execute(`SELECT * FROM ${table}`);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) for (const column of columns) {
        if (column === "id" || column === "item_id" || column === "account_id" || row[column] === null) continue;
        if (column.endsWith("_hash")) expect(row[column]).toMatch(/^[0-9a-f]{64}$/);
        else expect(row[column]).toMatch(/^pfc:v2:/);
      }
      expect(JSON.stringify(rows)).not.toMatch(/item-secret|remote-secret|Banco secreto|tx:secret/);
    }
    const stored = await database.db.$client.execute("SELECT external_item_id_hash AS hash FROM pluggy_items");
    expect(stored.rows[0].hash).toBe(contentIndex(["item-secret"], "pluggy_items.external_item_id"));
    expect(await database.db.query.pluggyItems.findFirst({ where: eq(pluggyItems.externalItemId, "item-secret") })).toMatchObject({ id: item.id });
    expect(await database.db.query.pluggyImportLedger.findFirst({ where: eq(pluggyImportLedger.fingerprint, "tx:secret") })).toMatchObject({ outcome: "skipped" });
  });

  it("rejects duplicate remote records through the hash indexes", async () => {
    await seedItem("item-dup");
    await expect(database.db.insert(pluggyItems).values({ externalItemId: "item-dup", label: "Outro", connectorName: "MeuPluggy", status: "UPDATED" })).rejects.toThrow();
  });
});
