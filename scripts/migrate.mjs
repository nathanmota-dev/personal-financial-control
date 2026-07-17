import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url =
  process.env.DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  "file:./.local/personal-finance.db";
const authToken = url.startsWith("file:")
  ? undefined
  : process.env.TOKEN || process.env.TURSO_AUTH_TOKEN;

const demoMode = ["true", "1", "yes", "on"].includes(
  process.env.DEMO_MODE?.trim().toLowerCase() || ""
);

if (demoMode) {
  console.log("Demo mode enabled; persistent migrations skipped.");
} else {
  const client = createClient({ url, authToken });
  const database = drizzle({ client });

  await migrate(database, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}
