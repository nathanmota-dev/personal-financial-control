import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, isAllowedOrigin } from "./config";
import { isAuthorizedEmail } from "./users";

export class AuthError extends Error {
  constructor(public status: number) { super(status === 403 ? "Acesso não permitido." : status === 503 ? "Autenticação indisponível." : "Entre novamente."); }
}
export function adminAuth() {
  try {
    const config = authConfig();
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
export async function verifySession(cookie?: string) {
  const auth = adminAuth();
  if (!cookie) throw new AuthError(401);
  try { return await authorizeClaims(await auth.verifySessionCookie(cookie, true)); } catch (error) { throw firebaseError(error); }
}
export function checkOrigin(requestHeaders: Headers) {
  let origin: string;
  try { origin = authConfig().origin; } catch { throw new AuthError(503); }
  if (!isAllowedOrigin(requestHeaders.get("origin"), origin)) throw new AuthError(403);
}
export async function apiGuard(request: Request) {
  try {
    const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith("session="))?.slice(8);
    await verifySession(cookie);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      checkOrigin(request.headers);
      if (request.method !== "DELETE" && request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AuthError(415);
    }
    return null;
  } catch (error) { return authResponse(error); }
}
export function authResponse(error: unknown) {
  const failure = firebaseError(error);
  return Response.json({ ok: false, error: failure.message }, { status: failure.status, headers: { "Cache-Control": "private, no-store" } });
}
export async function requirePageSession() {
  try { await verifySession((await cookies()).get("session")?.value); }
  catch (error) { if (firebaseError(error).status === 401) redirect("/login"); throw firebaseError(error); }
}
export async function requireActionSession() {
  await verifySession((await cookies()).get("session")?.value);
  checkOrigin(await headers());
}
