import { rm } from "node:fs/promises";

import { getServerEnv } from "@/lib/env";

async function main() {
  const env = getServerEnv();

  if (!env.DATABASE_URL.startsWith("file:")) {
    throw new Error("db:reset is restricted to local file-based databases.");
  }

  const filePath = env.DATABASE_URL.replace(/^file:/, "");
  await rm(filePath, { force: true });

  console.log(`Removed local database at ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
