import { SESSION_SECONDS } from "@/lib/auth/config";
import { adminAuth, AuthError, authorizeClaims, authResponse, checkOrigin, requestCookie, verifyLocalSession } from "@/lib/auth/server";
import { clearSession, cookieOptions } from "@/lib/auth/cookies";
import { createSession, signCookie } from "@/lib/auth/local-session";
import { getAuthorizedUser } from "@/lib/auth/users";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";
import { and, eq, sql } from "drizzle-orm";
import { isDemoMode } from "@/lib/demo/mode";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (isDemoMode()) throw new AuthError(404);
    checkOrigin(request.headers);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new AuthError(415);
    const body = await request.json().catch(() => { throw new AuthError(400); });
    if (typeof body?.idToken !== "string" || !body.idToken || body.idToken.length > 20000) throw new AuthError(400);
    const token = await authorizeClaims(await (await adminAuth()).verifyIdToken(body.idToken, true));
    const age = Date.now() / 1000 - token.auth_time;
    if (!Number.isFinite(age) || age < -30 || age > 300) throw new AuthError(401);
    const user = await getAuthorizedUser(token.email!);
    if (!user) throw new AuthError(403);
    const session = createSession({ email: user.email, uid: token.uid, name: token.name, picture: token.picture }, user.sessionVersion);
    const response = clearSession();
    response.cookies.set("session", signCookie(session, "session"), { ...cookieOptions(), maxAge: SESSION_SECONDS });
    return response;
  } catch (error) { return authResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    if (isDemoMode()) throw new AuthError(404);
    checkOrigin(request.headers);
    const reset = request.headers.get("x-session-intent") === "pin-reset";
    try {
      const session = await verifyLocalSession(requestCookie(request, "session"));
      await (await getAuthDatabase()).update(authorizedUsers).set({
        sessionVersion: sql`${authorizedUsers.sessionVersion} + 1`,
        ...(reset ? { pinResetRequested: true } : {}),
      }).where(and(eq(authorizedUsers.email, session.email), eq(authorizedUsers.sessionVersion, session.ver)));
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) throw error;
    }
    return clearSession();
  } catch (error) { return authResponse(error); }
}
