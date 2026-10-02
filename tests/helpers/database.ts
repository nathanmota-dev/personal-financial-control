import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { migrateDatabase } from "@/lib/db/migrate";

import { createDatabase } from "@/lib/db";

export async function createTestDatabase() {
  const directory = await mkdtemp(path.join(tmpdir(), "pfc-test-"));
  const databasePath = path.join(directory, "db.sqlite");
  const db = createDatabase(`file:${databasePath}`);

  await migrateDatabase(db.$client);

  return {
    db,
    databaseUrl: `file:${databasePath}`,
    async cleanup() {
      await rm(directory, { recursive: true, force: true });
    },
  };
}
