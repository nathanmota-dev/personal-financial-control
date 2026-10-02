import "server-only";
import { createClient } from "@libsql/client";

// Authorization always uses the persistent database, including in DEMO_MODE.
export async function isAuthorizedEmail(email: string) {
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./.local/personal-finance.db";
  const client = createClient({ url, authToken: url.startsWith("file:") ? undefined : process.env.TOKEN ?? process.env.TURSO_AUTH_TOKEN });
  try {
    const result = await client.execute({ sql: "SELECT email FROM authorized_users WHERE email = ? LIMIT 1", args: [email.trim().toLowerCase()] });
    return result.rows.length === 1;
  } finally {
    client.close();
  }
}
