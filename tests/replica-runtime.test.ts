import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import { openReplica, getReplicaRuntime, getDatabaseSyncStatus, synchronizeDatabase } from "@/lib/db/replica";
import { reserveReplica } from "@/lib/db/replica-lock";
import journal from "@/drizzle/meta/_journal.json";
import type { ReplicaRuntime } from "@/lib/interfaces/database-replica";

vi.mock("@libsql/client", () => ({ createClient: vi.fn() }));
let directory: string;
let env: ServerEnv;
let runtimes: ReplicaRuntime[];
const globalReplica = globalThis as typeof globalThis & { __pfcReplica?: unknown };
function rawClient() {
  return {
    execute: vi.fn(async (sql: string) => ({ rows: [{ version: sql.includes("__pfc_content") ? 2 : journal.entries.at(-1)!.when }] })),
    sync: vi.fn().mockResolvedValue({ frames_synced: 1 }),
    close: vi.fn(), closed: false, protocol: "file",
  };
}
let raw: ReturnType<typeof rawClient>;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "pfc-replica-test-"));
  env = { NODE_ENV: "test", DEMO_MODE: false, DATABASE_URL: "libsql://example.invalid", TOKEN: "test", DATA_ENCRYPTION_KEY: "test-key", TURSO_REPLICA_PATH: join(directory, "replica", "finance.db"), TURSO_SYNC_INTERVAL: 30, INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES: 30 };
  raw = rawClient(); runtimes = [];
  vi.mocked(createClient).mockImplementation((config) => { writeFileSync(fileURLToPath(config.url), "replica"); return raw as never; });
});
afterEach(() => {
  for (const runtime of runtimes) runtime.close();
  delete globalReplica.__pfcReplica;
  vi.useRealTimers(); vi.unstubAllEnvs(); vi.clearAllMocks();
  rmSync(directory, { recursive: true, force: true });
});
async function start() { const runtime = await openReplica(env); runtimes.push(runtime); return runtime; }

