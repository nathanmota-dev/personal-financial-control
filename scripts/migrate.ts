import { migrate } from "drizzle-orm/libsql/migrator";

import { getDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

async function main() {
  if (getServerEnv().DEMO_MODE) {
    console.log("Demo mode enabled; persistent migrations skipped.");
    return;
  }

  const db = getDatabase();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
