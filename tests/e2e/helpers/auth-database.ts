import { createClient } from "@libsql/client";
import { migrateDatabase } from "../../../lib/db/migrate";

async function initialize() {
  const client = createClient({ url: process.env.DATABASE_URL! });
  try {
    await migrateDatabase(client);
    await client.execute("INSERT INTO authorized_users (email) VALUES ('onboarding-a@example.test'), ('onboarding-b@example.test')");
  } finally { client.close(); }
}
void initialize();
