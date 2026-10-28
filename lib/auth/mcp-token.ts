import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";

export function hashMcpToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function generateMcpToken() { return randomBytes(32).toString("base64url"); }
export async function verifyMcpToken(authorization: string | null) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization ?? "");
  if (!match) return false;
  return Boolean(await getAuthDatabase().select({ email: authorizedUsers.email }).from(authorizedUsers)
    .where(eq(authorizedUsers.mcpTokenHash, hashMcpToken(match[1]))).get());
}
