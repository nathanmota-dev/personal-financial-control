import { migrate } from "drizzle-orm/libsql/migrator";

import { getDatabase } from "@/lib/db";

async function main() {
  const db = getDatabase();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
