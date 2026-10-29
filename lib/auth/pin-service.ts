import { and, eq } from "drizzle-orm";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";
import { AuthError } from "./server";
import { hashPin, verifyPin } from "./pin";
import type { LocalSession } from "@/lib/interfaces/local-auth";

// Serialize read/check/write so parallel wrong guesses cannot evade the fifth-attempt lockout.
export async function applyPin(session: LocalSession, operation: "setup" | "change" | "unlock", pin: string, currentPin?: string) {
  const hash = operation === "unlock" ? undefined : await hashPin(pin);
  return (await getAuthDatabase()).transaction(async transaction => {
    const condition = and(eq(authorizedUsers.email, session.email), eq(authorizedUsers.sessionVersion, session.ver));
    const user = await transaction.select().from(authorizedUsers).where(condition).get();
    if (!user) throw new AuthError(401);
    if (operation === "setup") {
      if (user.pinHash && !user.pinResetRequested) throw new AuthError(403);
    } else {
      if (!user.pinHash || user.pinResetRequested) throw new AuthError(403);
      if (!await verifyPin(operation === "change" ? currentPin! : pin, user.pinHash)) {
        const attempts = user.pinFailedAttempts + 1;
        const lockedOut = attempts >= 5;
        await transaction.update(authorizedUsers).set({
          pinFailedAttempts: lockedOut ? 0 : attempts,
          sessionVersion: user.sessionVersion + (lockedOut ? 1 : 0),
        }).where(condition);
        return { ok: false as const, remaining: 5 - attempts, lockedOut };
      }
    }
    await transaction.update(authorizedUsers).set({ pinFailedAttempts: 0,
      ...(hash ? { pinHash: hash, pinResetRequested: false } : {}),
    }).where(condition);
    return { ok: true as const, user };
  }, { behavior: "immediate" });
}
