import { isDemoMode } from "@/lib/demo/mode";
import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies,headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import { authConfig,isAllowedOrigin } from "./config";
import { getAuthorizedUser, isAuthorizedEmail } from "./users";
import { readSession, readUnlock } from "./local-session";

export class AuthError extends Error {
  constructor(public status: number) { super(status === 423 ? "Destrave o app." : status === 403 ? "Acesso não permitido." : status === 503 ? "Autenticação indisponível." : "Entre novamente."); }
}
export async function adminAuth() {
  try {
    const config = authConfig();
    // Demo requests must not load the SDK or its runtime dependencies.
    const [{ cert, getApps, initializeApp }, { getAuth }] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
    ]);
    const app = getApps().find(app => app.name === "pfc-auth") ?? initializeApp({ credential: cert({ projectId: config.projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n") }) }, "pfc-auth");
    return getAuth(app);
  } catch { throw new AuthError(503); }
}
export async function authorizeClaims(token: DecodedIdToken) {
  if (token.email_verified !== true || token.firebase?.sign_in_provider !== "google.com" || !token.email || !await isAuthorizedEmail(token.email)) throw new AuthError(403);
  return token;
}
export function firebaseError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const code = (error as { code?: string })?.code;
  return new AuthError(["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/argument-error", "auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/invalid-session-cookie", "auth/user-disabled", "auth/user-not-found"].includes(code || "") ? 401 : 503);
}
export async function verifyLocalSession(cookie?: string) {
  if (isDemoMode()) throw new AuthError(404);
  const session = readSession(cookie);
  if (!session) throw new AuthError(401);
  const user = await getAuthorizedUser(session.email);
  if (!user || user.sessionVersion !== session.ver) throw new AuthError(401);
  return { ...session, name: user.displayName ?? session.name, user };
}
export function requestCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}
function requireUnlock(value: string | undefined, session: Awaited<ReturnType<typeof verifyLocalSession>>) {
  if (!session.user.pinHash || session.user.pinResetRequested || !readUnlock(value, session, session.user)) throw new AuthError(423);
}
export function checkOrigin(requestHeaders: Headers, demoOrigin?: string) {
  if (isDemoMode()) {
    const origin = requestHeaders.get("origin");
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    try {
      if (origin && (demoOrigin ? origin === demoOrigin : new URL(origin).host === host)) return;
    } catch {}
    throw new AuthError(403);
  }
  let origin: string;
  try { origin = authConfig().origin; } catch { throw new AuthError(503); }
  if (!isAllowedOrigin(requestHeaders.get("origin"), origin)) throw new AuthError(403);
}
export async function apiGuard(request: Request) {
  try {
    if (!isDemoMode()) await requireRequestSession(request);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      checkOrigin(request.headers, new URL(request.url).origin);
      if (request.method !== "DELETE" && request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AuthError(415);
    }
    return null;
  } catch (error) { return authResponse(error); }
}
export async function requireRequestSession(request: Request, unlocked = true) {
  const session = await verifyLocalSession(requestCookie(request, "session"));
  if (unlocked) requireUnlock(requestCookie(request, "unlock"), session);
  return session;
}
export async function sessionMutation(request: Request, unlocked = false) {
  const session = await requireRequestSession(request, unlocked);
  checkOrigin(request.headers);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AuthError(415);
  return session;
}
export function authResponse(error: unknown) {
  const failure = firebaseError(error);
  return Response.json({ ok: false, error: failure.message }, { status: failure.status, headers: { "Cache-Control": "private, no-store" } });
}
// Layout and page share one lookup per render.
export const requirePageSession = cache(async (unlocked = true) => {
  if (isDemoMode()) return { name: "Visitante demo", picture: null };
  try {
    const jar = await cookies();
    const session = await verifyLocalSession(jar.get("session")?.value);
    if (unlocked) requireUnlock(jar.get("unlock")?.value, session);
    return session;
  } catch (error) {
    const failure = firebaseError(error);
    if (failure.status === 401) redirect("/login");
    if (failure.status === 423) redirect("/lock");
    throw failure;
  }
});
export async function requireActionSession() {
  if (!isDemoMode()) {
    const jar = await cookies();
    const session = await verifyLocalSession(jar.get("session")?.value);
    requireUnlock(jar.get("unlock")?.value, session);
  }
  checkOrigin(await headers());
}
