/** Run with: node --import tsx tests/integration/replica.ts (isolated sqld on port 18089). */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrateDatabase } from "../../lib/db/migrate";
import { protectContentPersistence } from "../../lib/db/content-persistence";
import * as schema from "../../lib/db/schema";
import { openReplica } from "../../lib/db/replica";
import type { ServerEnv } from "../../lib/env";
import type { ReplicaRuntime } from "../../lib/interfaces/database-replica";
import { createAccount, listAccounts } from "../../lib/server/accounts";

async function main() {
  // No dotenv URL or production key can select the target of this test.
  process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 19).toString("base64");
  const remote = createClient({ url: "http://127.0.0.1:18089" });
  const directory = await mkdtemp(join(tmpdir(), "pfc-replica-integration-"));
  const replicas: ReplicaRuntime[] = [];
  const environment = (name: string): ServerEnv => ({
    NODE_ENV: "test", DEMO_MODE: false, DATABASE_URL: "http://127.0.0.1:18089",
    DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
    TURSO_REPLICA_PATH: join(directory, name, "finance.db"), TURSO_SYNC_INTERVAL: 3600,
    INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES: 30,
  });
  try {
    await migrateDatabase(remote);
    const a = await openReplica(environment("a")); replicas.push(a);
    const b = await openReplica(environment("b")); replicas.push(b);
    const dbA = protectContentPersistence(drizzle({ client: a.client, schema }));
    const dbB = protectContentPersistence(drizzle({ client: b.client, schema }));
    const accountName = `Replica integration ${randomUUID()}`;
    const account = await createAccount({ name: accountName, type: "checking", initialBalanceCents: 12345 }, dbA);
    assert.equal((await listAccounts({}, dbA)).find(row => row.id === account.id)?.name, accountName);
    const persisted = await remote.execute({ sql: "SELECT name FROM accounts WHERE id = ?", args: [account.id] });
    assert.match(String(persisted.rows[0].name), /^pfc:v2:/);
    assert.equal((await listAccounts({}, dbB)).some(row => row.id === account.id), false);
    await b.sync();
    assert.equal((await listAccounts({}, dbB)).find(row => row.id === account.id)?.initialBalanceCents, 12345);
    await assert.rejects(dbA.transaction(async tx => {
      await tx.insert(schema.accounts).values({ name: "Rolled back", type: "checking", initialBalanceCents: 0 });
      throw new Error("rollback probe");
    }), /rollback probe/);
    assert.equal((await listAccounts({}, dbA)).some(row => row.name === "Rolled back"), false);
    await Promise.all([a.sync(), b.sync(), listAccounts({}, dbA), listAccounts({}, dbB)]);
    a.close();
    await rm(join(directory, "a"), { recursive: true });
    const restored = await openReplica(environment("a")); replicas.push(restored);
    const recovered = protectContentPersistence(drizzle({ client: restored.client, schema }));
    assert.equal((await listAccounts({}, recovered)).find(row => row.id === account.id)?.name, accountName);
    if (process.argv.includes("--stop-test-server")) {
      execFileSync("docker", ["stop", "pfc-replica-integration"], { stdio: "ignore" });
      await assert.rejects(restored.sync());
      assert.equal((await listAccounts({}, recovered)).find(row => row.id === account.id)?.name, accountName);
      await assert.rejects(createAccount({ name: "Must not persist", type: "checking", initialBalanceCents: 0 }, recovered), /Sincronização indisponível/);
      console.log("PASS: real network outage preserves local reads and rejects writes.");
    }
    console.log("PASS: remote commit, encrypted storage, read-your-writes, second replica, rollback, concurrent sync/read and recovery.");
  } finally {
    for (const replica of replicas) replica.close();
    remote.close();
    await rm(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
