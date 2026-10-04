import { migrateDatabase } from "@/lib/db/migrate";
import { getServerEnv } from "@/lib/env";
import { createClient } from "@libsql/client";

async function main() {
  const env = getServerEnv();
  if (env.DEMO_MODE) { console.log("Demo mode enabled; persistent migrations skipped."); return; }
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) throw new Error("Explicit DATABASE_URL or TURSO_DATABASE_URL is required; migration never falls back to another database.");
  const client = createClient({ url: env.DATABASE_URL, authToken: env.TOKEN });
  try {
    await migrateDatabase(client);
    console.log("Migrations applied.");
  } finally { client.close(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Migration failed."); process.exitCode = 1; });
