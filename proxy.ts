import { NextRequest, NextResponse } from "next/server";
import { apiGuard, authResponse, verifySession, firebaseError } from "@/lib/auth/server";
import { authConfig, isAllowedOrigin } from "@/lib/auth/config";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (process.env.NODE_ENV === "development" && path === "/_next/webpack-hmr" && request.method === "GET") return NextResponse.next();
  const asset = path.startsWith("/_next/static/") || path === "/icon.png" || path === "/favicon.ico";
  if (asset && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  let origin: string;
  try { origin = authConfig().origin; } catch (error) {
    if (path === "/login" && ["GET", "HEAD"].includes(request.method)) {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
    return authResponse(error);
  }
  // NextURL normalizes loopback IPs to localhost; retain the HTTP Host for
  // canonical-origin checks so 127.0.0.1 remains a valid configured origin.
  const incoming = new URL(request.url);
  if (request.headers.get("host")) incoming.host = request.headers.get("host")!;
  if (!isAllowedOrigin(incoming.origin, origin)) {
    if (["GET", "HEAD"].includes(request.method) && !path.startsWith("/api/")) return NextResponse.redirect(new URL(path + request.nextUrl.search, origin), { headers: { "Cache-Control": "private, no-store" } });
    return Response.json({ ok: false }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  // Session creation and local logout validate Origin in their own handlers.
  // Neither requires an existing valid session; global revocation still does.
  const publicSessionMethod = path === "/api/session" && ["POST", "DELETE"].includes(request.method);
  if (!(path === "/login" && ["GET", "HEAD"].includes(request.method)) && !publicSessionMethod) {
    if (path.startsWith("/api/")) {
      const denied = await apiGuard(request);
      if (denied) return denied;
    } else {
      try { await verifySession(request.cookies.get("session")?.value); }
      catch (error) {
        if (firebaseError(error).status !== 401) return authResponse(error);
        const login = new URL("/login", incoming.origin);
        login.searchParams.set("next", path + request.nextUrl.search);
        return NextResponse.redirect(login, { headers: { "Cache-Control": "private, no-store" } });
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        const denied = await apiGuard(request);
        // Server Actions use multipart or text; their own guard checks Origin.
        if (denied && denied.status !== 415) return denied;
      }
    }
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: "/:path*" };
