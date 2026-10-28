import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabase } from "@/lib/db";
import { authorizedUsers } from "@/lib/db/user-schema";

// Auth hashes are credentials, not searchable encrypted-content indexes.
// Reuse the existing connection with the plain authorization schema.
export function getAuthDatabase() {
  return drizzle({ client: getDatabase().$client, schema: { authorizedUsers } });
}
