import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const sdk = vi.hoisted(() => ({ verifySessionCookie: vi.fn(), verifyIdToken: vi.fn(), createSessionCookie: vi.fn(), revokeRefreshTokens: vi.fn() }));
vi.mock("firebase-admin/app", () => ({ cert: vi.fn(), getApps: () => [{ name: "pfc-auth" }], initializeApp: vi.fn() }));
vi.mock("@/lib/auth/users", () => ({ isAuthorizedEmail: async (email: string) => email.toLowerCase() === "owner@gmail.com" }));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => sdk }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "valid" }) }), headers: async () => new Headers({ origin: "http://127.0.0.1:3007" }) }));
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { apiGuard, verifySession } from "@/lib/auth/server";
import { safeDestination, isAllowedOrigin } from "@/lib/auth/config";
import { POST, DELETE } from "@/app/api/session/route";
import { POST as revoke } from "@/app/api/session/revoke/route";
const claims = { uid: "owner", email: "owner@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" }, auth_time: Math.floor(Date.now() / 1000) };
function request(method = "POST", origin = "http://127.0.0.1:3007", cookie = "valid") {
  return new Request("http://127.0.0.1:3007/api/session", { method, headers: { origin, cookie: `session=${cookie}`, "content-type": "application/json" }, ...(method === "POST" ? { body: JSON.stringify({ idToken: "id-token" }) } : {}) });
}
beforeEach(() => {
  vi.unstubAllEnvs(); vi.clearAllMocks();
  for (const [key, value] of Object.entries({ APP_URL: "http://127.0.0.1:3007", FIREBASE_PROJECT_ID: "test", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test", NEXT_PUBLIC_FIREBASE_API_KEY: "public-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com", NEXT_PUBLIC_FIREBASE_APP_ID: "test-app", FIREBASE_CLIENT_EMAIL: "admin@test", FIREBASE_PRIVATE_KEY: "key" })) vi.stubEnv(key, value);
  sdk.verifySessionCookie.mockResolvedValue(claims); sdk.verifyIdToken.mockResolvedValue(claims); sdk.createSessionCookie.mockResolvedValue("persistent-cookie"); sdk.revokeRefreshTokens.mockResolvedValue(undefined);
});
describe("Firebase access boundary", () => {
  it("accepts local development aliases without redirects and permits HMR only in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isAllowedOrigin("http://localhost:3007", "http://127.0.0.1:3007")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000", "http://127.0.0.1:3007")).toBe(false);
    expect(isAllowedOrigin("https://evil.test", "http://127.0.0.1:3007")).toBe(false);
    const login = await proxy(new NextRequest("http://localhost:3007/login"));
    expect(login.status).toBe(200);
    expect(login.headers.get("location")).toBeNull();
    const hmr = new NextRequest("http://127.0.0.1:3007/_next/webpack-hmr", { headers: { host: "127.0.0.1:3007" } });
    expect((await proxy(hmr)).status).toBe(200);
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin("http://localhost:3007", "http://127.0.0.1:3007")).toBe(false);
    expect((await proxy(hmr)).status).toBe(307);
  });
  it("validates revocation on every request", async () => {
    await verifySession("valid"); await verifySession("valid");
    expect(sdk.verifySessionCookie).toHaveBeenCalledTimes(2);
    expect(sdk.verifySessionCookie).toHaveBeenCalledWith("valid", true);
  });
  it.each([undefined, "expired", "revoked", "invalid"])("denies absent or invalid session %s", async cookie => {
    sdk.verifySessionCookie.mockRejectedValue({ code: "auth/session-cookie-revoked" });
    await expect(verifySession(cookie)).rejects.toMatchObject({ status: 401 });
  });
  it.each([{ email: "other@gmail.com" }, { email_verified: false }, { firebase: { sign_in_provider: "password" } }])("rejects forbidden claims %j", async override => {
    sdk.verifyIdToken.mockResolvedValue({ ...claims, ...override });
    expect((await POST(request())).status).toBe(403);
    expect(sdk.createSessionCookie).not.toHaveBeenCalled();
  });
  it("rejects stale authentication and CSRF", async () => {
    sdk.verifyIdToken.mockResolvedValue({ ...claims, auth_time: Date.now() / 1000 - 301 });
    expect((await POST(request())).status).toBe(401);
    expect((await POST(request("POST", "https://evil.test"))).status).toBe(403);
    expect((await apiGuard(request("DELETE", "https://evil.test")))?.status).toBe(403);
  });
  it.each(["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token"])("rejects bad ID token %s", async code => {
    sdk.verifyIdToken.mockRejectedValue({ code });
    expect((await POST(request())).status).toBe(401);
  });
  it("fails closed for missing config and Firebase outage", async () => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", ""); expect((await POST(request())).status).toBe(503);
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "key"); sdk.verifySessionCookie.mockRejectedValue(new Error("network"));
    expect((await apiGuard(request()))?.status).toBe(503);
  });
  it.each(["http://127.0.0.1:3007", "https://finance.example"])("issues persistent cookie for %s", async origin => {
    vi.stubEnv("APP_URL", origin);
    const response = await POST(request("POST", origin));
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("Max-Age=1209600"); expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=lax"); expect(cookie).toContain("Path=/"); expect(cookie).not.toContain("Domain=");
    expect(cookie.includes("Secure")).toBe(origin.startsWith("https"));
    expect(sdk.verifyIdToken).toHaveBeenCalledWith("id-token", true);
  });
  it("local logout leaves refresh tokens intact; global logout revokes", async () => {
    expect((await DELETE(request("DELETE"))).status).toBe(200);
    expect(sdk.revokeRefreshTokens).not.toHaveBeenCalled();
    expect((await revoke(request())).status).toBe(200);
    expect(sdk.revokeRefreshTokens).toHaveBeenCalledWith("owner");
    sdk.revokeRefreshTokens.mockRejectedValue(new Error("offline"));
    const failure = await revoke(request()); expect(failure.status).toBe(503); expect(failure.headers.get("set-cookie")).toBeNull();
  });
  it.each([
    "missing", "expired", "revoked", "invalid", "unauthorized", "offline",
  ])("clears the local cookie through the proxy with a %s session", async state => {
    if (state === "unauthorized") {
      sdk.verifySessionCookie.mockResolvedValue({ ...claims, email: "removed@gmail.com" });
    } else {
      sdk.verifySessionCookie.mockRejectedValue(new Error(state));
    }
    const logoutRequest = new NextRequest("http://127.0.0.1:3007/api/session", {
      method: "DELETE",
      headers: {
        host: "127.0.0.1:3007",
        origin: "http://127.0.0.1:3007",
        ...(state === "missing" ? {} : { cookie: `session=${state}` }),
      },
    });
    const forwarded = await proxy(logoutRequest);
    expect(forwarded.headers.get("x-middleware-next")).toBe("1");
    const response = await DELETE(logoutRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("session=;");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(sdk.verifySessionCookie).not.toHaveBeenCalled();
    expect(sdk.revokeRefreshTokens).not.toHaveBeenCalled();
  });
  it.each([null, "null", "https://evil.test"])("rejects local logout with Origin %s", async origin => {
    const response = await DELETE(new Request("http://127.0.0.1:3007/api/session", {
      method: "DELETE",
      headers: origin === null ? {} : { origin },
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("clears a secure cookie on HTTPS and permits repeated logout", async () => {
    vi.stubEnv("APP_URL", "https://finance.example");
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await DELETE(new Request("https://finance.example/api/session", {
        method: "DELETE",
        headers: { origin: "https://finance.example" },
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("Secure");
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    }
  });
  it("still denies global revocation and financial access with a revoked session", async () => {
    sdk.verifySessionCookie.mockRejectedValue({ code: "auth/session-cookie-revoked" });
    const response = await revoke(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(sdk.revokeRefreshTokens).not.toHaveBeenCalled();
    for (const path of ["/api/session/revoke", "/api/accounts"]) {
      const denied = await proxy(new NextRequest(`http://127.0.0.1:3007${path}`, {
        method: "POST",
        headers: { host: "127.0.0.1:3007", origin: "http://127.0.0.1:3007", cookie: "session=revoked", "content-type": "application/json" },
      }));
      expect(denied.status).toBe(401);
    }
  });
  it("accepts internal filters and rejects external destinations", () => {
    expect(safeDestination("/transactions?month=2026-10")).toBe("/transactions?month=2026-10");
    for (const target of ["https://evil.test", "//evil.test", "/\\evil.test", "/login", "/api/accounts", "/%6cogin", "/%61pi/accounts", "/%2f/evil.test", "/%", "/api"]) expect(safeDestination(target)).toBe("/dashboard");
  });
  it("proxy blocks unknown routes and all API methods and preserves filters", async () => {
    for (const method of ["GET", "POST", "HEAD", "OPTIONS", "PUT", "DELETE"]) {
      const response = await proxy(new NextRequest("http://127.0.0.1:3007/api/unknown", { method, headers: { host: "127.0.0.1:3007" } }));
      expect(response.status).toBe(401);
    }
    const response = await proxy(new NextRequest("http://127.0.0.1:3007/transactions?month=2026-10", { headers: { host: "127.0.0.1:3007" } }));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).searchParams.get("next")).toBe("/transactions?month=2026-10");
    const alias = await proxy(new NextRequest("http://localhost:3007/login"));
    expect(alias.headers.get("location")).toBe("http://127.0.0.1:3007/login");
  });
  it("direct calls to all financial API handlers fail before reading input", async () => {
    const routes = import.meta.glob("../app/api/**/route.ts");
    for (const [path, load] of Object.entries(routes)) {
      if (path.includes("session")) continue;
      const route = await load() as Record<string, (request: Request, context: { params: Promise<{ id: string; invoiceMonth: string }> }) => Promise<Response>>;
      for (const method of ["GET", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
        if (!route[method]) continue;
        const denied = await route[method](new Request("http://127.0.0.1:3007/api/test", { method }), { params: Promise.resolve({ id: "test", invoiceMonth: "2026-10" }) });
        expect(denied.status, path + " " + method).toBe(401);
        expect(denied.headers.get("cache-control")).toBe("private, no-store");
      }
    }
  }, 30000);
  it("direct calls to all 44 Server Actions stop on invalid session", async () => {
    sdk.verifySessionCookie.mockRejectedValue({ code: "auth/session-cookie-revoked" });
    const actions = await import("@/app/actions/finance");
    for (const action of Object.values(actions)) {
      await expect((action as () => Promise<unknown>)()).rejects.toMatchObject({ status: 401 });
    }
  });
  it("every financial handler/action/page begins with a guard", () => {
    function files(directory: string): string[] { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]); }
    for (const file of files("app/api").filter(file => file.endsWith("route.ts") && !file.includes("session"))) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/async function handle\w+\([^]*?\) \{([^]*?)\n\}/g)) expect(match[1].trim().startsWith("const denied = await apiGuard(")).toBe(true);
    }
    const actions = readFileSync("app/actions/finance.ts", "utf8");
    expect([...actions.matchAll(/export async function/g)]).toHaveLength(44);
    expect([...actions.matchAll(/await requireActionSession\(\)/g)]).toHaveLength(44);
    for (const file of files("app/(finance)").filter(file => file.endsWith("page.tsx"))) expect(readFileSync(file, "utf8")).toContain("await requirePageSession();");
  });
});
