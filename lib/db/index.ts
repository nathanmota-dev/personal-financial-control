import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { getServerEnv } from "@/lib/env";
import * as schema from "@/lib/db/schema";

export function createDatabase(url: string, authToken?: string) {
  const client = createClient({
    url,
    authToken,
  });

  return drizzle({ client, schema });
}

export type AppDb = ReturnType<typeof createDatabase>;

let cachedDatabase: AppDb | undefined;

export function getDatabase() {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  const env = getServerEnv();
  cachedDatabase = createDatabase(env.DATABASE_URL, env.TOKEN);

  return cachedDatabase;
}
