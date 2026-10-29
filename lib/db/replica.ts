import { createHash } from "node:crypto";
import { chmodSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient, type Client } from "@libsql/client";
import journal from "@/drizzle/meta/_journal.json";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import type { DatabaseSyncStatus, ReplicaGlobal, ReplicaRuntime } from "@/lib/interfaces/database-replica";
import { serializeReplicaClient } from "./replica-client";
import { databaseUnavailable } from "./replica-errors";
import { reserveReplica } from "./replica-lock";

const shared = globalThis as typeof globalThis & { __pfcReplica?: ReplicaGlobal };

async function verifySchema(client: Client) {
  const content = await client.execute("SELECT version FROM __pfc_content_migration WHERE id = 1");
  const schema = await client.execute("SELECT MAX(created_at) AS version FROM __drizzle_migrations");
  if (Number(content.rows[0]?.version) !== 2 || Number(schema.rows[0]?.version) !== journal.entries.at(-1)!.when) {
    throw new Error("Replica schema does not match this app. Run remote migrations and use the same app version on both computers.");
  }
}

export async function openReplica(env: ServerEnv): Promise<ReplicaRuntime> {
  const reservation = reserveReplica(env.TURSO_REPLICA_PATH!, env.DATABASE_URL, env.DATA_ENCRYPTION_KEY!);
  let raw: Client;
  try {
    raw = createClient({ url: pathToFileURL(reservation.file).href, syncUrl: env.DATABASE_URL,
      authToken: env.TOKEN, readYourWrites: true, offline: false, syncInterval: 0 });
    chmodSync(reservation.file, 0o600);
  } catch (error) { reservation.release(); throw error; }
  const status: DatabaseSyncStatus = { mode: "replica", state: "syncing", lastSuccessfulSyncAt: null,
    revision: 0, intervalSeconds: env.TURSO_SYNC_INTERVAL };
  let pending: Promise<DatabaseSyncStatus> | undefined;
  let closed = false;
  const failed = () => { status.state = "unavailable"; };
  const assertWritable = () => { if (closed || status.state !== "ready") throw databaseUnavailable(); };
  const guarded = serializeReplicaClient(raw, {
    failed, assertWritable,
    beforeWrite: async () => {
      if (pending) await pending;
      assertWritable();
      if (Date.now() - Date.parse(status.lastSuccessfulSyncAt!) >= status.intervalSeconds * 1000) await sync();
    },
  });
  const snapshot = () => ({ ...status });
  function sync() {
    if (closed) return Promise.reject(databaseUnavailable());
    if (pending) return pending;
    status.state = "syncing";
    pending = guarded.exclusive(async () => {
      try {
        const result = await raw.sync();
        await verifySchema(raw);
        if (result && result.frames_synced > 0) status.revision += 1;
        status.lastSuccessfulSyncAt = new Date().toISOString();
        status.state = "ready";
        return snapshot();
      } catch (error) { failed(); throw error; }
    }).finally(() => { pending = undefined; });
    return pending;
  }
  try { await sync(); }
  catch (error) { raw.close(); reservation.release(); throw error; }
  const timer = setInterval(() => { void sync().catch(() => {}); }, status.intervalSeconds * 1000);
  timer.unref();
  function close() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    process.removeListener("exit", close);
    try { raw.close(); } finally { reservation.release(); }
  }
  process.once("exit", close);
  return { client: guarded.client, status: snapshot, sync, close };
}

export function getReplicaRuntime(env = getServerEnv()) {
  const configuration = createHash("sha256").update(JSON.stringify([
    env.DATABASE_URL, env.TOKEN, env.DATA_ENCRYPTION_KEY, env.TURSO_REPLICA_PATH, env.TURSO_SYNC_INTERVAL,
  ])).digest("hex");
  if (shared.__pfcReplica && shared.__pfcReplica.configuration !== configuration) {
    throw new Error("Replica configuration changed. Restart the server before using another database.");
  }
  if (!shared.__pfcReplica) {
    const runtime = openReplica(env).catch((error) => { delete shared.__pfcReplica; throw error; });
    shared.__pfcReplica = { configuration, runtime };
  }
  return shared.__pfcReplica.runtime;
}

export async function getDatabaseSyncStatus(): Promise<DatabaseSyncStatus> {
  const env = getServerEnv();
  if (!env.DEMO_MODE && env.TURSO_REPLICA_PATH) return (await getReplicaRuntime(env)).status();
  return { mode: env.DEMO_MODE ? "demo" : env.DATABASE_URL.startsWith("file:") ? "local" : "remote",
    state: "ready", lastSuccessfulSyncAt: null, revision: 0, intervalSeconds: env.TURSO_SYNC_INTERVAL };
}

export async function synchronizeDatabase() {
  const env = getServerEnv();
  if (env.DEMO_MODE || !env.TURSO_REPLICA_PATH) return getDatabaseSyncStatus();
  const runtime = await getReplicaRuntime(env);
  try { return await runtime.sync(); } catch { return runtime.status(); }
}
