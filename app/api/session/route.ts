import { NextResponse } from "next/server";
import { adminAuth, AuthError, authorizeClaims, authResponse, checkOrigin } from "@/lib/auth/server";
import { authConfig, SESSION_SECONDS } from "@/lib/auth/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request.headers);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new AuthError(415);
    const body = await request.json().catch(() => { throw new AuthError(400); });
    if (typeof body?.idToken !== "string" || !body.idToken || body.idToken.length > 20000) throw new AuthError(400);
    const auth = adminAuth();
    const token = await authorizeClaims(await auth.verifyIdToken(body.idToken, true));
    const age = Date.now() / 1000 - token.auth_time;
    if (!Number.isFinite(age) || age < -30 || age > 300) throw new AuthError(401);
    const cookie = await auth.createSessionCookie(body.idToken, { expiresIn: SESSION_SECONDS * 1000 });
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set("session", cookie, { httpOnly: true, sameSite: "lax", path: "/", secure: authConfig().secure, maxAge: SESSION_SECONDS });
    return response;
  } catch (error) { return authResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    // Clearing this browser's cookie must also work after expiration or revocation.
    checkOrigin(request.headers);
    const response = NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
    response.cookies.set("session", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: authConfig().secure,
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return authResponse(error);
  }
}
