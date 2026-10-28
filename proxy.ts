import { authConfig, isAllowedOrigin } from "@/lib/auth/config";
import { readSession, readUnlock } from "@/lib/auth/local-session";
import { setUnlockCookie } from "@/lib/auth/cookies";
import { isDemoMode } from "@/lib/demo/mode";
import { NextRequest, NextResponse } from "next/server";

const privateHeaders = { "Cache-Control": "private, no-store" };
function deny(status: number) { return NextResponse.json({ ok: false }, { status, headers: privateHeaders }); }
function destination(request: NextRequest, path: string, origin: string) {
  const url = new URL(path, origin);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url, { headers: privateHeaders });
}
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isDemoMode()) {
    if (path === "/api/pin" || path === "/api/unlock" || path.startsWith("/api/security") || path === "/api/session" || path.startsWith("/api/session/")) return deny(404);
    return NextResponse.next({ headers: privateHeaders });
  }
  if (process.env.NODE_ENV === "development" && path === "/_next/webpack-hmr" && request.method === "GET") return NextResponse.next();
  if ((path.startsWith("/_next/static/") || path === "/favicon.ico" || path === "/icon.png") && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  let origin: string;
  try { origin = authConfig().origin; } catch {
    return path === "/login" && ["GET", "HEAD"].includes(request.method) ? NextResponse.next({ headers: privateHeaders }) : deny(503);
  }
  const incoming = new URL(request.url);
  if (request.headers.get("host")) incoming.host = request.headers.get("host")!;
  // MCP has its own bearer authentication and loopback host/origin validation.
  if (path === "/api/mcp") return NextResponse.next({ headers: privateHeaders });
  if (!isAllowedOrigin(incoming.origin, origin)) {
    if (["GET", "HEAD"].includes(request.method) && !path.startsWith("/api/")) return NextResponse.redirect(new URL(path + request.nextUrl.search, origin), { headers: privateHeaders });
    return deny(403);
  }
  if ((path === "/login" && ["GET", "HEAD"].includes(request.method)) || (path === "/api/session" && ["POST", "DELETE"].includes(request.method))) return NextResponse.next({ headers: privateHeaders });
  const session = readSession(request.cookies.get("session")?.value);
  if (!session) return path.startsWith("/api/") ? deny(401) : destination(request, "/login", incoming.origin);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !isAllowedOrigin(request.headers.get("origin"), origin)) return deny(403);
  if (["/lock", "/api/pin", "/api/unlock"].includes(path)) return NextResponse.next({ headers: privateHeaders });
  const unlock = readUnlock(request.cookies.get("unlock")?.value, session);
  if (!unlock) return path.startsWith("/api/") ? deny(423) : destination(request, "/lock", incoming.origin);
  const response = NextResponse.next({ headers: privateHeaders });
  if (Date.now() - unlock.lastActivity >= 60000) setUnlockCookie(response, { ...unlock, lastActivity: Date.now() });
  return response;
}
export const config = { matcher: "/:path*" };
