import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";
import { authResponse, AuthError, sessionMutation } from "@/lib/auth/server";
import { unlockResponse } from "@/lib/auth/cookies";
import { isLockTimeoutOption } from "@/lib/auth/lock-timeout";
const settingsSchema = z.object({ lockTimeoutMinutes: z.number().int().refine(isLockTimeoutOption), lockOnClose: z.boolean() }).strict();
export async function PATCH(request: Request) {
  try {
    const session = await sessionMutation(request, true);
    const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuthError(400);
    const changed = await getAuthDatabase().update(authorizedUsers).set(parsed.data)
      .where(and(eq(authorizedUsers.email, session.email), eq(authorizedUsers.sessionVersion, session.ver))).returning();
    if (!changed.length) throw new AuthError(401);
    return unlockResponse(session, parsed.data);
  } catch (error) { return authResponse(error); }
}