describe("replica lifecycle", () => {
  it("bootstraps before exposing a client, verifies schema, and keeps only safe public status", async () => {
    const runtime = await start();
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({ syncUrl: env.DATABASE_URL, offline: false, readYourWrites: true, syncInterval: 0 }));
    expect(runtime.status()).toMatchObject({ state: "ready", revision: 1, mode: "replica", intervalSeconds: 30 });
    expect(JSON.stringify(runtime.status())).not.toContain("test-key");
    expect(statSync(env.TURSO_REPLICA_PATH!).mode & 0o777).toBe(0o600);
    expect(existsSync(`${env.TURSO_REPLICA_PATH}.lock`)).toBe(true);
    runtime.close(); runtime.close();
    expect(existsSync(`${env.TURSO_REPLICA_PATH}.lock`)).toBe(false);
    await expect(runtime.sync()).rejects.toMatchObject({ status: 503 });
  });
  it("deduplicates concurrent syncs and does not update revision on unchanged data", async () => {
    const runtime = await start();
    raw.sync.mockResolvedValue({ frames_synced: 0 });
    const first = runtime.sync();
    expect(runtime.status().state).toBe("syncing");
    expect(runtime.sync()).toBe(first);
    await first;
    expect(raw.sync).toHaveBeenCalledTimes(2);
    expect(runtime.status().revision).toBe(1);
  });
  it("preserves local reads after network failure, rejects writes, and recovers", async () => {
    const runtime = await start();
    const last = runtime.status().lastSuccessfulSyncAt;
    raw.sync.mockRejectedValueOnce(new Error("offline"));
    await expect(runtime.sync()).rejects.toThrow("offline");
    expect(runtime.status()).toMatchObject({ state: "unavailable", lastSuccessfulSyncAt: last });
    await runtime.client.execute("SELECT 1");
    await expect(runtime.client.execute("INSERT INTO account VALUES (1)")).rejects.toMatchObject({ code: "DATABASE_UNAVAILABLE" });
    await runtime.sync();
    await runtime.client.execute("INSERT INTO account VALUES (1)");
    expect(runtime.status().state).toBe("ready");
  });
  it("serializes a write behind a pending sync", async () => {
    const runtime = await start();
    let release!: (value: { frames_synced: number }) => void;
    raw.sync.mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    const sync = runtime.sync();
    const write = runtime.client.execute("INSERT INTO account VALUES (1)");
    await Promise.resolve();
    release({ frames_synced: 1 });
    await Promise.all([sync, write]);
    expect(runtime.status().state).toBe("ready");
  });
  it("refreshes before a write when the snapshot is too old", async () => {
    vi.useFakeTimers();
    const runtime = await start();
    vi.setSystemTime(Date.now() + 31000);
    await runtime.client.execute("INSERT INTO account VALUES (1)");
    expect(raw.sync).toHaveBeenCalledTimes(2);
  });
  it("runs one periodic sync and stops the timer on close", async () => {
    vi.useFakeTimers();
    const runtime = await start();
    raw.sync.mockRejectedValueOnce(new Error("network"));
    await vi.advanceTimersByTimeAsync(30000);
    expect(runtime.status().state).toBe("unavailable");
    await vi.advanceTimersByTimeAsync(30000);
    expect(runtime.status().state).toBe("ready");
    runtime.close();
    await vi.advanceTimersByTimeAsync(60000);
    expect(raw.sync).toHaveBeenCalledTimes(3);
  });
  it.each([1, journal.entries.at(-1)!.when + 1])("refuses incompatible schema %s instead of serving an empty database", async version => {
    raw.execute.mockResolvedValue({ rows: [{ version }] });
    await expect(start()).rejects.toThrow("schema");
    expect(raw.close).toHaveBeenCalledOnce();
    expect(existsSync(`${env.TURSO_REPLICA_PATH}.lock`)).toBe(false);
  });
  it("releases the reservation on client construction and initial sync failure", async () => {
    vi.mocked(createClient).mockImplementationOnce(() => { throw new Error("native unavailable"); });
    await expect(start()).rejects.toThrow("native unavailable");
    raw.sync.mockRejectedValueOnce(new Error("offline"));
    await expect(start()).rejects.toThrow("offline");
    expect(existsSync(`${env.TURSO_REPLICA_PATH}.lock`)).toBe(false);
    await start();
  });
  it("shares initialization across bundles and prevents configuration switches", async () => {
    const first = getReplicaRuntime(env);
    expect(getReplicaRuntime(env)).toBe(first);
    runtimes.push(await first);
    expect(createClient).toHaveBeenCalledOnce();
    expect(() => getReplicaRuntime({ ...env, TOKEN: "another" })).toThrow("Restart");
  });
  it("allows initialization retry after failure", async () => {
    raw.sync.mockRejectedValueOnce(new Error("offline"));
    await expect(getReplicaRuntime(env)).rejects.toThrow("offline");
    runtimes.push(await getReplicaRuntime(env));
    expect(createClient).toHaveBeenCalledTimes(2);
  });
  it("returns non-replica statuses without accessing the filesystem or remote", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    expect((await getDatabaseSyncStatus()).mode).toBe("demo");
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("DATABASE_URL", "file:local.db");
    expect((await synchronizeDatabase()).mode).toBe("local");
    vi.stubEnv("DATABASE_URL", "libsql://example.invalid");
    expect((await getDatabaseSyncStatus()).mode).toBe("remote");
    expect(createClient).not.toHaveBeenCalled();
  });
  it("exposes degraded sync status without secrets", async () => {
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("DATABASE_URL", env.DATABASE_URL); vi.stubEnv("TOKEN", "test");
    vi.stubEnv("TURSO_REPLICA_PATH", env.TURSO_REPLICA_PATH); vi.stubEnv("DATA_ENCRYPTION_KEY", "test-key");
    runtimes.push(await getReplicaRuntime(getServerEnv()));
    raw.sync.mockRejectedValueOnce(new Error("secret URL"));
    expect((await synchronizeDatabase()).state).toBe("unavailable");
    expect((await getDatabaseSyncStatus()).lastSuccessfulSyncAt).not.toBeNull();
  });
});

describe("replica file ownership", () => {
  it("rejects a second process and leaves the first lock intact", () => {
    const reservation = reserveReplica(env.TURSO_REPLICA_PATH!, env.DATABASE_URL, "key");
    try {
      expect(() => reserveReplica(env.TURSO_REPLICA_PATH!, env.DATABASE_URL, "key")).toThrow("reserved");
      expect(JSON.parse(readFileSync(`${reservation.file}.lock`, "utf8")).pid).toBe(process.pid);
    } finally { reservation.release(); }
  });
  it("rejects another remote or encryption key, and reopens the same identity", () => {
    const path = env.TURSO_REPLICA_PATH!;
    reserveReplica(path, env.DATABASE_URL, "key").release();
    expect(() => reserveReplica(path, "libsql://another.invalid", "key")).toThrow("another database");
    expect(() => reserveReplica(path, env.DATABASE_URL, "new-key")).toThrow("another database");
    reserveReplica(path, env.DATABASE_URL, "key").release();
  });
  it("refuses an existing independent database and symbolic link", () => {
    const path = join(directory, "standalone.db");
    writeFileSync(path, "important data");
    expect(() => reserveReplica(path, env.DATABASE_URL, "key")).toThrow("existing database");
    expect(readFileSync(path, "utf8")).toBe("important data");
    const alias = join(directory, "alias.db"); symlinkSync(path, alias);
    expect(() => reserveReplica(alias, env.DATABASE_URL, "key")).toThrow("symbolic");
  });
});
