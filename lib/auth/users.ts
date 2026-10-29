import "server-only";
import { eq } from "drizzle-orm";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";

export async function getAuthorizedUser(email: string) {
  return (await getAuthDatabase()).select().from(authorizedUsers).where(eq(authorizedUsers.email, email.trim().toLowerCase())).get();
}
export async function isAuthorizedEmail(email: string) {
  return Boolean(await getAuthorizedUser(email));
}
